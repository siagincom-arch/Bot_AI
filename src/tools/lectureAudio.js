import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Формирует красивое название из имени файла лекции
 */
function formatTitle(fileName, folderName) {
  const lectureNum = folderName.match(/lecture_(\d+)/)?.[1] || '?';
  const name = fileName
    .replace('.m4a', '')
    .replace(/^\d+[\._]\s*/, '')
    .replace(/_/g, ' ');
  return `Лекция ${lectureNum}: ${name}`;
}

/**
 * Формирует красивое название из имени файла подкаста
 */
function formatPodcastTitle(fileName) {
  return fileName
    .replace(/\.(m4a|mp3|wav|ogg)$/, '')
    .replace(/podcast_/i, '🎙️ Подкаст: ')
    .replace(/_/g, ' ');
}

/**
 * Список доступных аудиолекций и подкастов из Supabase Storage
 */
export async function listAvailableAudio() {
  try {
    const result = [];

    // 1. Лекции из lectures/
    const { data: folders, error: fErr } = await supabase.storage
      .from('audio-lectures')
      .list('lectures', { limit: 20 });

    if (!fErr && folders?.length) {
      for (const item of folders) {
        if (item.metadata) continue;

        const { data: files, error: filesErr } = await supabase.storage
          .from('audio-lectures')
          .list(`lectures/${item.name}`, { limit: 20 });

        if (filesErr || !files) continue;

        for (const file of files) {
          if (!file.name.endsWith('.m4a')) continue;
          result.push({
            title: formatTitle(file.name, item.name),
            path: `lectures/${item.name}/${file.name}`,
          });
        }
      }
    }

    // 2. Подкасты из podcasts/
    const { data: podcasts, error: pErr } = await supabase.storage
      .from('audio-lectures')
      .list('podcasts', { limit: 20 });

    if (!pErr && podcasts?.length) {
      for (const file of podcasts) {
        if (!file.name.match(/\.(m4a|mp3)$/)) continue;
        result.push({
          title: formatPodcastTitle(file.name),
          path: `podcasts/${file.name}`,
        });
      }
    }

    console.log(`📂 Найдено ${result.length} аудиофайлов`);
    return result;
  } catch (err) {
    console.error('Ошибка listAvailableAudio:', err.message);
    return [];
  }
}

/**
 * Отправка аудиофайла в Telegram
 * Скачиваем из Supabase → отправляем буфером (Telegram не всегда принимает M4A по URL)
 */
export async function getLectureAudio(ctx, filePath) {
  try {
    const encodedPath = filePath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-lectures/${encodedPath}`;

    // Предупреждаем пользователя о загрузке
    await ctx.reply('⏳ Подожди минутку, загружаю аудио... Файл может быть большим.');
    await ctx.sendChatAction('upload_voice');

    // Скачиваем файл в буфер
    const response = await fetch(publicUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = filePath.split('/').pop();
    const title = fileName.replace('.m4a', '').replace(/_/g, ' ');

    console.log(`📦 Скачано ${(buffer.length / 1024 / 1024).toFixed(1)} МБ, отправляю...`);

    await ctx.replyWithAudio(
      { source: buffer, filename: fileName },
      { title, performer: 'Vibecoding Course' }
    );

    console.log(`✅ Аудио отправлено: ${title}`);
  } catch (err) {
    console.error('❌ Ошибка отправки аудио:', err.message);

    // Фоллбэк: ссылка на онлайн-прослушивание
    const encodedPath = filePath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-lectures/${encodedPath}`;

    await ctx.reply(
      `🎧 Не удалось отправить файл напрямую.\n\n📎 [Слушать онлайн](${url})`,
      { parse_mode: 'Markdown' }
    );
  }
}
