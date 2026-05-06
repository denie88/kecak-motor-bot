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
  WA_TOKEN: process.env.WA_TOKEN || '',
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || '',
  STAFF_NUMBER: process.env.STAFF_NUMBER || '6281234567890',
  PORT: process.env.PORT || 3000,
};

// ─── KNOWLEDGE BASE ──────────────────────────────────────────────────────────
const KB = {
  // Unit prices & promotions — updated May 2026 (OTR Bali, sudah termasuk PPN, STNK, BBN, BPKB)
  units: {
    'honda beat': {
      harga: 'mulai Rp 20.170.000',
      varian: 'Beat Sporty CBS / CBS ISS / Smart Key / Street',
      promo: 'Gratis aksesori senilai Rp 500.000 untuk pembelian bulan ini!',
    },
    'honda genio': {
      harga: 'mulai Rp 21.410.000',
      varian: 'Genio CBS / CBS ISS',
      promo: 'DP ringan, proses cepat. Hubungi sales kami!',
    },
    'honda scoopy': {
      harga: 'mulai Rp 24.770.000',
      varian: 'Scoopy Energetic / Fashion / Prestige / Stylish / Kuromi LE',
      promo: 'Gratis helm Honda senilai Rp 300.000 untuk pembelian bulan ini!',
    },
    'honda vario 125': {
      harga: 'mulai Rp 25.610.000',
      varian: 'Vario 125 CBS / CBS ISS / Street',
      promo: 'DP ringan mulai Rp 2.500.000. Cicilan mulai Rp 700.000/bulan.',
    },
    'honda stylo 160': {
      harga: 'mulai Rp 30.720.000',
      varian: 'Stylo 160 CBS / ABS',
      promo: 'Model terbaru! Bonus aksesori untuk pembelian bulan ini.',
    },
    'honda vario 160': {
      harga: 'mulai Rp 29.960.000',
      varian: 'Vario 160 CBS / ABS',
      promo: 'Cashback Rp 1.000.000 untuk pembelian tunai bulan ini.',
    },
    'honda pcx 160': {
      harga: 'mulai Rp 35.520.000',
      varian: 'PCX 160 CBS / ABS / ABS RoadSync',
      promo: 'Bonus aksesori + gratis servis pertama.',
    },
    'honda adv 160': {
      harga: 'mulai Rp 38.570.000',
      varian: 'ADV 160 CBS / ABS / ABS RoadSync',
      promo: 'Adventure scooter terbaik! Hubungi sales untuk penawaran spesial.',
    },
    'honda cbr 150r': {
      harga: 'mulai Rp 40.240.000',
      varian: 'CBR 150R STD / ABS',
      promo: 'Sport bike idaman! DP dan cicilan ringan tersedia.',
    },
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
1️⃣  Harga motor & promo
2️⃣  Jam & lokasi
3️⃣  Kredit & pembiayaan
4️⃣  Bicara dengan staff
0️⃣  Menu utama`;

const MENU_EN = `🏍️ *Kecak Motor - Honda Authorized Dealer*

Hello! I'm Kecak Motor's virtual assistant. How can I help?

Type your choice:
1️⃣  Motorcycle prices & promotions
2️⃣  Hours & location
3️⃣  Credit & financing
4️⃣  Speak to staff
0️⃣  Main menu`;

function unitList() {
  let msg = '🏍️ *Harga Unit Honda & Promo – Kecak Motor*\n';
  msg += '_Update: Mei 2026 | OTR Bali (sudah termasuk PPN, STNK, BBN, BPKB)_\n\n';
  for (const [name, info] of Object.entries(KB.units)) {
    msg += `• *${name.toUpperCase()}*\n`;
    msg += `  💰 ${info.harga}\n`;
    msg += `  📋 ${info.varian}\n`;
    msg += `  🎁 ${info.promo}\n\n`;
  }
  msg += '📞 Harga & promo bisa berubah sewaktu-waktu.\n';
  msg += 'Ketik *4* untuk tanya langsung ke sales kami atau *0* untuk menu.';
  return msg;
}

function locationInfo() {
  return `📍 *Kecak Motor*\n\n` +
    `🏢 ${KB.address}\n\n` +
    `🕐 *Jam Operasional:*\n${KB.hours}\n\n` +
    `📞 ${KB.phone}\n\n` +
    `_Ketik *0* untuk kembali ke menu._`;
}

function creditInfo() {
  return `💳 *Pembiayaan / Kredit*\n\n` +
    `Kami bekerja sama dengan:\n` +
    `• Adira Finance\n` +
    `• WOM Finance\n` +
    `• FIF (Federal International Finance)\n\n` +
    `✅ DP mulai dari 10%\n` +
    `✅ Tenor 12–36 bulan\n` +
    `✅ Proses cepat & mudah\n\n` +
    `Untuk simulasi kredit, ketik *4* untuk chat langsung dengan sales kami.\n\n` +
    `📞 ${KB.phone}\n\n` +
    `_Ketik *0* untuk kembali ke menu._`;
}

// ─── MAIN MESSAGE ROUTER ─────────────────────────────────────────────────────
function detectLanguage(text) {
  const enWords = ['hello', 'hi', 'help', 'price', 'stock', 'how', 'what', 'credit', 'promo'];
  const lower = text.toLowerCase();
  return enWords.some(w => lower.includes(w)) ? 'en' : 'id';
}

function route(from, text) {
  const input = text.trim().toLowerCase();

  // Menu / greeting
  if (['menu', '0', 'halo', 'hi', 'hello', 'hai', 'mulai', 'start'].some(k => input.includes(k))) {
    const lang = detectLanguage(input);
    return lang === 'en' ? MENU_EN : MENU;
  }

  // 1 — Harga motor & promo
  if (input === '1' || input.includes('harga') || input.includes('promo') || input.includes('price')
    || input.includes('motor') || input.includes('unit') || input.includes('stok') || input.includes('stock')
    || input.includes('beat') || input.includes('vario') || input.includes('scoopy')
    || input.includes('pcx') || input.includes('cbr') || input.includes('genio')
    || input.includes('stylo') || input.includes('adv') || input.includes('murah')
    || input.includes('berapa') || input.includes('type') || input.includes('tipe')) {
    return unitList();
  }

  // 2 — Jam & lokasi
  if (input === '2' || input.includes('jam') || input.includes('alamat') || input.includes('lokasi')
    || input.includes('address') || input.includes('location') || input.includes('hours')) {
    return locationInfo();
  }

  // 3 — Kredit & pembiayaan
  if (input === '3' || input.includes('kredit') || input.includes('cicil') || input.includes('dp')
    || input.includes('finance') || input.includes('loan') || input.includes('angsuran')) {
    return creditInfo();
  }

  // 4 — Escalate to staff
  if (input === '4' || input.includes('staff') || input.includes('sales') || input.includes('manusia')
    || input.includes('human') || input.includes('cs') || input.includes('admin')) {
    notifyStaff({ type: 'escalation', phone: from, message: text });
    return `👤 Oke! Saya sudah menghubungi staff kami.\n\nStaff kami akan membalas dalam beberapa menit.\n\nJam operasional: ${KB.hours}\n\n_Ketik *0* untuk menu._`;
  }

  // Warranty catch-all
  if (input.includes('warranty') || input.includes('garansi')) {
    return `🛡️ *Garansi Honda*\n\nUnit baru: garansi 3 tahun atau 30.000 km\nSuku cadang resmi: garansi 6 bulan\n\nUntuk info lebih lanjut, ketik *4* untuk chat dengan staff kami.\n\n_Ketik *0* untuk menu._`;
  }

  // Default
  return `Maaf, saya belum mengerti permintaan Anda. 🙏\n\nKetik *0* untuk melihat menu lengkap, atau *4* untuk berbicara dengan staff kami.`;
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
  const msg = `🔔 *Permintaan Staff*\nDari: ${data.phone}\nPesan: "${data.message}"`;
  await sendMessage(CONFIG.STAFF_NUMBER, msg);
}

// ─── WEBHOOK ROUTES ──────────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verified ✅');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    if (!msg || msg.type !== 'text') return;

    const from = msg.from;
    const text = msg.text.body;
    console.log(`[IN] ${from}: ${text}`);

    const reply = route(from, text);
    console.log(`[OUT] ${from}: ${reply.substring(0, 60)}...`);
    await sendMessage(from, reply);

  } catch (err) {
    console.error('Webhook error:', err);
  }
});

// ─── DASHBOARD API ────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({ status: 'online' });
});

app.use(express.static('dashboard'));

app.listen(CONFIG.PORT, () => {
  console.log(`\n🏍️  Kecak Motor Bot running on port ${CONFIG.PORT}`);
  console.log(`📱  Webhook URL: https://YOUR-DOMAIN/webhook`);
  console.log(`🔑  Verify token: ${CONFIG.VERIFY_TOKEN}\n`);
});
