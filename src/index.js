/**
 * Kecak Motor WhatsApp Chatbot
 * Free rule-based bot — no AI API required
 * Stack: Node.js + Express + Meta WhatsApp Cloud API
 */

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'kecak_motor_2024',
  WA_TOKEN: process.env.WA_TOKEN || '',          // Meta WhatsApp token
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || '', // From Meta dashboard
  STAFF_NUMBER: process.env.STAFF_NUMBER || '6281234567890', // Your WA number
  PORT: process.env.PORT || 3000,
};

// ─── BOOKING STORE (in-memory, replace with DB later) ────────────────────────
const bookings = [];
const sessions = {}; // tracks multi-step conversations

// ─── KNOWLEDGE BASE ──────────────────────────────────────────────────────────
const KB = {
  // Service prices (IDR)
  services: {
    'ganti oli': { price: 85000, duration: '30 menit', desc: 'Ganti oli mesin + filter' },
    'tune up': { price: 150000, duration: '1 jam', desc: 'Karburator, busi, filter udara' },
    'servis besar': { price: 350000, duration: '2-3 jam', desc: 'Tune up + rem + rantai + semua komponen' },
    'ganti ban': { price: 120000, duration: '45 menit', desc: 'Termasuk pemasangan dan balancing' },
    'servis rem': { price: 75000, duration: '30 menit', desc: 'Rem depan + belakang' },
    'aki': { price: 250000, duration: '15 menit', desc: 'Penggantian aki baru bergaransi' },
  },

  // Unit stock (update manually or connect to your system)
  units: {
    'honda beat': { stock: 3, harga: '17.500.000', warna: ['Merah', 'Hitam', 'Putih'] },
    'honda vario 125': { stock: 2, harga: '22.000.000', warna: ['Hitam', 'Biru'] },
    'honda vario 160': { stock: 1, harga: '27.500.000', warna: ['Hitam'] },
    'honda cbr 150r': { stock: 0, harga: '36.000.000', warna: ['Merah-Hitam'] },
    'honda scoopy': { stock: 4, harga: '20.500.000', warna: ['Putih', 'Hijau', 'Pink', 'Hitam'] },
    'honda pcx 160': { stock: 1, harga: '35.000.000', warna: ['Hitam', 'Putih'] },
  },

  // Jam operasional
  hours: 'Senin–Sabtu: 08.00–17.00 WITA\nMinggu: 09.00–14.00 WITA',
  address: 'Jl. Gatot Subroto No. 88, Denpasar, Bali',
  phone: '(0361) 123-4567',
};

// ─── RESPONSE TEMPLATES ──────────────────────────────────────────────────────
const MENU = `🏍️ *Kecak Motor - Honda Authorized Dealer*

Halo! Saya asisten virtual Kecak Motor. Ada yang bisa saya bantu?

Ketik nomor pilihan:
1️⃣  Booking servis
2️⃣  Harga servis
3️⃣  Stok unit Honda
4️⃣  Jam & lokasi
5️⃣  Bicara dengan staff
0️⃣  Menu utama`;

const MENU_EN = `🏍️ *Kecak Motor - Honda Authorized Dealer*

Hello! I'm Kecak Motor's virtual assistant. How can I help?

Type your choice:
1️⃣  Book a service
2️⃣  Service prices
3️⃣  Honda unit stock
4️⃣  Hours & location
5️⃣  Speak to staff
0️⃣  Main menu`;

function serviceList() {
  let msg = '🔧 *Daftar Harga Servis*\n\n';
  for (const [name, info] of Object.entries(KB.services)) {
    msg += `• *${name.toUpperCase()}*\n`;
    msg += `  Rp ${info.price.toLocaleString('id-ID')} | ${info.duration}\n`;
    msg += `  ${info.desc}\n\n`;
  }
  msg += '📞 Harga bisa berubah. Konfirmasi langsung di bengkel.\n\n';
  msg += 'Ketik *1* untuk booking servis atau *0* untuk menu.';
  return msg;
}

function unitList() {
  let msg = '🏍️ *Stok Unit Honda – Kecak Motor*\n\n';
  for (const [name, info] of Object.entries(KB.units)) {
    const statusIcon = info.stock > 0 ? '✅' : '❌';
    msg += `${statusIcon} *${name.toUpperCase()}*\n`;
    msg += `  Harga: Rp ${info.harga}\n`;
    if (info.stock > 0) {
      msg += `  Stok: ${info.stock} unit | Warna: ${info.warna.join(', ')}\n\n`;
    } else {
      msg += `  _Stok habis – indent tersedia_\n\n`;
    }
  }
  msg += 'Ketik *5* untuk tanya langsung ke sales kami atau *0* untuk menu.';
  return msg;
}

function locationInfo() {
  return `📍 *Kecak Motor*\n\n` +
    `🏢 ${KB.address}\n\n` +
    `🕐 *Jam Operasional:*\n${KB.hours}\n\n` +
    `📞 ${KB.phone}\n\n` +
    `_Ketik *0* untuk kembali ke menu._`;
}

