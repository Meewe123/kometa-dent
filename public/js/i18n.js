const TRANSLATIONS = {
  ru: {
    // NAV
    'nav.services':  'Услуги',
    'nav.about':     'О клинике',
    'nav.team':      'Врачи',
    'nav.reviews':   'Отзывы',
    'nav.contact':   'Контакты',
    'nav.book':      'Записаться',

    // HERO
    'hero.eyebrow':   'Ташкент · Работаем круглосуточно',
    'hero.title':     'Улыбка,<br/><em>достойная звёзд</em>',
    'hero.subtitle':  'Стоматология мирового уровня в сердце Ташкента. Безболезненное лечение, современные технологии, индивидуальный подход.',
    'hero.cta1':      'Записаться на приём',
    'hero.cta2':      '+998 97 125 55 51',
    'hero.stat1':     'довольных пациентов',
    'hero.stat2':     'лет опыта',
    'hero.stat3':     'доступность',

    // SERVICES
    'services.eyebrow': 'Что мы лечим',
    'services.title':   'Полный спектр<br/><em>стоматологических услуг</em>',
    's1.title': 'Лечение кариеса',
    's1.desc':  'Современные материалы и технологии. Безболезненное удаление кариеса под местной анестезией.',
    's1.price': 'от 150 000 сум',
    's2.title': 'Имплантация',
    's2.desc':  'Восстановление утраченных зубов. Пожизненная гарантия на имплантаты ведущих мировых брендов.',
    's2.price': 'от 2 500 000 сум',
    's3.title': 'Отбеливание',
    's3.desc':  'Профессиональное отбеливание Zoom 4. Результат на 6–8 тонов светлее за 1 визит.',
    's3.price': 'от 800 000 сум',
    's4.title': 'Ортодонтия',
    's4.desc':  'Брекеты, элайнеры Invisalign, ретейнеры. Идеальный прикус в любом возрасте.',
    's4.price': 'от 1 200 000 сум',
    's5.title': 'Виниры и коронки',
    's5.desc':  'Керамические и циркониевые реставрации. Эстетика голливудской улыбки.',
    's5.price': 'от 1 500 000 сум',
    's6.title': 'Детская стоматология',
    's6.desc':  'Игровой подход и минимальный стресс. Лечим детей с 2 лет в комфортной атмосфере.',
    's6.price': 'от 100 000 сум',

    // ABOUT
    'about.eyebrow': 'О клинике',
    'about.title':   'Стоматология,<br/><em>где вам рады всегда</em>',
    'about.text1':   'Kometa Dent — это современная стоматологическая клиника в центре Ташкента, которая работает <strong>круглосуточно</strong>. Мы объединили мировые стандарты лечения с теплотой и вниманием к каждому пациенту.',
    'about.text2':   'Наши врачи проходят обучение в ведущих клиниках Европы и Азии. Оборудование — последнего поколения: цифровой рентген, лазер, CAD/CAM технологии для изготовления реставраций за 1 визит.',
    'about.f1': 'Работаем 24/7, включая праздники',
    'about.f2': 'Гарантия на все виды лечения',
    'about.f3': 'Стерильность по стандарту ISO',
    'about.f4': 'Современная анестезия — лечение без боли',
    'about.f5': 'Удобная парковка и центральное расположение',
    'about.cta': 'Записаться на консультацию',

    // PROCESS
    'process.eyebrow': 'Как это работает',
    'process.title':   '4 шага к<br/><em>идеальной улыбке</em>',
    'p1.title': 'Запись онлайн',       'p1.desc': 'Выберите удобное время и услугу прямо на сайте или позвоните нам',
    'p2.title': 'Осмотр и диагностика','p2.desc': 'Цифровой рентген, 3D-томография, полное обследование полости рта',
    'p3.title': 'Составление плана',   'p3.desc': 'Индивидуальный план лечения с прозрачными ценами и сроками',
    'p4.title': 'Лечение и результат', 'p4.desc': 'Безболезненное лечение, долгосрочная гарантия и сияющая улыбка',

    // TEAM
    'team.eyebrow': 'Наша команда',
    'team.title':   'Врачи, которым<br/><em>можно доверять</em>',
    'd1.badge': 'Главный врач', 'd1.name': 'Акрам Рашидов',     'd1.spec': 'Имплантолог · Хирург',          'd1.exp': '14 лет опыта · Обучение в Германии',
    'd2.badge': 'Ортодонт',    'd2.name': 'Малика Юсупова',     'd2.spec': 'Ортодонт · Invisalign Provider', 'd2.exp': '10 лет опыта · Сертификат Швейцария',
    'd3.badge': 'Терапевт',    'd3.name': 'Сардор Камилов',     'd3.spec': 'Стоматолог-терапевт · Эстетика', 'd3.exp': '8 лет опыта · Мастер венирования',
    'd4.badge': 'Детский врач','d4.name': 'Нилуфар Исмоилова',  'd4.spec': 'Детский стоматолог',             'd4.exp': '7 лет опыта · Специалист по детям',

    // REVIEWS
    'reviews.eyebrow': 'Отзывы пациентов',
    'reviews.title':   'Они уже<br/><em>улыбаются с нами</em>',
    'reviews.source':  'Рейтинг на Google Maps',
    'r1.text': '"Отличная клиника! Сделала имплантацию, очень довольна результатом. Врачи профессиональные и внимательные. Рекомендую всем!"',
    'r1.time': '4 месяца назад',
    'r2.text': '"Хорошая клиника в центре города. Лечил кариес — безболезненно и быстро. Персонал очень дружелюбный, объяснили всё понятно."',
    'r2.time': '7 месяцев назад',
    'r3.text': '"Обратилась ночью с острой болью — приняли сразу! Это большой плюс, что работают 24/7. Доктор очень грамотный, боль сняли быстро."',
    'r3.time': '2 месяца назад',
    'reviews.cta': 'Оставить отзыв на Google',

    // BOOKING
    'booking.eyebrow': 'Запись',
    'booking.title':   'Запишитесь<br/><em>прямо сейчас</em>',
    'booking.desc':    'Заполните форму и мы перезвоним вам в течение 15 минут для подтверждения записи.',
    'booking.hours':   'Круглосуточно, 24/7',
    'booking.address': 'ул. Махтумкули 105, Ташкент',
    'form.name':       'Ваше имя *',
    'form.name.ph':    'Имя Фамилия',
    'form.phone':      'Телефон *',
    'form.service':    'Услуга *',
    'form.service.ph': 'Выберите услугу',
    'form.date':       'Дата *',
    'form.time':       'Время *',
    'form.time.ph':    'Выберите время',
    'form.comment':    'Комментарий',
    'form.comment.ph': 'Дополнительная информация, пожелания...',
    'form.submit':     'Записаться на приём',
    'form.loading':    'Загрузка...',
    'services.opt': ['Лечение кариеса','Имплантация','Отбеливание зубов','Ортодонтия / Брекеты','Виниры и коронки','Детская стоматология','Удаление зуба','Чистка и профилактика','Протезирование','Консультация','Экстренная помощь'],

    // CONTACT
    'contact.eyebrow':  'Контакты',
    'contact.title':    'Найдите нас',
    'contact.address':  'Адрес',
    'contact.address.v':'ул. Махтумкули 105<br/>100123, Ташкент, Узбекистан',
    'contact.phone':    'Телефон',
    'contact.hours':    'Режим работы',
    'contact.hours.v':  'Круглосуточно, без выходных',

    // FOOTER
    'footer.tagline': 'Стоматология мирового уровня<br/>в сердце Ташкента',
    'footer.services':'Услуги',
    'footer.clinic':  'Клиника',
    'footer.contact': 'Связь',
    'footer.copyright':'© 2024 Kometa Dent. Все права защищены.',

    // REVIEW BUTTON
    'reviews.google': 'Оставить отзыв на Google',
  },

  uz: {
    // NAV
    'nav.services':  'Xizmatlar',
    'nav.about':     'Klinika haqida',
    'nav.team':      'Shifokorlar',
    'nav.reviews':   'Sharhlar',
    'nav.contact':   'Kontaktlar',
    'nav.book':      'Yozilish',

    // HERO
    'hero.eyebrow':   'Toshkent · Kechayu kunduz ishlaymiz',
    'hero.title':     'Yulduzlarga<br/><em>loyiq tabassum</em>',
    'hero.subtitle':  'Toshkent markazida jahon darajasidagi stomatologiya. Og\'riqsiz davolash, zamonaviy texnologiyalar, individual yondashuv.',
    'hero.cta1':      'Qabulga yozilish',
    'hero.cta2':      '+998 97 125 55 51',
    'hero.stat1':     'mamnun bemor',
    'hero.stat2':     'yillik tajriba',
    'hero.stat3':     'mavjudligi',

    // SERVICES
    'services.eyebrow': 'Nima davolaymiz',
    'services.title':   'To\'liq<br/><em>stomatologik xizmatlar</em>',
    's1.title': 'Karies davolash',
    's1.desc':  'Zamonaviy materiallar va texnologiyalar. Mahalliy og\'riqsizlantirish ostida kariesni og\'riqsiz olib tashlash.',
    's1.price': '150 000 so\'mdan',
    's2.title': 'Implantatsiya',
    's2.desc':  'Yo\'qolgan tishlarni tiklash. Jahonning yetakchi brendlari implantlariga umrbod kafolat.',
    's2.price': '2 500 000 so\'mdan',
    's3.title': 'Oqartirish',
    's3.desc':  'Professional Zoom 4 oqartirish. 1 tashrif ichida 6–8 tonga yorqinroq natija.',
    's3.price': '800 000 so\'mdan',
    's4.title': 'Ortodontiya',
    's4.desc':  'Breketlar, Invisalign alignerlar, reteynерlar. Har qanday yoshda ideal tishlov.',
    's4.price': '1 200 000 so\'mdan',
    's5.title': 'Vinirlar va tojlar',
    's5.desc':  'Keramik va tsirkoniy restavratsiyalar. Gollivud tabassum estetikasi.',
    's5.price': '1 500 000 so\'mdan',
    's6.title': 'Bolalar stomatologiyasi',
    's6.desc':  'O\'yinli yondashuv va minimal stress. 2 yoshdan bolalarni qulay muhitda davolaymiz.',
    's6.price': '100 000 so\'mdan',

    // ABOUT
    'about.eyebrow': 'Klinika haqida',
    'about.title':   'Stomatologiya,<br/><em>bu yerda sizni doim kutishadi</em>',
    'about.text1':   'Kometa Dent — Toshkent markazida <strong>kechayu kunduz</strong> ishlaydigan zamonaviy stomatologik klinika. Biz jahon davolash standartlarini har bir bemorga issiqlik va e\'tibor bilan uyg\'unlashtirdik.',
    'about.text2':   'Shifokorlarimiz Evropa va Osiyoning yetakchi klinikalarida ta\'lim olishadi. Uskunalar so\'nggi avlod: raqamli rentgen, lazer, 1 tashrif ichida restavratsiya yasash uchun CAD/CAM texnologiyalar.',
    'about.f1': '24/7 ishlaymiz, bayramlar ham',
    'about.f2': 'Barcha davolash turlari uchun kafolat',
    'about.f3': 'ISO standarti bo\'yicha sterillik',
    'about.f4': 'Zamonaviy og\'riqsizlantirish — og\'riqsiz davolash',
    'about.f5': 'Qulay avtoturargoh va markaziy joylashuv',
    'about.cta': 'Maslahat uchun yozilish',

    // PROCESS
    'process.eyebrow': 'Qanday ishlaydi',
    'process.title':   'Ideal tabassumga<br/><em>4 qadam</em>',
    'p1.title': 'Onlayn yozilish',       'p1.desc': 'Saytda qulay vaqt va xizmatni tanlang yoki bizga qo\'ng\'iroq qiling',
    'p2.title': 'Ko\'rik va diagnostika', 'p2.desc': 'Raqamli rentgen, 3D tomografiya, og\'iz bo\'shlig\'ini to\'liq tekshirish',
    'p3.title': 'Reja tuzish',           'p3.desc': 'Shaffof narxlar va muddatlar bilan individual davolash rejasi',
    'p4.title': 'Davolash va natija',    'p4.desc': 'Og\'riqsiz davolash, uzoq muddatli kafolat va porloq tabassum',

    // TEAM
    'team.eyebrow': 'Bizning jamoa',
    'team.title':   'Ishonsa bo\'ladigan<br/><em>shifokorlar</em>',
    'd1.badge': 'Bosh shifokor',   'd1.name': 'Akram Rashidov',    'd1.spec': 'Implantolog · Jarroh',              'd1.exp': '14 yil tajriba · Germaniyada ta\'lim',
    'd2.badge': 'Ortodont',        'd2.name': 'Malika Yusupova',   'd2.spec': 'Ortodont · Invisalign Provider',    'd2.exp': '10 yil tajriba · Shveytsariya sertifikati',
    'd3.badge': 'Terapevt',        'd3.name': 'Sardor Kamilov',    'd3.spec': 'Stomatolog-terapevt · Estetika',    'd3.exp': '8 yil tajriba · Vinir ustasi',
    'd4.badge': 'Bolalar shifokori','d4.name': 'Nilufar Ismoilova', 'd4.spec': 'Bolalar stomatologa',               'd4.exp': '7 yil tajriba · Bolalar bo\'yicha mutaxassis',

    // REVIEWS
    'reviews.eyebrow': 'Bemorlar sharhlari',
    'reviews.title':   'Ular allaqachon<br/><em>biz bilan kulishadi</em>',
    'reviews.source':  'Google Maps reytingi',
    'r1.text': '"Ajoyib klinika! Implantatsiya qildirdim, natijadan juda mamnunman. Shifokorlar professional va e\'tiborli. Hammaga tavsiya qilaman!"',
    'r1.time': '4 oy oldin',
    'r2.text': '"Shahar markazida yaxshi klinika. Kariesni davoladim — og\'riqsiz va tez. Xodimlar juda do\'stona, hamma narsani tushunarli tushuntirdi."',
    'r2.time': '7 oy oldin',
    'r3.text': '"Kechasi kuchli og\'riq bilan keldim — darhol qabul qilishdi! 24/7 ishlashlari katta ortiqcha. Shifokor juda malakali, og\'riqni tez bartaraf etdi."',
    'r3.time': '2 oy oldin',
    'reviews.cta':    'Google\'da sharh qoldirish',

    // BOOKING
    'booking.eyebrow': 'Yozilish',
    'booking.title':   'Hoziroq<br/><em>yoziling</em>',
    'booking.desc':    'Shaklni to\'ldiring va biz tasdiqlash uchun 15 daqiqa ichida sizga qo\'ng\'iroq qilamiz.',
    'booking.hours':   'Kechayu kunduz, 24/7',
    'booking.address': 'Maxtumquli ko\'ch. 105, Toshkent',
    'form.name':       'Ismingiz *',
    'form.name.ph':    'Ism Familiya',
    'form.phone':      'Telefon *',
    'form.service':    'Xizmat *',
    'form.service.ph': 'Xizmatni tanlang',
    'form.date':       'Sana *',
    'form.time':       'Vaqt *',
    'form.time.ph':    'Vaqtni tanlang',
    'form.comment':    'Izoh',
    'form.comment.ph': 'Qo\'shimcha ma\'lumot, istaklar...',
    'form.submit':     'Qabulga yozilish',
    'form.loading':    'Yuklanmoqda...',
    'services.opt': ['Karies davolash','Implantatsiya','Tishlarni oqartirish','Ortodontiya / Breketlar','Vinirlar va tojlar','Bolalar stomatologiyasi','Tishni olib tashlash','Tozalash va profilaktika','Protezlash','Maslahat','Shoshilinch yordam'],

    // CONTACT
    'contact.eyebrow':  'Kontaktlar',
    'contact.title':    'Bizni toping',
    'contact.address':  'Manzil',
    'contact.address.v':'Maxtumquli ko\'ch. 105<br/>100123, Toshkent, O\'zbekiston',
    'contact.phone':    'Telefon',
    'contact.hours':    'Ish tartibi',
    'contact.hours.v':  'Kechayu kunduz, dam olish kunlarisiz',

    // FOOTER
    'footer.tagline':  'Toshkent markazida<br/>jahon darajasidagi stomatologiya',
    'footer.services': 'Xizmatlar',
    'footer.clinic':   'Klinika',
    'footer.contact':  'Aloqa',
    'footer.copyright':'© 2024 Kometa Dent. Barcha huquqlar himoyalangan.',

    'reviews.google': 'Google\'da sharh qoldirish',
  }
};

let currentLang = localStorage.getItem('lang') || 'ru';

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['ru'][key] || key;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val !== undefined) el.innerHTML = val;
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });

  // Service options
  const serviceSelect = document.getElementById('bService');
  if (serviceSelect) {
    const opts = t('services.opt');
    const current = serviceSelect.value;
    serviceSelect.innerHTML = `<option value="">${t('form.service.ph')}</option>`;
    opts.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (opt === current) o.selected = true;
      serviceSelect.appendChild(o);
    });
  }

  // Time placeholder
  const timeSelect = document.getElementById('bTime');
  if (timeSelect && timeSelect.options[0]) {
    timeSelect.options[0].textContent = t('form.time.ph');
  }

  // Update lang switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang === 'uz' ? 'uz' : 'ru';
}

function initLangSwitcher() {
  applyLang(currentLang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

document.addEventListener('DOMContentLoaded', initLangSwitcher);
