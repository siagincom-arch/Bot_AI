import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Генерация квиза по теме/лекции
 * Ищет контент в базе знаний для создания вопроса на его основе
 */
export async function generateQuiz(topic, lectureNumber) {
  let data = null;

  // Стратегия 1: полнотекстовый поиск
  const tsQuery = topic
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' | ');

  if (tsQuery) {
    const { data: tsData } = await supabase
      .from('lecture_chunks')
      .select('content, source, lecture_number')
      .textSearch('content', tsQuery, { type: 'plain', config: 'russian' })
      .limit(3);

    if (tsData?.length) data = tsData;
  }

  // Стратегия 2: ILIKE фоллбэк
  if (!data?.length) {
    const { data: ilikeData } = await supabase
      .from('lecture_chunks')
      .select('content, source, lecture_number')
      .ilike('content', `%${topic}%`)
      .limit(3);

    if (ilikeData?.length) data = ilikeData;
  }

  // Стратегия 3: берём случайные чанки из KB
  if (!data?.length) {
    const { data: randomData } = await supabase
      .from('lecture_chunks')
      .select('content, source, lecture_number')
      .like('source', 'kb_%')
      .limit(3);

    if (randomData?.length) data = randomData;
  }

  if (!data?.length) {
    return {
      found: false,
      message: 'В базе знаний пока нет материалов для генерации тестов.',
    };
  }

  // Инструкция для LLM — вопрос и ответ разделены маркером
  return {
    found: true,
    context: data.map(r => r.content).join('\n\n'),
    source: data[0].source,
    lecture: data[0].lecture_number,
    isQuiz: true,
    instruction:
      'На основе этого контекста создай один тестовый вопрос с 4 вариантами ответа.\n\n' +
      'ВАЖНО: используй СТРОГО этот формат, с разделителем ---ANSWER---:\n\n' +
      '❓ **Вопрос:**\nТекст вопроса\n\n' +
      'A) вариант\nB) вариант\nC) вариант\nD) вариант\n\n' +
      'Выбери правильный ответ!\n' +
      '---ANSWER---\n' +
      '✅ Правильный ответ: X) ...\n💡 Объяснение: ...',
  };
}
