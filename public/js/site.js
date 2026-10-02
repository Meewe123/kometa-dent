/* Kometa Dent — public site behaviour. Progressive enhancement: the page is
   fully readable without this script; it adds the live clock, the mobile menu
   and the booking form. */

const dataEl = document.getElementById('client-data');
const config = dataEl ? JSON.parse(dataEl.textContent) : { lang: 'ru', strings: {} };
const locale = config.lang === 'uz' ? 'uz-Latn-UZ' : 'ru-RU';

/** Looks up a UI string and fills {placeholders}. */
function t(key, vars = {}) {
  const template = config.strings[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* ── Header border after scrolling ─────────────────────────────────────── */

const header = $('[data-header]');
if (header) {
  const update = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ── Mobile menu ───────────────────────────────────────────────────────── */

const menu = $('#menu');
if (menu) {
  $('[data-menu-open]')?.addEventListener('click', () => {
    menu.showModal();
    document.documentElement.classList.add('menu-open');
  });
  menu.addEventListener('close', () => document.documentElement.classList.remove('menu-open'));
  $('[data-menu-close]', menu)?.addEventListener('click', () => menu.close());
  // Close before the browser follows an in-page link, so the scroll isn't blocked.
  $$('a', menu).forEach((link) => link.addEventListener('click', () => menu.close()));
  // Desktop layout has no menu; close it if the window is resized while open.
  window.matchMedia('(min-width: 68.01rem)').addEventListener('change', (event) => {
    if (event.matches && menu.open) menu.close();
  });
}

/* ── Live clock in the clinic's time zone ──────────────────────────────── */

const clock = $('[data-clock]');
if (clock) {
  const format = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: config.timeZone,
  });
  const tick = () => {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
    // Re-run right after the next minute starts.
    setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();
}

/* ── Mobile action bar: shown once the hero buttons scroll away ────────── */

const actionBar = $('[data-action-bar]');
const heroActions = $('[data-hero-actions]');
const bookingSection = $('#booking');
if (actionBar && heroActions && bookingSection && 'IntersectionObserver' in window) {
  const visible = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
    const show = !visible.get(heroActions) && !visible.get(bookingSection);
    actionBar.hidden = !show;
  });
  observer.observe(heroActions);
  observer.observe(bookingSection);
}

/* ── Booking form ──────────────────────────────────────────────────────── */

const form = $('[data-booking]');
if (form) initBooking(form);

