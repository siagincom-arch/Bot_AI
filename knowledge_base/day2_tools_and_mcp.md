# День 2: Инструменты агентов и MCP

> **Источники:**
> - [Whitepaper: Agent Tools & Interoperability with MCP](https://www.kaggle.com/whitepaper-agent-tools-and-interoperability-with-mcp)
> - [Код: Day 2a — Agent Tools](https://www.kaggle.com/code/kaggle5daysofai/day-2a-agent-tools)

---

## 📝 Конспект

### Зачем агентам нужны инструменты?

**Проблема:** Без инструментов знания агента «заморожены во времени». У него нет:
- Доступа к актуальным данным
- Связи с внешним миром
- Возможности выполнять действия

**Решение:** Инструменты (Tools) превращают изолированный LLM в полноценного агента.

### Типы инструментов в ADK

```
┌──────────────────────────────────────────────────────┐
│                  ИНСТРУМЕНТЫ ADK                     │
├────────────────────────┬─────────────────────────────┤
│    Кастомные (Custom)  │    Встроенные (Built-in)    │
├────────────────────────┼─────────────────────────────┤
│ • Function Tools       │ • Gemini Tools              │
│ • Long Running Tools   │   (google_search,           │
│ • Agent Tools          │    BuiltInCodeExecutor)      │
│ • MCP Tools            │ • Google Cloud Tools        │
│ • OpenAPI Tools        │   (BigQuery, Spanner...)    │
│                        │ • Third-party Tools         │
│                        │   (HuggingFace, Firecrawl)  │
└────────────────────────┴─────────────────────────────┘
```

### Лучшие практики создания инструментов

1. **Словарный возврат** — возвращай `{"status": "success", "data": ...}` или `{"status": "error", "error_message": ...}`
2. **Чёткие docstring'ы** — LLM использует их, чтобы понять, когда и как вызвать инструмент
3. **Аннотации типов** — ADK генерирует правильную JSON-схему
4. **Обработка ошибок** — структурированные ответы об ошибках

### Что такое MCP (Model Context Protocol)?

**MCP** — открытый стандарт для подключения ИИ к внешним инструментам и данным:
- Определяет протокол взаимодействия сервер ↔ клиент
- Обеспечивает интероперабельность между разными LLM
- Позволяет подключать файловые системы, БД, API через единый интерфейс
- **Риски безопасности** — требует аудита при подключении к корпоративным системам

### Agent Tools vs Sub-Agents

| Agent Tools (делегирование) | Sub-Agents (передача) |
|---|---|
| Агент A вызывает B как инструмент | Агент A передаёт управление B |
| Ответ B возвращается в A | B берёт полный контроль |
| A остаётся главным | A выходит из цикла |
| Пример: расчёт → вернуть результат | Пример: эскалация в поддержку |

---

## 🔧 Пошаговая инструкция: Агент с кастомными инструментами

### Шаг 1: Создание функции-инструмента

```python
def get_exchange_rate(base_currency: str, target_currency: str) -> dict:
    """Возвращает обменный курс между двумя валютами.

    Args:
        base_currency: ISO 4217 код исходной валюты (напр. "USD").
        target_currency: ISO 4217 код целевой валюты (напр. "EUR").

    Returns:
        Словарь со статусом и курсом.
    """
    rate_database = {
        "usd": {"eur": 0.93, "jpy": 157.50, "inr": 83.58}
    }

    base = base_currency.lower()
    target = target_currency.lower()
    rate = rate_database.get(base, {}).get(target)

    if rate is not None:
        return {"status": "success", "rate": rate}
    else:
        return {"status": "error",
                "error_message": f"Пара {base_currency}/{target_currency} не поддерживается"}
```

> **Важно:** Docstring, типы и структура возврата — критичны для корректной работы LLM.

### Шаг 2: Создание агента с инструментами

```python
from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini

currency_agent = LlmAgent(
    name="currency_agent",
    model=Gemini(model="gemini-2.5-flash-lite", retry_options=retry_config),
    instruction="""Ты — ассистент по конвертации валют.
    1. Используй get_fee_for_payment_method() для комиссий
    2. Используй get_exchange_rate() для курсов
    3. Проверяй поле "status" в ответах
    4. Рассчитай итог и дай разбивку""",
    tools=[get_fee_for_payment_method, get_exchange_rate],
)
```

### Шаг 3: Использование агента как инструмента (AgentTool)

```python
from google.adk.tools import AgentTool
from google.adk.code_executors import BuiltInCodeExecutor

# Агент-калькулятор с исполнением кода
calculation_agent = LlmAgent(
    name="CalculationAgent",
    model=Gemini(model="gemini-2.5-flash-lite"),
    instruction="Генерируй ТОЛЬКО Python-код для расчётов. Без текста.",
    code_executor=BuiltInCodeExecutor(),
)

# Главный агент использует калькулятор как инструмент
enhanced_agent = LlmAgent(
    name="enhanced_currency_agent",
    model=Gemini(model="gemini-2.5-flash-lite"),
    instruction="...делегируй расчёты calculation_agent...",
    tools=[
        get_fee_for_payment_method,
        get_exchange_rate,
        AgentTool(agent=calculation_agent),  # Агент как инструмент!
    ],
)
```

### Шаг 4: Запуск и тестирование

```python
from google.adk.runners import InMemoryRunner

runner = InMemoryRunner(agent=enhanced_agent)
response = await runner.run_debug(
    "Конвертируй 1250 USD в INR через банковский перевод"
)
```

---

## 💡 Ключевые выводы

1. **Любая Python-функция** может стать инструментом агента
2. **Docstring'ы** — это «инструкция для LLM», как и когда вызвать функцию
3. **AgentTool** позволяет использовать одного агента как инструмент другого
4. **BuiltInCodeExecutor** — надёжнее, чем «математика в голове» LLM
5. **MCP** — стандарт для подключения к внешним системам

---

## 📚 Дополнительные ресурсы

- [ADK Custom Tools Guide](https://google.github.io/adk-docs/tools-custom/)
- [ADK Function Tools](https://google.github.io/adk-docs/tools/function-tools/)
- [ADK Plugins Overview](https://google.github.io/adk-docs/plugins/)
