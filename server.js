const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const https = require('https');

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID;

function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  const body = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TG_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Слишком много запросов. Повторите позже.' }
});

const DB_FILE = path.join(__dirname, 'data', 'appointments.json');

function ensureDb() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ appointments: [], contacts: [] }, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Appointment booking
app.post('/api/appointments', apiLimiter, (req, res) => {
  const { name, phone, service, date, time, message } = req.body;

  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ success: false, message: 'Заполните все обязательные поля.' });
  }

  const phoneClean = phone.replace(/\D/g, '');
  if (phoneClean.length < 9) {
    return res.status(400).json({ success: false, message: 'Неверный номер телефона.' });
  }

  const db = readDb();
  const appointment = {
    id: Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    service,
    date,
    time,
    message: message || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.appointments.push(appointment);
  writeDb(db);

  console.log(`[APPOINTMENT] ${name} — ${service} on ${date} at ${time}`);

  sendTelegram(
    `🦷 <b>Новая запись!</b>\n\n` +
    `👤 <b>Имя:</b> ${appointment.name}\n` +
    `📞 <b>Телефон:</b> ${appointment.phone}\n` +
    `🔧 <b>Услуга:</b> ${appointment.service}\n` +
    `📅 <b>Дата:</b> ${appointment.date} в ${appointment.time}\n` +
    (appointment.message ? `💬 <b>Комментарий:</b> ${appointment.message}\n` : '') +
    `\n⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`
  );

  res.json({
    success: true,
    message: 'Запись успешно создана! Мы свяжемся с вами для подтверждения.',
    id: appointment.id
  });
});

// Contact form
app.post('/api/contact', apiLimiter, (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Заполните обязательные поля.' });
  }

  const db = readDb();
  const contact = {
    id: Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email || '',
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  db.contacts.push(contact);
  writeDb(db);

  res.json({ success: true, message: 'Сообщение отправлено! Мы свяжемся с вами в ближайшее время.' });
});

// Available time slots
app.get('/api/slots', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, message: 'Укажите дату.' });

  const db = readDb();
  const booked = db.appointments
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);

  const allSlots = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '15:00','15:30','16:00','16:30','17:00','17:30',
    '18:00','18:30','19:00','19:30','20:00','20:30'
  ];

  const slots = allSlots.map(slot => ({
    time: slot,
    available: !booked.includes(slot)
  }));

  res.json({ success: true, slots });
});

// Admin: list appointments
app.get('/api/admin/appointments', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: db.appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  ensureDb();
  console.log(`\n🦷 Kometa Dent running at http://localhost:${PORT}\n`);
});