function initBooking(form) {
  const els = {
    service: form.elements.service,
    days: $('[data-days]', form),
    slots: $('[data-slots]', form),
    slotsStatus: $('[data-slots-status]', form),
    submit: $('[data-submit]', form),
    alert: $('[data-form-alert]', form),
    done: $('[data-done]'),
    doneTitle: $('[data-done-title]'),
    doneText: $('[data-done-text]'),
    doneDemo: $('[data-done-demo]'),
    again: $('[data-again]'),
  };
  const defaultSubmitLabel = els.submit.textContent.trim();
  let slotsRequest = null;
  let submitted = false; // show errors live only after the first submit attempt

  form.hidden = false;

  // ── Dates in Tashkent, independent of the visitor's own time zone ──
  const isoInTashkent = (date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: config.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  const addDays = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const asDate = (iso) => new Date(`${iso}T12:00:00Z`);
  const fmt = (options) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
  const weekdayFmt = fmt({ weekday: 'short' });
  const dayMonthFmt = fmt({ day: 'numeric', month: 'short' });
  const longFmt = fmt({ weekday: 'short', day: 'numeric', month: 'long' });

  const today = isoInTashkent(new Date());
  const dates = Array.from({ length: config.bookingWindowDays }, (_, i) => addDays(today, i));

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const whenLabel = (date, time, { start = false } = {}) => {
    const day = longFmt.format(asDate(date));
    return `${start ? capitalize(day) : day}, ${time}`;
  };
  const formatPhone = (phone) =>
    phone.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998\u00a0$1\u00a0$2\u00a0$3\u00a0$4');

  // ── Render day choices ──
  els.days.replaceChildren(
    ...dates.map((date, i) => {
      const top = i === 0 ? t('today') : i === 1 ? t('tomorrow') : weekdayFmt.format(asDate(date));
      return choice({
        name: 'date',
        value: date,
        top: capitalize(top.replace('.', '')),
        sub: dayMonthFmt.format(asDate(date)).replace('.', ''),
      });
    }),
  );

  function choice({ name, value, top, sub, disabled = false, srExtra = '' }) {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.disabled = disabled;
    const box = document.createElement('span');
    box.className = 'choice__box';
    const topEl = document.createElement('span');
    topEl.className = 'choice__top';
    topEl.textContent = top;
    box.append(topEl);
    if (sub) {
      const subEl = document.createElement('span');
      subEl.className = 'choice__sub';
      subEl.textContent = sub;
      box.append(subEl);
    }
    if (srExtra) {
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = `, ${srExtra}`;
      box.append(sr);
    }
    label.append(input, box);
    return label;
  }

  const selectedDate = () => form.elements.date.value || '';
  const selectedTime = () => (form.elements.time ? form.elements.time.value || '' : '');

  // ── Slots: loading skeleton, list, empty and error states ──
  function showSkeleton() {
    els.slots.setAttribute('aria-busy', 'true');
    els.slots.replaceChildren(
      ...Array.from({ length: 12 }, () => {
        const s = document.createElement('span');
        s.className = 'skeleton';
        s.setAttribute('aria-hidden', 'true');
        return s;
      }),
    );
    els.slotsStatus.textContent = t('slots.loading');
  }

  function showMessage(text, retry) {
    const box = document.createElement('div');
    box.className = 'slots__message';
    const p = document.createElement('p');
    p.textContent = text;
    box.append(p);
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn--secondary btn--small';
      button.textContent = t('slots.retry');
      button.addEventListener('click', retry);
      box.append(button);
    }
    els.slots.setAttribute('aria-busy', 'false');
    els.slots.replaceChildren(box);
    els.slotsStatus.textContent = text;
  }

  async function loadSlots(date, { keepTime = '' } = {}) {
    slotsRequest?.abort();
    const request = new AbortController();
    slotsRequest = request;
    showSkeleton();
    updateSubmitLabel();
    try {
      const res = await fetch(`/api/slots?date=${encodeURIComponent(date)}`, {
        signal: request.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { slots } = await res.json();
      const free = slots.filter((s) => s.available);
      if (!free.length) {
        showMessage(t('slots.empty'));
        return 0;
      }
      els.slots.setAttribute('aria-busy', 'false');
      els.slots.replaceChildren(
        ...slots.map((slot) =>
          choice({
            name: 'time',
            value: slot.time,
            top: slot.time,
            disabled: !slot.available,
            srExtra: slot.available ? '' : t('slots.taken'),
          }),
        ),
      );
      if (keepTime) {
        const input = form.querySelector(`input[name="time"][value="${keepTime}"]:not(:disabled)`);
        if (input) input.checked = true;
      }
      els.slotsStatus.textContent = '';
      updateSubmitLabel();
      return free.length;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      showMessage(t('slots.error'), () => loadSlots(date, { keepTime }));
      return null;
    }
  }

  function updateSubmitLabel() {
    const date = selectedDate();
    const time = selectedTime();
    els.submit.textContent =
      date && time ? t('submitWhen', { when: whenLabel(date, time) }) : defaultSubmitLabel;
  }

  // ── Validation (mirrors the server; the server has the final word) ──
  const phoneDigits = (value) => value.replace(/\D/g, '');
  function validate() {
    const errors = {};
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    if (!els.service.value) errors.service = 'required';
    if (!selectedDate()) errors.date = 'required';
    if (!selectedTime()) errors.time = 'required';
    if (!name) errors.name = 'required';
    else if (name.length < 2) errors.name = 'too_short';
    if (!phone) errors.phone = 'required';
    else if (
      !/^[\d\s()+-]+$/.test(phone) ||
      ![9, 10, 11, 12, 13, 14, 15].includes(phoneDigits(phone).length)
    ) {
      errors.phone = 'invalid';
    }
    return errors;
  }

  function errorText(field, code) {
    const specific = config.strings[`err.${field}.${code}`];
    if (specific) return specific;
    return code === 'required' ? t('err.required') : t('err.invalid');
  }

  function showErrors(errors) {
    for (const el of $$('[data-error-for]', form)) {
      const field = el.dataset.errorFor;
      const code = errors[field];
      el.textContent = code ? errorText(field, code) : '';
      const control = form.elements[field];
      if (control instanceof HTMLElement) {
        control.setAttribute('aria-invalid', code ? 'true' : 'false');
      }
    }
  }

  function focusFirstError(errors) {
    const order = ['service', 'date', 'time', 'name', 'phone', 'comment'];
    const field = order.find((f) => errors[f]);
    if (!field) return;
    const control = form.elements[field];
    const target =
      control instanceof RadioNodeList
        ? [...control].find((i) => !i.disabled)
        : control || $(`[data-error-for="${field}"]`, form);
    (target ?? $(`[data-error-for="${field}"]`, form))?.focus();
  }

  function setBusy(busy) {
    els.submit.disabled = busy;
    els.submit.setAttribute('aria-busy', String(busy));
    if (busy) els.submit.textContent = t('sending');
    else updateSubmitLabel();
  }

  // ── Events ──
  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.name === 'date') {
      loadSlots(target.value);
    }
    if (target.name === 'time') updateSubmitLabel();
    if (submitted) showErrors(validate());
  });

  form.addEventListener('input', () => {
    if (submitted) showErrors(validate());
  });

  $$('[data-service]').forEach((link) =>
    link.addEventListener('click', () => {
      els.service.value = link.dataset.service;
      if (submitted) showErrors(validate());
    }),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitted = true;
    els.alert.textContent = '';
    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length) {
      els.alert.textContent = t('err.summary');
      focusFirstError(errors);
      return;
    }

    const payload = {
      service: els.service.value,
      date: selectedDate(),
      time: selectedTime(),
      name: form.elements.name.value,
      phone: form.elements.phone.value,
      comment: form.elements.comment.value,
      website: form.elements.website.value,
      lang: config.lang,
    };

    setBusy(true);
    let res;
    let body;
    try {
      res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      body = await res.json().catch(() => ({}));
    } catch {
      setBusy(false);
      els.alert.textContent = t('err.network');
      return;
    }
    setBusy(false);

    if (res.ok) {
      showDone(payload, body.appointment);
      return;
    }
    if (res.status === 409) {
      showErrors({ time: 'taken' });
      els.alert.textContent = t('err.time.taken');
      await loadSlots(payload.date);
      return;
    }
    if (res.status === 400 && body.fields) {
      showErrors(body.fields);
      els.alert.textContent = t('err.summary');
      if (body.fields.time || body.fields.date) loadSlots(payload.date);
      focusFirstError(body.fields);
      return;
    }
    els.alert.textContent = res.status === 429 ? t('err.rate_limited') : t('err.generic');
  });

  function showDone(payload, saved = {}) {
    const serviceLabel = config.strings[`service.${payload.service}`] ?? payload.service;
    els.doneTitle.textContent = t('success.title');
    els.doneText.textContent = t('success.text', {
      when: whenLabel(payload.date, payload.time, { start: true }),
      service: serviceLabel.toLowerCase(),
      phone: formatPhone(saved.phone ?? payload.phone.trim()),
    });
    els.doneDemo.hidden = !config.demo;
    els.doneDemo.textContent = config.demo ? t('success.demo') : '';
    els.again.textContent = t('success.again');
    form.hidden = true;
    els.done.hidden = false;
    els.doneTitle.focus();
  }

  els.again.addEventListener('click', () => {
    const date = selectedDate();
    form.reset();
    submitted = false;
    showErrors({});
    els.done.hidden = true;
    form.hidden = false;
    const dayInput = form.querySelector(`input[name="date"][value="${date}"]`);
    if (dayInput) dayInput.checked = true;
    loadSlots(date);
    els.service.focus();
  });

  // ── Start: today, or tomorrow if today has no free time left ──
  (async () => {
    const [first, second] = $$('input[name="date"]', els.days);
    first.checked = true;
    const free = await loadSlots(first.value);
    if (free === 0 && second && selectedDate() === first.value) {
      second.checked = true;
      await loadSlots(second.value);
    }
  })();
}
