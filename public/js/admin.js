/* Kometa Dent — admin panel: sign in with the token, see appointments by day,
   confirm or cancel them. The token is kept in sessionStorage only, so it is
   forgotten when the tab is closed. */

const config = JSON.parse(document.getElementById('client-data').textContent);
const TOKEN_KEY = 'kometa-admin-token';
const REFRESH_MS = 60_000;

const $ = (selector) => document.querySelector(selector);
const els = {
  login: $('[data-login]'),
  loginForm: $('[data-login-form]'),
  loginError: $('[data-login-error]'),
  app: $('[data-app]'),
  list: $('[data-list]'),
  summary: $('[data-summary]'),
  alert: $('[data-app-alert]'),
  refresh: $('[data-refresh]'),
  logout: $('[data-logout]'),
  filters: [...document.querySelectorAll('[data-filter]')],
};

const STATUS_LABEL = { pending: 'Новая', confirmed: 'Подтверждена', cancelled: 'Отменена' };
const ERROR_TEXT = {
  admin_disabled: 'Админка выключена: на сервере не задан ADMIN_TOKEN (минимум 16 символов).',
  rate_limited: 'Слишком много неудачных попыток. Подождите 15 минут.',
  slot_taken: 'Это время уже занято другой записью — вернуть запись нельзя.',
  network: 'Нет связи с сервером. Проверьте интернет и нажмите «Обновить».',
  generic: 'Не получилось выполнить действие. Попробуйте ещё раз.',
};

let token = readToken();
let filter = 'upcoming';
let appointments = [];
let refreshTimer = null;

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function saveToken(value) {
  token = value;
  try {
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: keep the token in memory only */
  }
}

class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api/admin${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new ApiError('network', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || 'generic', res.status);
  return body;
}

/* ── Dates ─────────────────────────────────────────────────────────────── */

const todayIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: config.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const dayFormat = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const createdFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: config.timeZone,
});

