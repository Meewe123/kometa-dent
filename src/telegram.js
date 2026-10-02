const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/**
 * Builds the staff notification. Telegram's HTML mode rejects the whole
 * message on any unknown tag, so every user-provided value is escaped.
 */
export function formatAppointmentMessage(appointment, { serviceName, siteUrl }) {
  const when = `${dateFormatter.format(new Date(`${appointment.date}T00:00:00Z`))}, ${appointment.time}`;
  const lines = [
    '<b>Новая запись с сайта</b>',
    '',
    `Имя: ${escapeHtml(appointment.name)}`,
    `Телефон: ${escapeHtml(appointment.phone)}`,
    `Услуга: ${escapeHtml(serviceName(appointment.service))}`,
    `Когда: ${escapeHtml(when)}`,
  ];
  if (appointment.comment) lines.push(`Комментарий: ${escapeHtml(appointment.comment)}`);
  if (appointment.lang === 'uz') lines.push('Язык сайта: узбекский');
  if (siteUrl) lines.push('', `Все записи: ${escapeHtml(`${siteUrl}/admin`)}`);
  return lines.join('\n');
}

/**
 * Sends messages through the Telegram Bot API. Failures are logged, never
 * thrown: the appointment is already saved and visible in /admin, so a
 * Telegram outage must not turn into an error for the patient.
 */
export function createTelegramNotifier({ token, chatId, logger, fetchImpl = fetch }) {
  return {
    async send(text) {
      try {
        const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          logger.error('telegram.failed', { status: res.status, body: body.slice(0, 300) });
          return false;
        }
        return true;
      } catch (err) {
        logger.error('telegram.failed', { err });
        return false;
      }
    },
  };
}

/** Used when Telegram is not configured (and in demo mode). */
export const nullNotifier = { send: async () => false };
