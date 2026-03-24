/**
 * Скрипт загрузки лекций, словаря и базы знаний в Supabase
 * Запуск: npm run ingest
 * 
 * --knowledge-only  — загрузить только материалы из knowledge_base
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const LECTURES_PATH = process.env.LECTURES_PATH;
const KNOWLEDGE_PATH = join(PROJECT_ROOT, 'knowledge_base');
const CHUNK_SIZE = 800; // символов на чанк

const knowledgeOnly = process.argv.includes('--knowledge-only');

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
  const rows = text.match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|$/gm) || [];

  for (const row of rows) {
    const cells = row.split('|').filter(Boolean).map(c => c.trim());
    if (cells.length < 4) continue;

    const termCell = cells[0];
    const definition = cells[cells.length - 1];

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

/**
 * Загрузка материалов из knowledge_base/ в Supabase
 * Использует source вида 'kb_day1_agents_intro' для отличия от лекций
 */
async function ingestKnowledgeBase() {
  console.log('\n🧠 Загрузка базы знаний (knowledge_base/)...\n');

  if (!existsSync(KNOWLEDGE_PATH)) {
    console.error('❌ Папка knowledge_base/ не найдена');
    return 0;
  }

  // Загружаем все .md файлы (кроме INDEX.md — это оглавление)
  const files = readdirSync(KNOWLEDGE_PATH)
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md')
    .sort();

  if (!files.length) {
    console.log('  ⚠️ Нет файлов day*.md в knowledge_base/');
    return 0;
  }

  // Удаляем старые записи из knowledge_base, чтобы не дублировать
  const { error: delError } = await supabase
    .from('lecture_chunks')
    .delete()
    .like('source', 'kb_%');

  if (delError) {
    console.error(`  ⚠️ Не удалось очистить старые KB-записи: ${delError.message}`);
  }

  let totalChunks = 0;

  for (const file of files) {
    const filePath = join(KNOWLEDGE_PATH, file);
    try {
      const text = readFileSync(filePath, 'utf-8');
      const chunks = splitIntoChunks(text);

      // Извлекаем номер дня из имени файла (day1 → 1)
      const dayMatch = file.match(/day(\d+)/);
      const dayNum = dayMatch ? parseInt(dayMatch[1]) : null;

      const rows = chunks.map((content, i) => ({
        content,
        source: `kb_${file.replace('.md', '')}`,
        lecture_number: dayNum ? dayNum + 100 : null, // 101-105 для KB, чтобы не пересекаться с лекциями 1-5
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

  console.log(`\n📦 База знаний: ${totalChunks} фрагментов загружено`);
  return totalChunks;
}

async function main() {
  console.log('📚 Загрузка материалов в Supabase...\n');

  // Если указан флаг --knowledge-only, загружаем только KB
  if (knowledgeOnly) {
    await ingestKnowledgeBase();
    console.log('\n✅ Загрузка базы знаний завершена!');
    return;
  }

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

  // 3. Загрузка базы знаний
  await ingestKnowledgeBase();

  console.log('\n✅ Загрузка завершена!');
}

main().catch(console.error);
