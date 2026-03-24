# День 5: От прототипа к производству

> **Источники:**
> - [Whitepaper: Prototype to Production](https://www.kaggle.com/whitepaper-prototype-to-production)
> - [Код: Day 5a — Agent2Agent Communication](https://www.kaggle.com/code/kaggle5daysofai/day-5a-agent2agent-communication)

---

## 📝 Конспект

### Почему многие терпят неудачу на этом этапе?

Переход от прототипа к продакшену — самый сложный этап:
- **Прототип** работает в идеальных условиях
- **Продакшен** требует надёжности, масштабирования и безопасности
- Большинство агентов «ломаются» при столкновении с реальным миром

### Стратегии развёртывания

```
┌──────────────────────────────────────────────────┐
│        ПУТЬ ОТ ПРОТОТИПА К ПРОДАКШЕНУ            │
├──────────────────────────────────────────────────┤
│                                                  │
│  Прототип → Стейджинг → Канареечный → Продакшен │
│                                                  │
│  1. CI/CD пайплайн                               │
│  2. Автоматическое тестирование                  │
│  3. Постепенное развёртывание                    │
│  4. Мониторинг и откат                           │
└──────────────────────────────────────────────────┘
```

### Ключевые аспекты продакшена

1. **CI/CD для агентов** — автоматизация сборки, тестирования и деплоя
2. **Guardrails (ограничители)** — предотвращение нежелательного поведения
3. **Масштабирование** — горизонтальное расширение при росте нагрузки
4. **Латентность** — оптимизация скорости ответа

### Agent2Agent (A2A) — коммуникация между агентами

**Протокол A2A** — стандарт для взаимодействия агентов разных систем:

```
┌──────────┐         A2A Protocol         ┌──────────┐
│ Агент A  │ ◄──── JSON-RPC / HTTP ────► │ Агент B  │
│ (ADK)    │                              │ (другой  │
│          │  • Обнаружение возможностей  │  фреймворк)│
│          │  • Обмен сообщениями        │          │
│          │  • Управление задачами      │          │
└──────────┘                              └──────────┘
```

**Ключевые компоненты A2A:**
- **Agent Card** — описание возможностей агента (как визитка)
- **Tasks** — единица работы между агентами
- **Streaming** — потоковая передача результатов
- **Push Notifications** — уведомления о завершении

### Экосистема Vertex AI

Google предоставляет полную инфраструктуру для продакшен-агентов:
- **Vertex AI Agent Engine** — управляемая среда для агентов
- **Cloud Run** — серверлесс деплой
- **Cloud Logging & Monitoring** — наблюдаемость
- **IAM** — управление доступом

---

## 🔧 Пошаговая инструкция: A2A коммуникация

### Шаг 1: Создание Agent Card

```python
# Agent Card описывает возможности агента для внешнего мира
agent_card = {
    "name": "currency_converter",
    "description": "Конвертирует валюты с учётом комиссий",
    "capabilities": ["currency_conversion", "fee_calculation"],
    "endpoint": "https://my-agent.example.com/a2a",
    "version": "1.0.0"
}
```

### Шаг 2: Настройка A2A сервера

```python
# Использование ADK для запуска A2A-совместимого сервера
# adk api_server запускает HTTP-сервер с поддержкой A2A

# В командной строке:
# adk api_server --agent_dir ./my_agent --port 8080
```

### Шаг 3: Подключение удалённого агента

```python
from google.adk.tools import RemoteAgentTool

# Подключение к удалённому агенту через A2A
remote_tool = RemoteAgentTool(
    agent_card_url="https://remote-agent.example.com/.well-known/agent.json"
)

# Использование удалённого агента как инструмента
main_agent = LlmAgent(
    name="orchestrator",
    model=Gemini(model="gemini-2.5-flash-lite"),
    instruction="Координируй работу между агентами",
    tools=[remote_tool],
)
```

### Шаг 4: CI/CD пайплайн для агентов

```yaml
# Пример GitHub Actions для деплоя агента
name: Deploy AI Agent
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Установка зависимостей
        run: pip install google-adk pytest
      - name: Оценочные тесты
        run: pytest tests/eval/ -v
      - name: Проверка guardrails
        run: python tests/guardrails_check.py

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Деплой на Cloud Run
        run: |
          gcloud run deploy my-agent \
            --source . \
            --region us-central1
```

### Шаг 5: Guardrails (ограничители)

```python
from google.adk.tools import ToolContext

def safe_tool(query: str, tool_context: ToolContext) -> dict:
    """Инструмент с проверками безопасности."""

    # Guardrail: ограничение длины запроса
    if len(query) > 10000:
        return {"status": "error", "error_message": "Запрос слишком длинный"}

    # Guardrail: фильтрация опасных запросов
    blocked_patterns = ["DROP TABLE", "DELETE FROM", "rm -rf"]
    for pattern in blocked_patterns:
        if pattern.lower() in query.lower():
            return {"status": "error", "error_message": "Заблокированный запрос"}

    # Основная логика
    return {"status": "success", "result": process(query)}
```

---

## 💡 Ключевые выводы

1. **CI/CD обязателен** — агенты требуют такой же дисциплины, как обычное ПО
2. **A2A протокол** — стандарт для межагентного взаимодействия
3. **Guardrails** — необходимы для безопасного поведения в продакшене
4. **Канареечный деплой** — постепенный вывод, чтобы ловить проблемы рано
5. **Vertex AI** — полная экосистема для enterprise-агентов

---

## 📚 Дополнительные ресурсы

- [A2A Protocol Specification](https://github.com/google/A2A)
- [Vertex AI Agent Engine](https://cloud.google.com/vertex-ai/docs/agents)
- [ADK Deployment Guide](https://google.github.io/adk-docs/deploy/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
