import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Поиск и объяснение термина из словаря
 */
export async function explainTerm(term) {
  // Ищем в таблице терминов
  const { data } = await supabase
    .from('terms')
    .select('term, definition, examples')
    .ilike('term', `%${term}%`)
    .limit(3);

  if (!data?.length) {
    // Фоллбэк: поиск в общей базе лекций
    const { data: fallback } = await supabase
      .from('lecture_chunks')
      .select('content, source')
      .ilike('content', `%${term}%`)
      .limit(2);

    if (!fallback?.length) {
      return {
        found: false,
        message: `Термин "${term}" не найден в словаре. Попробуй перефразировать.`,
      };
    }

    return {
      found: true,
      fromDictionary: false,
      context: fallback.map((r) => r.content).join('\n'),
      source: fallback[0].source,
    };
  }

  return {
    found: true,
    fromDictionary: true,
    terms: data.map((t) => ({
      term: t.term,
      definition: t.definition,
      examples: t.examples,
    })),
  };
}
