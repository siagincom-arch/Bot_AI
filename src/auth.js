// Bot_AI — Middleware авторизации по Telegram User ID

// Разрешённые ID из переменной окружения (через запятую)
const ALLOWED_IDS = (process.env.ALLOWED_TELEGRAM_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean)
  .map(Number);

/**
 * Middleware: пропускает только пользователей из ALLOWED_TELEGRAM_IDS.
 * Если список пуст — доступ открыт всем (обратная совместимость).
 */
export function authMiddleware(ctx, next) {
  // Если список не задан — пропускаем всех
  if (ALLOWED_IDS.length === 0) return next();

  const userId = ctx.from?.id;

  if (!userId || !ALLOWED_IDS.includes(userId)) {
    console.warn(`⛔ Отказ в доступе: user_id=${userId}, username=${ctx.from?.username || '—'}`);
    return ctx.reply('⛔ Доступ ограничен. Обратитесь к администратору.');
  }

  return next();
}
