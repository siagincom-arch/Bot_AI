# Протокол работы

## Текущий фокус
MVP бота готов. В Supabase: 79 чанков (лекции + KB: 59 из knowledge_base, 20 лекций) + 93 термина. Подкаст загружен в Storage. Следующий шаг: запуск и тестирование бота.

## Последние сессии

### 2026-03-24 — Загрузка и обработка курса Google AI Agents
- **Задачи:** Извлечение материалов из X/Twitter, скрапинг whitepaper'ов и notebooks с Kaggle, перевод на русский, создание конспектов и инструкций
- **Результат:**
  - Резолвлены 10 shortened-ссылок (lnkd.in → kaggle.com)
  - Создана папка `knowledge_base/` с 6 файлами:
    - `INDEX.md` — оглавление и навигация
    - `day1_agents_intro.md` — Основы ИИ-агентов, архитектура, ADK
    - `day2_tools_and_mcp.md` — Инструменты, AgentTool, MCP
    - `day3_context_memory.md` — Сессии, память, ToolContext
    - `day4_agent_quality.md` — Качество, наблюдаемость, LLM-as-Judge
    - `day5_prototype_to_production.md` — CI/CD, A2A, Vertex AI
  - Каждый файл содержит: конспект + пошаговую инструкцию + код + ссылки
- **Источники:** Kaggle 5 Days of AI Agents, Google whitepaper'ы, ADK Documentation
- **Инсайты:** Полный стек Google для агентов: ADK (фреймворк) + Gemini (модель) + MCP/A2A (протоколы) + Vertex AI (инфраструктура)



### 2026-03-19 — Централизация API-ключей
- **Задачи:** Сканирование проектов на хардкоженные ключи, создание `~/.env.keys`, обновление `.gitignore`, добавление правила в `GEMINI.md`
- **Результат:**
  - Хардкоженных ключей не обнаружено — все проекты уже используют `process.env`
  - Создан `~/.env.keys` — шаблон с ключами для всех проектов
  - Обновлены 7 `.gitignore` (Bot_AI, Bot Multispa, Project, Project_rules, Sait ofset, Test_expo)
  - В `GEMINI.md` добавлено правило централизованного хранения ключей
- **Инсайты:** Единое хранилище ключей упрощает ротацию и предотвращает случайный коммит секретов

### 2026-03-17 — Проверка архитектуры и установка MCP
- **Задачи:** Аудит проекта, подключение MCP-серверов
- **Результат:**
  - Проверено: 6 файлов кода, архитектура v3, все инструменты, `.env`
  - Добавлен Perplexity MCP в `mcp_config.json`
  - Итого 5 MCP: Supabase, Context7, Firecrawl, OpenAI, Perplexity
  - Telegram MCP не подключён — бот уже использует Telegraf Bot API
- **Инсайты:** Telegram MCP (@overpod/mcp-telegram) работает через MTProto/userbot — не подходит для Bot API. Перплексити MCP расширяет IDE, но не заменяет API-вызов в коде бота.


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