function dayTitle(iso) {
  const label = dayFormat.format(new Date(`${iso}T12:00:00Z`));
  const tomorrow = new Date(`${todayIso}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (iso === todayIso) return `Сегодня, ${label}`;
  if (iso === tomorrow.toISOString().slice(0, 10)) return `Завтра, ${label}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const formatPhone = (phone) =>
  String(phone).replace(
    /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/,
    '+998\u00a0$1\u00a0$2\u00a0$3\u00a0$4',
  );

/* ── Rendering ─────────────────────────────────────────────────────────── */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.className = value;
    else if (key.includes('-') || key === 'role') node.setAttribute(key, value);
    else node[key] = value;
  }
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

function visibleAppointments() {
  if (filter === 'all') return [...appointments].reverse();
  return appointments.filter((a) => a.date >= todayIso && a.status !== 'cancelled');
}

function render() {
  const items = visibleAppointments();
  const pending = appointments.filter((a) => a.status === 'pending' && a.date >= todayIso).length;
  els.summary.textContent = pending ? `Ждут звонка: ${pending}` : 'Все новые записи обработаны';

  els.list.setAttribute('aria-busy', 'false');
  if (!items.length) {
    els.list.replaceChildren(
      el(
        'div',
        { class: 'empty' },
        el(
          'p',
          { class: 'empty__title' },
          filter === 'all' ? 'Записей пока нет' : 'Предстоящих записей нет',
        ),
        el(
          'p',
          { class: 'empty__text' },
          'Новая запись появится здесь, как только пациент отправит форму на сайте. Если подключён Telegram, придёт и уведомление.',
        ),
      ),
    );
    return;
  }

  const groups = new Map();
  for (const a of items) {
    if (!groups.has(a.date)) groups.set(a.date, []);
    groups.get(a.date).push(a);
  }

  els.list.replaceChildren(
    ...[...groups].map(([date, list]) =>
      el(
        'section',
        { class: 'day', 'aria-label': dayTitle(date) },
        el('h2', { class: 'day__title' }, dayTitle(date)),
        el('ul', { class: 'day__list', role: 'list' }, ...list.map(renderRow)),
      ),
    ),
  );
}

function renderRow(a) {
  const service = config.strings[`service.${a.service}`] ?? a.service ?? '—';
  const comment = a.comment ?? a.message ?? '';
  const actions = el('div', { class: 'row__actions' });

  if (a.status === 'pending') {
    actions.append(
      actionButton('Подтвердить', a, 'confirmed', 'btn--primary'),
      actionButton('Отменить', a, 'cancelled', 'btn--ghost'),
    );
  } else if (a.status === 'confirmed') {
    actions.append(actionButton('Отменить', a, 'cancelled', 'btn--ghost'));
  } else {
    actions.append(actionButton('Вернуть', a, 'pending', 'btn--ghost'));
  }

  return el(
    'li',
    { class: `row row--${a.status}` },
    el('p', { class: 'row__time num' }, a.time),
    el(
      'div',
      { class: 'row__who' },
      el('p', { class: 'row__name' }, a.name ?? '—'),
      el('a', { class: 'row__phone num link', href: `tel:${a.phone}` }, formatPhone(a.phone ?? '')),
    ),
    el(
      'div',
      { class: 'row__what' },
      el('p', { class: 'row__service' }, service),
      comment ? el('p', { class: 'row__comment' }, comment) : null,
      el(
        'p',
        { class: 'row__created' },
        a.createdAt ? `Заявка от ${createdFormat.format(new Date(a.createdAt))}` : '',
        a.lang === 'uz' ? ' · сайт на узбекском' : '',
      ),
    ),
    el('p', { class: `status status--${a.status}` }, STATUS_LABEL[a.status] ?? a.status),
    actions,
  );
}

function actionButton(label, appointment, status, variant) {
  const button = el('button', { class: `btn btn--small ${variant}`, type: 'button' }, label);
  button.addEventListener('click', () => changeStatus(appointment, status, button));
  return button;
}

function showSkeleton() {
  els.list.setAttribute('aria-busy', 'true');
  els.list.replaceChildren(
    ...Array.from({ length: 4 }, () =>
      el('div', { class: 'skeleton row-skeleton', 'aria-hidden': 'true' }),
    ),
  );
}

/* ── Actions ───────────────────────────────────────────────────────────── */

async function load({ quiet = false } = {}) {
  if (!quiet) showSkeleton();
  els.alert.textContent = '';
  try {
    const body = await api('/appointments');
    appointments = body.appointments;
    render();
  } catch (err) {
    handleError(err);
  }
}

async function changeStatus(appointment, status, button) {
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  els.alert.textContent = '';
  try {
    const { appointment: updated } = await api(
      `/appointments/${encodeURIComponent(appointment.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
    appointments = appointments.map((a) => (String(a.id) === String(updated.id) ? updated : a));
    render();
  } catch (err) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    handleError(err);
  }
}

function handleError(err) {
  if (err.status === 401) {
    signOut('Токен не подошёл или был изменён. Войдите снова.');
    return;
  }
  els.list.setAttribute('aria-busy', 'false');
  if (!appointments.length) els.list.replaceChildren();
  els.alert.textContent = ERROR_TEXT[err.code] ?? ERROR_TEXT.generic;
}

function showApp() {
  els.login.hidden = true;
  els.app.hidden = false;
  els.logout.hidden = false;
  load();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible') load({ quiet: true });
  }, REFRESH_MS);
}

function signOut(message = '') {
  saveToken('');
  clearInterval(refreshTimer);
  appointments = [];
  els.app.hidden = true;
  els.logout.hidden = true;
  els.login.hidden = false;
  els.loginError.textContent = message;
  const input = els.loginForm.elements.token;
  input.value = '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  input.focus();
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = els.loginForm.elements.token;
  const value = input.value.trim();
  if (!value) {
    els.loginError.textContent = 'Введите токен';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  const button = els.loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  saveToken(value);
  try {
    await api('/appointments');
    input.setAttribute('aria-invalid', 'false');
    els.loginError.textContent = '';
    showApp();
  } catch (err) {
    saveToken('');
    els.loginError.textContent =
      err.status === 401 ? 'Неверный токен' : (ERROR_TEXT[err.code] ?? ERROR_TEXT.generic);
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  } finally {
    button.disabled = false;
  }
});

els.filters.forEach((button) =>
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    els.filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }),
);

els.refresh.addEventListener('click', () => load());
els.logout.addEventListener('click', () => signOut());

if (token) showApp();
else {
  els.login.hidden = false;
  els.loginForm.elements.token.focus();
}
