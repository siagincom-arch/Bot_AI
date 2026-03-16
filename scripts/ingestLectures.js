/**
 * Скрипт загрузки лекций и словаря в Supabase
 * Запуск: npm run ingest
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const LECTURES_PATH = process.env.LECTURES_PATH;
const CHUNK_SIZE = 800; // символов на чанк

/**
 * Разбивает текст на фрагменты по абзацам, не разрывая смысл
 */
function splitIntoChunks(text, maxSize = CHUNK_SIZE) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxSize && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Парсит словарь терминов из markdown-таблицы
 */
function parseTerms(text) {
  const terms = [];
  // Ищем строки таблицы: | **Термин** | ... | ... | Объяснение |
  const rows = text.match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|$/gm) || [];

  for (const row of rows) {
    const cells = row.split('|').filter(Boolean).map(c => c.trim());
    if (cells.length < 4) continue;

    const termCell = cells[0];
    const definition = cells[cells.length - 1];

    // Извлекаем термин из **жирного** текста
    const termMatch = termCell.match(/\*\*([^*]+)\*\*/);
    if (!termMatch || termCell.includes('Термин')) continue;

    terms.push({
      term: termMatch[1],
      definition: definition,
      examples: null,
    });
  }
  return terms;
}

async function main() {
  console.log('📚 Загрузка лекций и словаря в Supabase...\n');

  // 1. Загрузка лекций
  const lectureFiles = [
    { file: 'Lekcija_01/lesson.md', num: 1 },
    { file: 'Lekcija_02/lesson2.md', num: 2 },
    { file: 'Lekcija_03/lesson3.md', num: 3 },
    { file: 'Lekcija_04/lesson4.md', num: 4 },
    { file: 'Lekcija_05/lesson5.md', num: 5 },
    { file: 'reglament.md', num: null },
  ];

  let totalChunks = 0;

  for (const { file, num } of lectureFiles) {
    const filePath = join(LECTURES_PATH, file);
    try {
      const text = readFileSync(filePath, 'utf-8');
      const chunks = splitIntoChunks(text);

      const rows = chunks.map((content, i) => ({
        content,
        source: file.split('/').pop(),
        lecture_number: num,
        chunk_index: i,
      }));

      const { error } = await supabase
        .from('lecture_chunks')
        .insert(rows);

      if (error) throw error;

      console.log(`  ✅ ${file} — ${chunks.length} фрагментов`);
      totalChunks += chunks.length;
    } catch (err) {
      console.error(`  ❌ ${file} — ${err.message}`);
    }
  }

  console.log(`\n📦 Итого: ${totalChunks} фрагментов лекций\n`);

  // 2. Загрузка словаря терминов
  try {
    const dictPath = join(LECTURES_PATH, 'slovar_terminov.md');
    const dictText = readFileSync(dictPath, 'utf-8');
    const terms = parseTerms(dictText);

    if (terms.length) {
      const { error } = await supabase
        .from('terms')
        .insert(terms);

      if (error) throw error;
      console.log(`📖 Словарь: ${terms.length} терминов загружено`);
    }
  } catch (err) {
    console.error(`❌ Словарь: ${err.message}`);
  }

  console.log('\n✅ Загрузка завершена!');
}

main().catch(console.error);
