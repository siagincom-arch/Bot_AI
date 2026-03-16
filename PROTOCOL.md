# Протокол работы

## Текущий фокус
MVP бота создан: код написан, данные загружены, ожидаются API-ключи (Telegram + Gemini) для запуска.

## Последние сессии

### 2026-03-16 — Обновление архитектуры бота v2 → v3
- **Задачи:** Замена Perplexity → Gemini, аудиомодуль, реализация MVP бота
- **Результат:**
  - `bot_architecture_v3.md` — 11 функций, Mermaid-схемы, аудиомодуль
  - Supabase проект Bot_AI создан (`tnkwfiwzeowdhoouujrb`)
  - 6 аудиофайлов загружены в Supabase Storage (~236 МБ)
  - Код бота: 6 файлов (`index.js`, `agent.js`, 4 модуля tools)
  - База: 20 фрагментов лекций + 93 термина загружены в Supabase
- **Источники:** Gemini API docs, Supabase Storage/DB docs, Context7
- **Инсайты:** Gemini API объединяет LLM + веб-поиск + Function Calling в одном сервисе — убирает 2 платных API (OpenRouter, Perplexity), даёт 1500 бесплатных запросов/день

### 2026-03-15 — Планирование Telegram-бота для лекций
- **Задачи:** Анализ идеи, проектирование архитектуры v2
- **Результат:** Созданы `idea_analysis.md`, `bot_architecture.md` (v2)
- **Источники:** Лекции 1-5, регламент, словарь (~2800 строк учебного контента)
- **Инсайты:** 3 модуля бота: RAG (база знаний), Quiz (тренажёр), Research (исследователь)

### 2026-03-15 — Настройка правил AI-ассистента
- **Задачи:** Создание GEMINI.md для проекта Bot_AI
- **Результат:** Настроены правила планирования, ревью архитектуры, стандарты кода

## Полезные находки
- Gemini 3 Flash Preview — мультимодальная модель с бесплатным уровнем (1500 запросов/день)
- `@google/genai` SDK — нативный Node.js SDK для Gemini API, поддерживает Interactions API
- Google Search Grounding — встроенный веб-поиск в Gemini, заменяет Perplexity
- Gemini Interactions API — поддерживает цепочки function_call → function_result с previous_interaction_id
