# Bot_AI — Telegram-бот для курса Vibecoding

Умный помощник по учебным материалам, построенный на Perplexity Sonar API + Supabase + Telegraf.

## Возможности

- 📚 **База знаний** — поиск по лекциям курса (RAG)
- 🧠 **Тренажёр** — генерация квизов по темам
- 📖 **Словарь** — объяснение 93+ терминов
- 🎧 **Аудиолекции** — отправка M4A прямо в Telegram

## Стек

| Компонент | Технология |
|-----------|-----------|
| LLM | Perplexity Sonar API |
| БД + RAG | Supabase (PostgreSQL) |
| Аудио | Supabase Storage |
| Бот | Telegraf (Node.js) |

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env`:

```env
TELEGRAM_BOT_TOKEN=ваш_токен
PERPLEXITY_API_KEY=ваш_ключ
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=ваш_ключ
LECTURES_PATH=путь/к/лекциям
```

## Запуск

```bash
# Загрузить лекции в базу (один раз)
npm run ingest

# Запустить бота
npm start
```
