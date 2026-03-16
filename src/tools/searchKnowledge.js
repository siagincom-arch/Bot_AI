import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Семантический поиск по базе знаний (лекции, регламент, словарь)
 * Использует pgvector для поиска ближайших по смыслу фрагментов
 */
export async function searchKnowledge(query) {
  // Пока используем полнотекстовый поиск (pgvector RAG будет в итерации 2)
  const { data, error } = await supabase
    .from('lecture_chunks')
    .select('content, source, lecture_number')
    .textSearch('content', query.split(' ').join(' & '), {
      type: 'plain',
      config: 'russian',
    })
    .limit(5);

  if (error || !data?.length) {
    // Фоллбэк: простой ILIKE-поиск
    const { data: fallback } = await supabase
      .from('lecture_chunks')
      .select('content, source, lecture_number')
      .ilike('content', `%${query}%`)
      .limit(5);

    if (!fallback?.length) {
      return {
        found: false,
        message: 'По этому запросу ничего не найдено в базе знаний.',
      };
    }

    return {
      found: true,
      results: fallback.map((r) => ({
        text: r.content,
        source: r.source,
        lecture: r.lecture_number,
      })),
    };
  }

  return {
    found: true,
    results: data.map((r) => ({
      text: r.content,
      source: r.source,
      lecture: r.lecture_number,
    })),
  };
}
