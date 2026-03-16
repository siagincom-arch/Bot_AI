import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Генерация квиза по теме/лекции
 * Подтягивает контент из базы, чтобы Gemini создал вопрос на основе реального материала
 */
export async function generateQuiz(topic, lectureNumber) {
  // Ищем релевантный контент для генерации вопроса
  let query = supabase
    .from('lecture_chunks')
    .select('content, source, lecture_number')
    .ilike('content', `%${topic}%`)
    .limit(3);

  if (lectureNumber) {
    query = query.eq('lecture_number', lectureNumber);
  }

  const { data } = await query;

  if (!data?.length) {
    return {
      found: false,
      message: `Не нашёл материалов по теме "${topic}". Попробуй другую тему.`,
    };
  }

  // Возвращаем контекст — Gemini сгенерирует вопрос на его основе
  return {
    found: true,
    context: data.map((r) => r.content).join('\n\n'),
    source: data[0].source,
    lecture: data[0].lecture_number,
    instruction:
      'На основе этого контекста создай один тестовый вопрос с 4 вариантами ответа (A, B, C, D). ' +
      'Укажи правильный ответ и краткое объяснение. Формат:\n' +
      '❓ Вопрос\nA) ...\nB) ...\nC) ...\nD) ...\n✅ Правильный ответ: X\n💡 Объяснение: ...',
  };
}
