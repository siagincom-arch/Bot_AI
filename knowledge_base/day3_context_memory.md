# День 3: Контекстное проектирование — сессии и память

> **Источники:**
> - [Whitepaper: Context Engineering — Sessions & Memory](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
> - [Код: Day 3a — Agent Sessions](https://www.kaggle.com/code/kaggle5daysofai/day-3a-agent-sessions)

---

## 📝 Конспект

### Что такое контекстное проектирование?

**Context Engineering** — процесс динамической сборки и управления информацией в контекстном окне LLM. Это то, что делает агентов по-настоящему полезными.

### Два типа памяти агента

```
┌─────────────────────────────────────────────────┐
│              ПАМЯТЬ АГЕНТА                       │
├────────────────────────┬────────────────────────┐
│   Кратковременная      │   Долговременная        │
│   (Sessions)           │   (Memory)              │
├────────────────────────┼────────────────────────┤
│ • История текущего     │ • Предпочтения          │
│   диалога              │   пользователя          │
│ • Контекст сессии      │ • Факты из прошлого     │
│ • Состояние задачи     │ • Накопленные знания    │
│ • Живёт пока сессия    │ • Хранится постоянно    │
│   активна              │   между сессиями        │
└────────────────────────┴────────────────────────┘
```

### Сессии в ADK

**Сессия (Session)** — это контейнер для диалога между пользователем и агентом:
- Хранит историю сообщений
- Поддерживает контекст разговора
- Управляется через `SessionService`

### Хранилища сессий

| Тип | Назначение | Персистентность |
|-----|-----------|-----------------|
| `InMemorySessionService` | Прототипирование | Нет (теряется при перезапуске) |
| `DatabaseSessionService` | Продакшен | Да (БД) |
| `VertexAiSessionService` | Облако Google | Да (Vertex AI) |

### Устойчивая память (Persistent Memory)

Позволяет агенту **учиться** на взаимодействиях:
- Запоминает предпочтения пользователя
- Адаптирует ответы со временем
- Переносит знания между сессиями

---

## 🔧 Пошаговая инструкция: Сессии и память

### Шаг 1: Создание сервиса сессий

```python
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()
```

### Шаг 2: Создание сессии

```python
session = await session_service.create_session(
    app_name="my_agent",
    user_id="user_123"
)
print(f"ID сессии: {session.id}")
```

### Шаг 3: Использование состояния сессии

```python
# Состояние сессии — словарь для хранения данных
session.state["user_language"] = "русский"
session.state["last_topic"] = "конвертация валют"
```

### Шаг 4: Агент с памятью через ToolContext

```python
from google.adk.tools import ToolContext

def remember_preference(preference: str, tool_context: ToolContext) -> dict:
    """Запоминает предпочтение пользователя в состоянии сессии.

    Args:
        preference: Предпочтение для сохранения.
        tool_context: Контекст инструмента (автоматически передаётся ADK).

    Returns:
        Статус операции.
    """
    # Доступ к состоянию сессии через tool_context
    prefs = tool_context.state.get("preferences", [])
    prefs.append(preference)
    tool_context.state["preferences"] = prefs

    return {"status": "success", "message": f"Запомнил: {preference}"}
```

### Шаг 5: Работа с Runner и сессиями

```python
from google.adk.runners import InMemoryRunner

runner = InMemoryRunner(
    agent=root_agent,
    app_name="my_agent",
    session_service=session_service
)

# Первое сообщение — создаётся сессия
response1 = await runner.run_debug("Привет, меня зовут Алексей")

# Второе сообщение — в той же сессии, агент помнит имя
response2 = await runner.run_debug("Как меня зовут?")
```

---

## 💡 Ключевые выводы

1. **Сессии** = кратковременная память в рамках одного разговора
2. **Memory** = долговременное обучение между разговорами
3. **ToolContext** — способ инструментов читать/писать в состояние сессии
4. **InMemorySessionService** — для разработки, БД-сервисы — для продакшена
5. Context Engineering — это **искусство управления** тем, что видит LLM

---

## 📚 Дополнительные ресурсы

- [ADK Sessions Documentation](https://google.github.io/adk-docs/sessions/)
- [ADK Memory Guide](https://google.github.io/adk-docs/memory/)
- [Context Engineering Best Practices](https://google.github.io/adk-docs/context/)
