# 📚 База знаний: Курс Google "5 Days of AI Agents"

> Kaggle 5-Day AI Agents Course — полный план действий по созданию ИИ-агентов
> Перевод, конспекты и инструкции на русском языке

---

## Оглавление

### День 1: Основы работы с ИИ-агентами
- **Файл:** [day1_agents_intro.md](./day1_agents_intro.md)
- **Темы:** Архитектура агентов, Google ADK, первый агент, ADK Web UI
- **Whitepaper:** [Introduction to Agents](https://www.kaggle.com/whitepaper-introduction-to-agents)
- **Notebook:** [Day 1a — From Prompt to Action](https://www.kaggle.com/code/kaggle5daysofai/day-1a-from-prompt-to-action)

---

### День 2: Инструменты агентов и MCP
- **Файл:** [day2_tools_and_mcp.md](./day2_tools_and_mcp.md)
- **Темы:** Custom Tools, AgentTool, BuiltInCodeExecutor, MCP
- **Whitepaper:** [Agent Tools & Interoperability with MCP](https://www.kaggle.com/whitepaper-agent-tools-and-interoperability-with-mcp)
- **Notebook:** [Day 2a — Agent Tools](https://www.kaggle.com/code/kaggle5daysofai/day-2a-agent-tools)

---

### День 3: Контекстное проектирование — сессии и память
- **Файл:** [day3_context_memory.md](./day3_context_memory.md)
- **Темы:** Sessions, Memory, ToolContext, SessionService
- **Whitepaper:** [Context Engineering: Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
- **Notebook:** [Day 3a — Agent Sessions](https://www.kaggle.com/code/kaggle5daysofai/day-3a-agent-sessions)

---

### День 4: Качество агентов — оценка и наблюдаемость
- **Файл:** [day4_agent_quality.md](./day4_agent_quality.md)
- **Темы:** Logging, Tracing, Metrics, LLM-as-Judge, Evaluation
- **Whitepaper:** [Agent Quality](https://www.kaggle.com/whitepaper-agent-quality)
- **Notebook:** [Day 4a — Agent Observability](https://www.kaggle.com/code/kaggle5daysofai/day-4a-agent-observability)

---

### День 5: От прототипа к производству
- **Файл:** [day5_prototype_to_production.md](./day5_prototype_to_production.md)
- **Темы:** CI/CD, Guardrails, A2A протокол, Vertex AI, масштабирование
- **Whitepaper:** [Prototype to Production](https://www.kaggle.com/whitepaper-prototype-to-production)
- **Notebook:** [Day 5a — Agent2Agent Communication](https://www.kaggle.com/code/kaggle5daysofai/day-5a-agent2agent-communication)

---

## Как использовать

1. **Последовательно** — проходите дни по порядку, каждый следующий опирается на предыдущий
2. **Конспект** — сначала читайте конспект для понимания теории
3. **Инструкция** — затем повторяйте шаги по инструкции для практики
4. **Оригинал** — при необходимости обращайтесь к whitepaper и notebook по ссылкам

## Технологический стек курса

- **Фреймворк:** Google Agent Development Kit (ADK)
- **Модель:** Gemini 2.5 Flash Lite
- **Язык:** Python
- **Протоколы:** MCP (Model Context Protocol), A2A (Agent2Agent)
- **Инфраструктура:** Vertex AI, Cloud Run, OpenTelemetry