// ─── BOOKING FLOW ─────────────────────────────────────────────────────────────
const BOOKING_STEPS = ['service', 'date', 'name', 'plate', 'confirm'];

function bookingPrompt(step, data = {}) {
  switch (step) {
    case 'service':
      return `🔧 *Booking Servis – Langkah 1/4*\n\nPilih jenis servis:\n\n` +
        Object.keys(KB.services).map((s, i) => `${i + 1}. ${s}`).join('\n') +
        `\n\nKetik nomornya (contoh: *1*)`;

    case 'date':
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      return `📅 *Booking Servis – Langkah 2/4*\n\n` +
        `Servis: *${data.service}*\n\n` +
        `Ketik tanggal kunjungan (contoh: *${tomorrow.toLocaleDateString('id-ID')}*)\n\n` +
        `_Jam servis: 08.00–15.00 WITA_`;

    case 'name':
      return `👤 *Booking Servis – Langkah 3/4*\n\nTanggal: *${data.date}*\n\nKetik nama lengkap Anda:`;

    case 'plate':
      return `🏍️ *Booking Servis – Langkah 4/4*\n\nNama: *${data.name}*\n\nKetik nomor plat kendaraan (contoh: *DK 1234 AB*):`;

    case 'confirm':
      const svc = KB.services[data.service];
      return `✅ *Konfirmasi Booking*\n\n` +
        `Servis: *${data.service.toUpperCase()}*\n` +
        `Tanggal: *${data.date}*\n` +
        `Nama: *${data.name}*\n` +
        `Plat: *${data.plate}*\n` +
        `Estimasi biaya: *Rp ${svc.price.toLocaleString('id-ID')}*\n` +
        `Estimasi waktu: *${svc.duration}*\n\n` +
        `Ketik *YA* untuk konfirmasi atau *BATAL* untuk membatalkan.`;
  }
}

function processBooking(session, input) {
  const step = session.step;
  const services = Object.keys(KB.services);

  if (step === 'service') {
    const idx = parseInt(input) - 1;
    if (idx >= 0 && idx < services.length) {
      session.data.service = services[idx];
      session.step = 'date';
      return bookingPrompt('date', session.data);
    }
    return `❌ Pilihan tidak valid. Ketik angka 1–${services.length}.`;
  }

  if (step === 'date') {
    // Basic date validation
    if (input.length < 5) return '❌ Format tanggal tidak valid. Contoh: 15/01/2025';
    session.data.date = input;
    session.step = 'name';
    return bookingPrompt('name', session.data);
  }

  if (step === 'name') {
    if (input.length < 2) return '❌ Nama terlalu pendek.';
    session.data.name = input;
    session.step = 'plate';
    return bookingPrompt('plate', session.data);
  }

  if (step === 'plate') {
    session.data.plate = input.toUpperCase();
    session.step = 'confirm';
    return bookingPrompt('confirm', session.data);
  }

  if (step === 'confirm') {
    if (input.toUpperCase() === 'YA') {
      const booking = {
        id: `BK${Date.now()}`,
        ...session.data,
        phone: session.phone,
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      };
      bookings.push(booking);
      delete sessions[session.phone];

      // Notify staff via WhatsApp
      notifyStaff(booking);

      return `🎉 *Booking Dikonfirmasi!*\n\n` +
        `ID Booking: *${booking.id}*\n` +
        `Servis: *${booking.data?.service || booking.service}*\n` +
        `Tanggal: *${booking.date}*\n\n` +
        `📍 Datang ke:\n${KB.address}\n\n` +
        `📞 Info: ${KB.phone}\n\n` +
        `_Simpan ID booking ini. Ketik *0* untuk menu._`;
    }
    if (input.toUpperCase() === 'BATAL') {
      delete sessions[session.phone];
      return `❌ Booking dibatalkan.\n\nKetik *0* untuk kembali ke menu.`;
    }
    return `Ketik *YA* untuk konfirmasi atau *BATAL* untuk membatalkan.`;
  }
}

// ─── MAIN MESSAGE ROUTER ─────────────────────────────────────────────────────
function detectLanguage(text) {
  const enWords = ['hello', 'hi', 'help', 'service', 'price', 'stock', 'how', 'what', 'book'];
  const lower = text.toLowerCase();
  return enWords.some(w => lower.includes(w)) ? 'en' : 'id';
}

