import { createClient } from '@supabase/supabase-js';
import { searchKnowledge } from './tools/searchKnowledge.js';
import { generateQuiz } from './tools/generateQuiz.js';
import { explainTerm } from './tools/explainTerm.js';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Маппинг функций
const functionHandlers = {
  search_knowledge_base: (args) => searchKnowledge(args.query),
  generate_quiz: (args) => generateQuiz(args.topic, args.lecture_number),
  explain_term: (args) => explainTerm(args.term),
};

const SYSTEM_PROMPT = `Ты — Bot_AI, умный помощник по курсу Vibecoding. 

Твои правила:
- Отвечай на русском языке
- Будь дружелюбным и лаконичным
- Используй эмодзи для структуры
- Ссылайся на конкретные лекции: [📖 Лекция X]
- Если не знаешь ответа — честно скажи об этом

У тебя есть 3 функции. Когда нужно их вызвать, ответь ТОЛЬКО JSON:

{"function":"search_knowledge_base","args":{"query":"текст запроса"}}
- Используй для вопросов по лекциям, курсу, материалам

{"function":"generate_quiz","args":{"topic":"тема","lecture_number":1}}
- Используй когда просят тест, квиз, тренажёр

{"function":"explain_term","args":{"term":"термин"}}
- Используй для "Что такое...?", "Объясни...", "Что значит...?"

Если вопрос общий и функция не нужна — отвечай обычным текстом.

Доступные лекции:
1. Введение в Vibecoding, стек, 11 этапов
2. Skills, MCP, создание регламента
3. GitHub, репозитории, автоматизация
4. Claude Code, многоагентная система
5. Дизайн, JTBD, ветки GitHub`;

/**
 * Вызов Perplexity Sonar API
 */
async function callPerplexity(messages) {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Пытается извлечь JSON-вызов функции из ответа
 */
function parseFunctionCall(text) {
  try {
    // Ищем JSON в ответе (может быть обёрнут в markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*"function"[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.function && functionHandlers[parsed.function]) {
      return parsed;
    }
  } catch { /* не JSON — обычный текстовый ответ */ }
  return null;
}

/**
 * Обработка сообщения через Perplexity с Function Calling через промпт
 */
export async function handleMessage(userText) {
  try {
    // 1. Первый вызов — определяем, нужна ли функция
    const firstResponse = await callPerplexity([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText },
    ]);

    // 2. Проверяем, вернул ли бот JSON с вызовом функции
    const funcCall = parseFunctionCall(firstResponse);

    if (!funcCall) {
      // Обычный текстовый ответ
      return firstResponse;
    }

    // 3. Выполняем функцию
    const handler = functionHandlers[funcCall.function];
    const result = await handler(funcCall.args || {});

    // 4. Второй вызов — формируем финальный ответ на основе результата
    const finalResponse = await callPerplexity([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText },
      { role: 'assistant', content: `Вызвал функцию ${funcCall.function}` },
      {
        role: 'user',
        content: `Результат функции ${funcCall.function}:\n${JSON.stringify(result, null, 2)}\n\nОтветь пользователю на основе этих данных. Будь лаконичным и полезным.`,
      },
    ]);

    return finalResponse;
  } catch (error) {
    console.error('Ошибка агента:', error.message);
    return '⚠️ Произошла ошибка при обработке запроса. Попробуйте ещё раз.';
  }
}
