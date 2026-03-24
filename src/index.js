import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { handleMessage } from './agent.js';
import { getLectureAudio, listAvailableAudio } from './tools/lectureAudio.js';
import { authMiddleware } from './auth.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Авторизация по Telegram User ID
bot.use(authMiddleware);

// Кэш аудиофайлов для inline-кнопок (callback data ограничена 64 байтами)
let audioCache = [];
// Кэш ответов квиза: chatId → answer
const quizAnswers = new Map();

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
    'Напиши тему, и я задам тебе вопрос с вариантами ответов.\n\n' +
    'Примеры:\n' +
    '• _«Тест по AgentTool»_\n' +
    '• _«Квиз по MCP»_\n' +
    '• _«Вопрос про память агентов»_\n' +
    '• _«Тест по Git»_',
    { parse_mode: 'Markdown' }
  );
});

// Обработка нажатия «Показать ответ»
bot.action(/^quiz_answer:(\d+)$/, async (ctx) => {
  const chatId = parseInt(ctx.match[1]);
  const answer = quizAnswers.get(chatId);

  if (!answer) {
    return ctx.answerCbQuery('Ответ уже был показан или недоступен.');
  }

  await ctx.answerCbQuery('✅');
  await ctx.reply(answer, { parse_mode: 'Markdown' });
  quizAnswers.delete(chatId);
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

  // Квиз — отправляем вопрос + кнопку «Показать ответ»
  if (reply?.isQuiz) {
    const chatId = ctx.chat.id;
    quizAnswers.set(chatId, reply.answer);

    await ctx.reply(reply.question, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👀 Показать ответ', `quiz_answer:${chatId}`)],
      ]),
    });
    return;
  }

  await ctx.reply(reply, { parse_mode: 'Markdown' });
});

// Запуск
bot.launch();
console.log('🤖 Bot_AI запущен');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
