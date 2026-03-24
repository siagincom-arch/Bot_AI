/**
 * Скрипт загрузки подкастов из knowledge_base/audio в Supabase Storage
 * Запуск: node scripts/uploadPodcasts.js
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const KB_PATH = join(PROJECT_ROOT, 'knowledge_base');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BUCKET = 'audio-lectures';
const AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.ogg'];

async function main() {
  console.log('🎙️ Загрузка подкастов в Supabase Storage...\n');

  // Ищем аудиофайлы напрямую в knowledge_base/
  const audioFiles = readdirSync(KB_PATH).filter(f =>
    AUDIO_EXTENSIONS.includes(extname(f).toLowerCase())
  );

  if (!audioFiles.length) {
    console.log('⚠️ Аудиофайлы не найдены в knowledge_base/');
    return;
  }

  for (const file of audioFiles) {
    const filePath = join(KB_PATH, file);
    const storagePath = `podcasts/${file}`;
    const buffer = readFileSync(filePath);
    const contentType = file.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

    console.log(`  📤 ${file} (${(buffer.length / 1024 / 1024).toFixed(1)} МБ)...`);

    // Попробуем upsert (удалить + загрузить), чтобы можно было перезаписывать
    const { error: delErr } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ ${file}: ${error.message}`);
    } else {
      console.log(`  ✅ ${file} → ${storagePath}`);
    }
  }

  console.log('\n✅ Загрузка подкастов завершена!');
}

main().catch(console.error);