function route(from, text) {
  const input = text.trim().toLowerCase();
  const session = sessions[from];

  // Active booking flow
  if (session && session.flow === 'booking') {
    return processBooking(session, text.trim());
  }

  // Menu shortcuts
  if (['menu', '0', 'halo', 'hi', 'hello', 'hai', 'mulai', 'start'].some(k => input.includes(k))) {
    const lang = detectLanguage(input);
    return lang === 'en' ? MENU_EN : MENU;
  }

  if (input === '1' || input.includes('booking') || input.includes('servis') || input.includes('service')) {
    sessions[from] = { flow: 'booking', step: 'service', phone: from, data: {} };
    return bookingPrompt('service');
  }

  if (input === '2' || input.includes('harga') || input.includes('price') || input.includes('biaya')) {
    return serviceList();
  }

  if (input === '3' || input.includes('stok') || input.includes('stock') || input.includes('unit') || input.includes('motor')) {
    return unitList();
  }

  if (input === '4' || input.includes('jam') || input.includes('alamat') || input.includes('lokasi') || input.includes('address') || input.includes('location') || input.includes('hours')) {
    return locationInfo();
  }

  if (input === '5' || input.includes('staff') || input.includes('manusia') || input.includes('human') || input.includes('cs')) {
    notifyStaff({ type: 'escalation', phone: from, message: text });
    return `👤 Oke! Saya sudah menghubungi staff kami.\n\nStaff kami akan membalas dalam beberapa menit.\n\nJam operasional: ${KB.hours}\n\n_Ketik *0* untuk menu._`;
  }

  // Keyword catch-all
  if (input.includes('oli') || input.includes('oil')) {
    return `🛢️ *Ganti Oli*\nRp 85.000 | 30 menit\n\nKetik *1* untuk booking sekarang atau *0* untuk menu.`;
  }

  if (input.includes('beat') || input.includes('vario') || input.includes('scoopy') || input.includes('pcx') || input.includes('cbr')) {
    return unitList();
  }

  if (input.includes('warranty') || input.includes('garansi')) {
    return `🛡️ *Garansi Honda*\n\nUnit baru: garansi 3 tahun atau 30.000 km\nSuku cadang resmi: garansi 6 bulan\n\nUntuk klaim garansi, bawa STNK + buku servis ke bengkel kami.\n\n_Ketik *0* untuk menu._`;
  }

  if (input.includes('kredit') || input.includes('cicil') || input.includes('dp') || input.includes('finance') || input.includes('loan')) {
    return `💳 *Pembiayaan / Kredit*\n\nKami bekerja sama dengan:\n• Adira Finance\n• WOM Finance  \n• FIF (Federal International Finance)\n\nDP mulai dari 10% | Tenor 12–36 bulan\n\nHubungi sales kami untuk simulasi kredit:\n📞 ${KB.phone}\n\nAtau ketik *5* untuk chat langsung dengan sales.`;
  }

  // Default — unknown input
  return `Maaf, saya belum mengerti permintaan Anda. 🙏\n\nKetik *0* untuk melihat menu lengkap, atau *5* untuk berbicara dengan staff kami.`;
}

// ─── WHATSAPP API CALLS ───────────────────────────────────────────────────────
async function sendMessage(to, body) {
  if (!CONFIG.WA_TOKEN || !CONFIG.PHONE_NUMBER_ID) {
    console.log(`[MOCK SEND] To: ${to}\n${body}\n`);
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body } },
      { headers: { Authorization: `Bearer ${CONFIG.WA_TOKEN}`, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Send error:', e.response?.data || e.message);
  }
}

async function notifyStaff(data) {
  if (!CONFIG.STAFF_NUMBER) return;
  let msg = '';
  if (data.type === 'escalation') {
    msg = `🔔 *Permintaan Staff*\nDari: ${data.phone}\nPesan: "${data.message}"`;
  } else {
    msg = `🎉 *Booking Baru!*\nID: ${data.id}\nServis: ${data.service}\nTanggal: ${data.date}\nNama: ${data.name}\nPlat: ${data.plate}\nTelp: ${data.phone}`;
  }
  await sendMessage(CONFIG.STAFF_NUMBER, msg);
}

// ─── WEBHOOK ROUTES ──────────────────────────────────────────────────────────
// Verification (Meta requires this on setup)
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verified ✅');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming messages
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Always respond fast to Meta

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    if (!msg || msg.type !== 'text') return;

    const from = msg.from;
    const text = msg.text.body;
    console.log(`[IN] ${from}: ${text}`);

    // Log to booking store for dashboard
    const logEntry = { from, text, timestamp: new Date().toISOString(), direction: 'in' };

    const reply = route(from, text);
    console.log(`[OUT] ${from}: ${reply.substring(0, 60)}...`);
    await sendMessage(from, reply);

  } catch (err) {
    console.error('Webhook error:', err);
  }
});

// ─── DASHBOARD API ────────────────────────────────────────────────────────────
app.get('/api/bookings', (req, res) => res.json(bookings));
app.get('/api/stats', (req, res) => {
  res.json({
    totalBookings: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    activeSessions: Object.keys(sessions).length,
    topService: bookings.length > 0
      ? Object.entries(bookings.reduce((acc, b) => { acc[b.service] = (acc[b.service] || 0) + 1; return acc; }, {}))
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
      : '-',
  });
});

// Serve dashboard
app.use(express.static('dashboard'));

app.listen(CONFIG.PORT, () => {
  console.log(`\n🏍️  Kecak Motor Bot running on port ${CONFIG.PORT}`);
  console.log(`📱  Webhook URL: https://YOUR-DOMAIN/webhook`);
  console.log(`🔑  Verify token: ${CONFIG.VERIFY_TOKEN}\n`);
});
