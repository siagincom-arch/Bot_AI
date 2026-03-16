import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { handleMessage } from './agent.js';
import { getLectureAudio, listAvailableAudio } from './tools/lectureAudio.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Кэш аудиофайлов для inline-кнопок (callback data ограничена 64 байтами)
let audioCache = [];

// /start — приветствие + главное меню
bot.start(async (ctx) => {
  await ctx.reply(
    '👋 *Привет! Я Bot\\_AI — твой помощник по курсу Vibecoding*\n\n' +
      'Я могу:\n' +
      '📚 Отвечать на вопросы по лекциям\n' +
      '🧠 Проверять твои знания (квизы)\n' +
      '📖 Объяснять термины\n' +
      '🎧 Отправлять аудиозаписи лекций\n\n' +
      'Выбери действие или просто напиши свой вопрос:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['📚 База знаний', '🧠 Тренажёр'],
        ['🎧 Аудиолекции', '📖 Словарь'],
      ]).resize(),
    }
  );
});

// Кнопка «Аудиолекции» — показать список
bot.hears('🎧 Аудиолекции', async (ctx) => {
  await ctx.sendChatAction('typing');
  audioCache = await listAvailableAudio();

  if (!audioCache.length) {
    return ctx.reply('❌ Аудиозаписи пока не загружены.');
  }

  // Используем короткие индексы в callback data (вместо длинных путей)
  const buttons = audioCache.map((file, i) => [
    Markup.button.callback(`🎧 ${file.title}`, `a:${i}`),
  ]);

  await ctx.reply(
    '🎧 *Доступные аудиолекции:*\n\nВыберите лекцию для прослушивания:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    }
  );
});

// Обработка нажатия на аудиокнопку (по индексу из кэша)
bot.action(/^a:(\d+)$/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const file = audioCache[index];

  if (!file) {
    return ctx.answerCbQuery('❌ Файл не найден. Нажмите 🎧 Аудиолекции снова.');
  }

  await ctx.answerCbQuery('⏳ Отправляю аудио...');
  await ctx.sendChatAction('upload_voice');
  await getLectureAudio(ctx, file.path);
});

// Кнопка «Тренажёр»
bot.hears('🧠 Тренажёр', async (ctx) => {
  await ctx.reply(
    '🧠 *Тренажёр*\n\n' +
    'Напиши тему или номер лекции, и я задам тебе вопрос.\n' +
    'Например: _«Квиз по Git»_ или _«Тест по лекции 2»_',
    { parse_mode: 'Markdown' }
  );
});

// Кнопка «Словарь»
bot.hears('📖 Словарь', async (ctx) => {
  await ctx.reply(
    '📖 *Словарь терминов*\n\n' +
    'Напиши термин, и я объясню его.\n' +
    'Например: _«Что такое MCP?»_ или _«Объясни Vibecoding»_',
    { parse_mode: 'Markdown' }
  );
});

// Кнопка «База знаний»
bot.hears('📚 База знаний', async (ctx) => {
  await ctx.reply(
    '📚 *База знаний*\n\n' +
    'Задай вопрос по любой лекции, и я найду ответ.\n' +
    'Например: _«Какие 11 этапов в Vibecoding?»_',
    { parse_mode: 'Markdown' }
  );
});

// Перехват текстовых запросов об аудио ДО отправки в LLM
const AUDIO_PATTERNS = /(?:аудио|послушать|включи|запусти|воспроизведи|прослуша)\s*(?:лекци|урок)/i;

bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  // Если пользователь спрашивает про аудио текстом — показываем список
  if (AUDIO_PATTERNS.test(text)) {
    await ctx.sendChatAction('typing');
    audioCache = await listAvailableAudio();

    if (!audioCache.length) {
      return ctx.reply('❌ Аудиозаписи пока не загружены.');
    }

    const buttons = audioCache.map((file, i) => [
      Markup.button.callback(`🎧 ${file.title}`, `a:${i}`),
    ]);

    return ctx.reply(
      '🎧 *Вот доступные аудиолекции:*\n\nНажмите на кнопку для прослушивания:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  }

  // Остальные запросы → AI-агент
  await ctx.sendChatAction('typing');
  const reply = await handleMessage(text);
  await ctx.reply(reply, { parse_mode: 'Markdown' });
});

// Запуск
bot.launch();
console.log('🤖 Bot_AI запущен');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
