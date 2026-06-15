/* ============================================
   KOMETA DENT — Main Frontend JS
   ============================================ */

// ── LOADER ──
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hidden'), 800);
});

// ── NAV SCROLL ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── MOBILE BURGER ──
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── STAR CANVAS (Comet / Space Hero) ──
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const stars = Array.from({ length: 180 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.2,
    alpha: Math.random() * 0.6 + 0.1,
    speed: Math.random() * 0.0002 + 0.00005
  }));

  // Comets
  let comets = [];
  function spawnComet() {
    comets.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: (Math.random() * 3 + 2) * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.random() * 2 + 0.5,
      len: Math.random() * 120 + 60,
      alpha: 1,
      life: 0
    });
  }

  setInterval(spawnComet, 4000);
  spawnComet();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(s => {
      s.alpha += s.speed * (Math.random() > 0.5 ? 1 : -1);
      s.alpha = Math.max(0.05, Math.min(0.8, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });

    // Comets
    comets = comets.filter(c => c.alpha > 0.01);
    comets.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.life++;
      if (c.life > 40) c.alpha *= 0.97;

      const grad = ctx.createLinearGradient(c.x - c.len * (c.vx / Math.abs(c.vx)), c.y - c.len * 0.3, c.x, c.y);
      grad.addColorStop(0, `rgba(201,168,76,0)`);
      grad.addColorStop(1, `rgba(201,168,76,${c.alpha * 0.7})`);

      ctx.beginPath();
      ctx.moveTo(c.x - c.len * (c.vx / Math.abs(c.vx)), c.y - c.len * 0.15);
      ctx.lineTo(c.x, c.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${c.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

// ── REVEAL ON SCROLL ──
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), +delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => io.observe(el));
})();

// ── COUNTER ANIMATION ──
(function initCounters() {
  const counters = document.querySelectorAll('.hero__stat-num');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const duration = 1800;
      const step = target / (duration / 16);
      let current = 0;
      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString('ru');
        if (current < target) requestAnimationFrame(tick);
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
})();

// ── DATE INPUT: set min to today ──
const dateInput = document.getElementById('bDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  dateInput.addEventListener('change', async () => {
    const date = dateInput.value;
    if (!date) return;

    const timeSelect = document.getElementById('bTime');
    timeSelect.innerHTML = '<option value="">Загрузка...</option>';

    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();

      timeSelect.innerHTML = '<option value="">Выберите время</option>';
      if (data.success) {
        data.slots.forEach(slot => {
          const opt = document.createElement('option');
          opt.value = slot.time;
          opt.textContent = slot.time;
          if (!slot.available) {
            opt.disabled = true;
            opt.textContent += ' (занято)';
          }
          timeSelect.appendChild(opt);
        });
      }
    } catch {
      timeSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
    }
  });

  // Init default slots
  const initSlots = () => {
    const timeSelect = document.getElementById('bTime');
    const slots = [
      '09:00','09:30','10:00','10:30','11:00','11:30',
      '12:00','12:30','13:00','13:30','14:00','14:30',
      '15:00','15:30','16:00','16:30','17:00','17:30',
      '18:00','18:30','19:00','19:30','20:00','20:30'
    ];
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    slots.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      timeSelect.appendChild(opt);
    });
  };
  initSlots();
}

// ── BOOKING FORM ──
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('bookingSubmit');
    const msg = document.getElementById('bookingMessage');
    const data = Object.fromEntries(new FormData(bookingForm));

    // Validate
    let valid = true;
    bookingForm.querySelectorAll('[required]').forEach(el => {
      el.classList.remove('error');
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      }
    });

    if (!valid) {
      showMsg(msg, 'error', 'Заполните все обязательные поля.');
      return;
    }

    btn.classList.add('loading');
    btn.disabled = true;
    msg.className = 'form-message';
    msg.style.display = 'none';

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (result.success) {
        showMsg(msg, 'success', result.message);
        bookingForm.reset();
        if (dateInput) {
          const timeSelect = document.getElementById('bTime');
          timeSelect.innerHTML = '<option value="">Выберите время</option>';
        }
      } else {
        showMsg(msg, 'error', result.message);
      }
    } catch {
      showMsg(msg, 'error', 'Ошибка соединения. Пожалуйста, позвоните нам напрямую.');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // Clear error on input
  bookingForm.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

function showMsg(el, type, text) {
  el.textContent = text;
  el.className = `form-message ${type}`;
}

// ── SMOOTH ANCHOR SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── ACTIVE NAV LINK ON SCROLL ──
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav__link:not(.nav__link--cta)');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    links.forEach(l => {
      l.style.color = l.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
    });
  }, { passive: true });
})();
