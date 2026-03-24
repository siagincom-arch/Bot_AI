# День 1: Основы работы с ИИ-агентами

> **Источники:**
> - [Whitepaper: Introduction to Agents](https://www.kaggle.com/whitepaper-introduction-to-agents)
> - [Код: Day 1a — From Prompt to Action](https://www.kaggle.com/code/kaggle5daysofai/day-1a-from-prompt-to-action)

---

## 📝 Конспект

### Что такое ИИ-агент?

**Агент** — это не просто языковая модель. Это полноценное приложение, способное:
- **Воспринимать** информацию из окружающей среды
- **Планировать** последовательность действий для достижения цели
- **Действовать** автономно, используя инструменты

**Ключевое отличие от обычного LLM:**

| LLM | Агент |
|-----|-------|
| `Промпт → Модель → Текст` | `Промпт → Агент → Размышление → Действие → Наблюдение → Ответ` |
| Пассивная генерация | Автономное решение задач |
| Требует человека на каждом шаге | Самостоятельно определяет следующий шаг |

### Архитектура агента

Агент состоит из трёх ключевых компонентов:

```
┌─────────────────────────────┐
│         ИИ-АГЕНТ            │
├─────────────────────────────┤
│  1. Языковая модель (LM)    │  ← «мозг» агента
│  2. Инструменты (Tools)     │  ← способность действовать
│  3. Инструкции              │  ← цель и правила поведения
└─────────────────────────────┘
```

### Google Agent Development Kit (ADK)

**ADK** — это open-source фреймворк от Google для создания ИИ-агентов:
- Модульная архитектура
- Оптимизирован для моделей Gemini
- Совместим с другими LLM
- Доступен на **Python**, **Java**, **Go**

### Ключевые концепции ADK

1. **Agent** — определение агента (имя, модель, инструкции, инструменты)
2. **Runner** — оркестратор, управляющий диалогом
3. **Tools** — инструменты, расширяющие возможности агента
4. **Session** — контекст диалога (подробнее в Дне 3)

---

## 🔧 Пошаговая инструкция: Первый агент с ADK

### Шаг 1: Установка ADK

```bash
pip install google-adk
```

### Шаг 2: Получение API-ключа

1. Перейти в [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Создать новый API-ключ
3. Сохранить ключ в переменную окружения:

```python
import os
os.environ["GOOGLE_API_KEY"] = "ваш_ключ"
```

### Шаг 3: Импорт компонентов

```python
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.adk.tools import google_search
from google.genai import types
```

### Шаг 4: Настройка повторных попыток

```python
# Автоматическая обработка ошибок (rate limits, 500, 503)
retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504]
)
```

### Шаг 5: Создание агента

```python
root_agent = Agent(
    name="helpful_assistant",
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    description="Простой агент для ответов на вопросы",
    instruction="Ты — полезный помощник. Используй Google Search "
                "для актуальной информации или когда не уверен.",
    tools=[google_search],
)
```

**Ключевые параметры:**
- `name` — уникальное имя агента
- `model` — LLM для рассуждений
- `instruction` — промпт-инструкция (определяет поведение)
- `tools` — список доступных инструментов

### Шаг 6: Запуск агента

```python
runner = InMemoryRunner(agent=root_agent)

response = await runner.run_debug(
    "Что такое Agent Development Kit от Google?"
)
```

### Шаг 7: ADK Web UI (опционально)

```bash
# Создать агента из шаблона
adk create sample-agent --model gemini-2.5-flash-lite --api_key $GOOGLE_API_KEY

# Запустить веб-интерфейс
adk web
```

Откройте `http://127.0.0.1:8000` в браузере для визуального тестирования.

---

## 💡 Ключевые выводы

1. Агент **не просто генерирует текст** — он рассуждает, выбирает инструменты и действует
2. Агент сам решает, **когда и какой инструмент** использовать
3. ADK делает создание агентов похожим на **обычную разработку ПО**
4. Инструкции определяют **поведение и стратегию** агента

---

## 📚 Дополнительные ресурсы

- [ADK Документация](https://google.github.io/adk-docs/)
- [Быстрый старт для Python](https://google.github.io/adk-docs/get-started/python/)
- [Обзор агентов в ADK](https://google.github.io/adk-docs/agents/)
- [Обзор инструментов в ADK](https://google.github.io/adk-docs/tools/)
