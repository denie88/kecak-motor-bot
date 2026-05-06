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

const sessions = {}; // tracks multi-step conversations

// ─── PRICE CATALOG ───────────────────────────────────────────────────────────
// All prices OTR Bali — SK Mei 2026 — sudah termasuk PPN, STNK, BBN, BPKB
const KB = {
  catalog: {
    revo: {
      nama: 'REVO', keywords: ['revo'],
      types: [
        { tipe: 'Revo Fit',  harga: '19.090.000' },
        { tipe: 'Revo X',    harga: '20.810.000' },
      ],
    },
    suprax125: {
      nama: 'SUPRA X 125', keywords: ['supra x', 'supra'],
      types: [
        { tipe: 'Supra X 125 SW', harga: '22.380.000' },
        { tipe: 'Supra X 125 CW', harga: '23.480.000' },
      ],
    },
    beat: {
      nama: 'BEAT', keywords: ['beat'],
      types: [
        { tipe: 'Beat Sporty CBS',             harga: '20.170.000' },
        { tipe: 'Beat Sporty CBS ISS Deluxe',  harga: '20.970.000' },
        { tipe: 'Beat Sporty DLX Smart Key',   harga: '21.580.000' },
        { tipe: 'Beat Street',                 harga: '21.110.000' },
      ],
    },
    genio: {
      nama: 'GENIO', keywords: ['genio'],
      types: [
        { tipe: 'Genio CBS',               harga: '21.410.000' },
        { tipe: 'Genio CBS ISS',           harga: '21.870.000' },
        { tipe: 'Genio CBS Special Color', harga: '21.680.000' },
      ],
    },
    scoopy: {
      nama: 'SCOOPY', keywords: ['scoopy'],
      types: [
        { tipe: 'Scoopy Energetic Step Floor & Hook Plus', harga: '24.770.000' },
        { tipe: 'Scoopy Energetic Spion & Hook Plus',      harga: '24.910.000' },
        { tipe: 'Scoopy Fashion Step Floor & Hook Plus',   harga: '24.850.000' },
        { tipe: 'Scoopy Fashion Spion & Hook Plus',        harga: '24.990.000' },
        { tipe: 'Scoopy Fashion Special Color',            harga: '26.955.000' },
        { tipe: 'Scoopy Prestige Step Floor & Hook Plus',  harga: '25.730.000' },
        { tipe: 'Scoopy Stylish Step Floor & Hook Plus',   harga: '25.730.000' },
        { tipe: 'Scoopy Kuromi Limited Edition',           harga: '26.170.000' },
      ],
    },
    vario125: {
      nama: 'VARIO 125', keywords: ['vario 125', 'vario125'],
      types: [
        { tipe: 'Vario 125 CBS Spion Hook Plus (Tipe 1)',     harga: '25.610.000' },
        { tipe: 'Vario 125 CBS Spion Hook Plus (Tipe 2)',     harga: '26.190.000' },
        { tipe: 'Vario 125 CBS ISS Spion Hook Plus (Tipe 1)', harga: '27.460.000' },
        { tipe: 'Vario 125 CBS ISS Spion Hook Plus (Tipe 2)', harga: '28.080.000' },
        { tipe: 'Vario 125 Street Spion Hook Plus',           harga: '28.580.000' },
        { tipe: 'Vario 125 Street Visor Hook Plus',           harga: '28.705.000' },
      ],
    },
    stylo160: {
      nama: 'STYLO 160', keywords: ['stylo'],
      types: [
        { tipe: 'Stylo 160 CBS Step Floor Plus',     harga: '30.720.000' },
        { tipe: 'Stylo 160 CBS Step Floor KC Plus',  harga: '30.780.000' },
        { tipe: 'Stylo 160 CBS Special Color',       harga: '32.995.000' },
        { tipe: 'Stylo 160 ABS Step Floor Plus',     harga: '33.820.000' },
        { tipe: 'Stylo 160 ABS Step Floor KC Plus',  harga: '33.880.000' },
        { tipe: 'Stylo 160 ABS SPC Step Floor Plus', harga: '35.380.000' },
        { tipe: 'Stylo 160 ABS Special Color',       harga: '36.095.000' },
      ],
    },
    vario160: {
      nama: 'VARIO 160', keywords: ['vario 160', 'vario160'],
      types: [
        { tipe: 'Vario 160 CBS Plus (Tipe 1)',            harga: '29.960.000' },
        { tipe: 'Vario 160 CBS Plus (Tipe 2)',            harga: '30.210.000' },
        { tipe: 'Vario 160 ABS Plus',                     harga: '32.990.000' },
        { tipe: 'Vario 160 CBS Spion Hook Plus (Tipe 1)', harga: '30.010.000' },
        { tipe: 'Vario 160 CBS Spion Hook Plus (Tipe 2)', harga: '30.260.000' },
        { tipe: 'Vario 160 ABS Spion Hook Plus',          harga: '33.040.000' },
      ],
    },
    pcx160: {
      nama: 'PCX 160', keywords: ['pcx'],
      types: [
        { tipe: 'PCX 160 CBS',          harga: '35.520.000' },
        { tipe: 'PCX 160 ABS',          harga: '39.460.000' },
        { tipe: 'PCX 160 ABS RoadSync', harga: '42.920.000' },
      ],
    },
    adv160: {
      nama: 'ADV 160', keywords: ['adv'],
      types: [
        { tipe: 'ADV 160 CBS',          harga: '38.570.000' },
        { tipe: 'ADV 160 ABS',          harga: '41.730.000' },
        { tipe: 'ADV 160 ABS RoadSync', harga: '43.460.000' },
      ],
    },
    supragtr: {
      nama: 'SUPRA GTR 150', keywords: ['supra gtr', 'gtr'],
      types: [
        { tipe: 'New Supra GTR150 Sporty',    harga: '28.230.000' },
        { tipe: 'New Supra GTR150 Exclusive', harga: '28.480.000' },
      ],
    },
    sonic: {
      nama: 'SONIC 150R', keywords: ['sonic'],
      types: [
        { tipe: 'Sonic 150R',             harga: '29.250.000' },
        { tipe: 'Sonic 150R HRR',         harga: '29.650.000' },
        { tipe: 'Sonic 150R Matte Black', harga: '29.650.000' },
      ],
    },
    cb150x: {
      nama: 'CB150X', keywords: ['cb150x', 'cb 150x'],
      types: [
        { tipe: 'CB150X STD', harga: '35.850.000' },
        { tipe: 'CB150X SE',  harga: '36.360.000' },
      ],
    },
    verza: {
      nama: 'CB150 VERZA', keywords: ['verza'],
      types: [
        { tipe: 'CB150 Verza SW', harga: '25.520.000' },
        { tipe: 'CB150 Verza CW', harga: '26.180.000' },
      ],
    },
    cb150r: {
      nama: 'CB150R STREETFIRE', keywords: ['cb150r', 'streetfire'],
      types: [
        { tipe: 'CB150R Streetfire',                 harga: '35.260.000' },
        { tipe: 'CB150R Streetfire Special Edition', harga: '36.270.000' },
      ],
    },
    crf150l: {
      nama: 'CRF150L', keywords: ['crf150'],
      types: [
        { tipe: 'CRF150L', harga: '38.760.000' },
      ],
    },
    cbr150r: {
      nama: 'CBR 150R', keywords: ['cbr 150', 'cbr150'],
      types: [
        { tipe: 'CBR 150R STD (Tipe 1)', harga: '40.240.000' },
        { tipe: 'CBR 150R STD (Tipe 2)', harga: '40.950.000' },
        { tipe: 'CBR 150R ABS (Tipe 1)', harga: '44.490.000' },
        { tipe: 'CBR 150R ABS (Tipe 2)', harga: '45.200.000' },
      ],
    },
    cbr250rr: {
      nama: 'CBR 250RR', keywords: ['cbr 250', 'cbr250'],
      types: [
        { tipe: 'CBR 250RR STD (Tipe 1)',      harga: '76.020.000' },
        { tipe: 'CBR 250RR STD (Tipe 2)',      harga: '80.390.000' },
        { tipe: 'CBR 250RR ABS',               harga: '87.750.000' },
        { tipe: 'CBR 250RR ABS + QS (Tipe 1)', harga: '91.800.000' },
        { tipe: 'CBR 250RR ABS + QS (Tipe 2)', harga: '92.400.000' },
      ],
    },
    electric: {
      nama: 'ELECTRIC', keywords: ['electric', 'listrik', 'icon e', 'cuv', 'em1'],
      types: [
        { tipe: 'Icon e:',             harga: '28.378.000' },
        { tipe: 'CUV e:',              harga: '55.107.000' },
        { tipe: 'CUV e: RoadSync Duo', harga: '60.307.000' },
        { tipe: 'EM1 e: Charger',      harga: '46.353.000' },
        { tipe: 'EM1 e: Plus Charger', harga: '46.853.000' },
      ],
    },
    premium: {
      nama: 'BIG BIKE / PREMIUM', keywords: ['sh 150', 'sh150', 'forza', 'super cub', 'monkey', 'ct125', 'st125', 'dax', 'crf250', 'big bike', 'premium'],
      types: [
        { tipe: 'SH 150',          harga: '45.940.000' },
        { tipe: 'ST125 Dax',       harga: '84.300.000' },
        { tipe: 'CT125AM',         harga: '83.700.000' },
        { tipe: 'Super Cub C 125', harga: '81.330.000' },
        { tipe: 'Monkey',          harga: '89.010.000' },
        { tipe: 'CRF250L',         harga: '92.740.000' },
        { tipe: 'CRF250 Rally',    harga: '100.230.000' },
        { tipe: 'Forza',           harga: '99.280.000' },
      ],
    },
  },

  hours:   'Senin–Sabtu: 08.00–17.00 WITA\nMinggu: 09.00–14.00 WITA',
  address: 'Jl. Raya Padang Luwih 166, Dalung, Kuta Utara, Bali',
  gmaps:   'https://maps.app.goo.gl/ngYrnjaPjQJpv81s7',
  phone:   '(0361) 413587',
};

// ─── SALES PROGRAM — Mei 2025 ─────────────────────────────────────────────────
// nasional = program dari AHM berlaku seluruh Indonesia
// bali     = program regional Bali (dapat digabung nasional jika syarat terpenuhi)
// segmen   = diskon tambahan untuk karyawan hotel/villa/homestay/koperasi/SPPG
const PROMO = {
  beat: {
    nasional: [],
    bali: [
      { nama: 'Direct Gift Safety Tools',     diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman', diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '666.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  genio: {
    nasional: [],
    bali: [
      { nama: 'Institusi LPD & Koperasi',     diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                  diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',     diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman', diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '666.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  scoopy: {
    nasional: [
      { nama: 'Program Special Gift Scoopy', diskon: '277.500', syarat: 'Konsumen Cash & Credit' },
    ],
    bali: [
      { nama: 'Sales Disc Scoopy ROTI',          diskon: '527.250', syarat: 'RO AT Low/Mid/CUB Honda. TI AT Low/Mid/CUB kompetitor via Motorku X' },
      { nama: 'Special Gift Helm Scoopy Kalcer', diskon: '244.200', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Institusi LPD & Koperasi',        diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                     diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',        diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman',    diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '527.250', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  vario125: {
    nasional: [],
    bali: [
      { nama: 'Institusi LPD & Koperasi',     diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                  diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Diskon Display on AHASS',      diskon: '55.500',  syarat: 'Pembelian di AHASS on Display — Cash & Credit' },
      { nama: 'Diskon Display on Fincoy',     diskon: '55.500',  syarat: 'Pembelian di Fincoy on Display — Cash & Credit' },
      { nama: 'Direct Gift Safety Tools',     diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman', diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '666.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  stylo160: {
    nasional: [
      { nama: 'Program Special Gift Stylo (Jaket)', diskon: '444.000', syarat: 'Konsumen Cash & Credit' },
    ],
    bali: [
      { nama: 'Trade In Move on to 160 Pride', diskon: '444.000', syarat: 'RO AT di bawah 155cc kompetitor, via Motorku X' },
      { nama: 'Special Gift Helm Stylo Y2K',   diskon: '244.200', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Institusi LPD & Koperasi',      diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                   diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',      diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman',  diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '444.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  vario160: {
    nasional: [],
    bali: [
      { nama: 'Trade In Move on to 160 Pride', diskon: '666.000', syarat: 'RO AT di bawah 155cc kompetitor, via Motorku X' },
      { nama: 'Institusi LPD & Koperasi',      diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                   diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',      diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman',  diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '666.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  pcx160: {
    nasional: [],
    bali: [
      { nama: 'Trade In Move on to 160 Pride', diskon: '666.000', syarat: 'RO AT di bawah 155cc kompetitor, via Motorku X' },
      { nama: 'PCX 160 Free Maintenance',      diskon: '250.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Institusi LPD & Koperasi',      diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                   diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',      diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman',  diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '666.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  adv160: {
    nasional: [
      { nama: 'Program Sales Disc ADV 160', diskon: '1.110.000', syarat: 'Konsumen Cash & Credit' },
    ],
    bali: [
      { nama: 'Trade In Move on to 160 Pride', diskon: '111.000', syarat: 'RO AT di bawah 155cc kompetitor, via Motorku X' },
      { nama: 'ADV 160 Free Maintenance',      diskon: '250.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Institusi LPD & Koperasi',      diskon: '555.000', syarat: 'Penjualan CASH — wajib lampirkan PO' },
      { nama: 'Rental Bike',                   diskon: '555.000', syarat: 'Cash & Credit — wajib lampirkan PO' },
      { nama: 'Direct Gift Safety Tools',      diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman',  diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: { diskon: '111.000', diskonBPR: '555.000', syarat: 'Karyawan Hotel / Villa / Homestay / Koperasi / SPPG — Cash & Credit' },
  },
  electric: {
    nasional: [
      { nama: 'Sales Disc EM1 e:',    diskon: '22.533.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Voucher EM1 e:',       diskon: '6.000.000',  syarat: 'Konsumen Cash & Credit' },
      { nama: 'Sales Disc Icon e:',   diskon: '6.105.000',  syarat: 'Konsumen Cash & Credit' },
      { nama: 'Voucher CUV e:',       diskon: '12.000.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Sales Disc CUV e:',    diskon: '24.087.000', syarat: 'Konsumen Cash & Credit' },
    ],
    bali: [],
    segmen: null,
  },
  // default for models not listed above
  _default: {
    nasional: [],
    bali: [
      { nama: 'Direct Gift Safety Tools',     diskon: '270.000', syarat: 'Konsumen Cash & Credit' },
      { nama: 'Direct Gift Jaket #Cari Aman', diskon: '115.000', syarat: 'Konsumen Cash & Credit' },
    ],
    segmen: null,
    diskonBPR: null,
  },
};

// ─── MENU TEMPLATES ──────────────────────────────────────────────────────────
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

// ─── RESPONSE FUNCTIONS ───────────────────────────────────────────────────────

function unitOverview() {
  let msg = '🏍️ *Daftar Model Honda – Kecak Motor*\n';
  msg += '_OTR Bali | SK Mei 2026 | Termasuk PPN, STNK, BBN, BPKB_\n\n';
  msg += 'Ketik nama model untuk melihat semua tipe, harga & promo:\n\n';
  for (const [, fam] of Object.entries(KB.catalog)) {
    const minPrice = Math.min(...fam.types.map(t => parseInt(t.harga.replace(/\./g, ''))));
    msg += `• *${fam.nama}* — mulai Rp ${minPrice.toLocaleString('id-ID')}\n`;
  }
  msg += '\nContoh: ketik *beat*, *scoopy*, *vario 125*\n';
  msg += 'Ketik *4* untuk tanya langsung ke sales kami.';
  return msg;
}

function unitDetail(familyKey) {
  const fam = KB.catalog[familyKey];
  if (!fam) return null;
  const promo = PROMO[familyKey] || PROMO._default;

  let msg = `🏍️ *${fam.nama} – Harga OTR Bali (Mei 2026)*\n\n`;

  // Prices
  fam.types.forEach(t => {
    msg += `• ${t.tipe}\n  💰 Rp ${t.harga}\n\n`;
  });

  const isGift = (nama) => nama.toLowerCase().includes('gift');
  const promoLine = (p) => isGift(p.nama)
    ? `• ${p.nama}\n  _Syarat: ${p.syarat}_\n`
    : `• ${p.nama}: *Rp ${p.diskon}*\n  _Syarat: ${p.syarat}_\n`;

  // National promos
  if (promo.nasional.length > 0) {
    msg += `🇮🇩 *Promo Nasional (AHM):*\n`;
    promo.nasional.forEach(p => { msg += promoLine(p); });
    msg += '\n';
  }

  // Bali regional promos
  if (promo.bali.length > 0) {
    msg += `🌺 *Promo Regional Bali:*\n`;
    promo.bali.forEach(p => { msg += promoLine(p); });
    msg += '\n';
  }

  // Segment prompt
  if (promo.segmen) {
    msg += `❓ Apakah Bapak/Ibu bekerja di *hotel, villa, guest house, homestay, koperasi, BPR, atau instansi khusus*?\n`;
    msg += `Ada diskon tambahan untuk segmen tersebut.\n`;
    msg += `Ketik *YA* untuk info lebih lanjut.\n\n`;
  }

  msg += `📞 Harga & promo dapat berubah sewaktu-waktu.\n`;
  msg += `Ketik *4* untuk tanya sales atau *1* untuk daftar model lain.`;
  return msg;
}

function segmentInfo(familyKey) {
  const fam = KB.catalog[familyKey];
  const promo = PROMO[familyKey] || PROMO._default;
  if (!promo.segmen) return null;

  let msg = `🎯 *Diskon Segmen Khusus – ${fam ? fam.nama : 'Honda'}*\n\n`;

  msg += `• Karyawan Hotel / Villa / Guest House / Homestay\n`;
  msg += `  Karyawan Koperasi / Koperasi Merah Putih / SPPG\n`;
  msg += `  Diskon: *Rp ${promo.segmen.diskon}*\n`;
  msg += `  _Syarat: ${promo.segmen.syarat}_\n\n`;

  if (promo.segmen.diskonBPR) {
    msg += `• BPR (Bank Perkreditan Rakyat)\n`;
    msg += `  Diskon: *Rp ${promo.segmen.diskonBPR}*\n`;
    msg += `  _Syarat: Cash & Credit — wajib lampirkan PO_\n\n`;
  }

  msg += `✅ Dapat digabung dengan promo nasional & Bali jika syarat terpenuhi.\n\n`;
  msg += `Mau kami hubungkan dengan Sales Advisor, atau ingin booking test ride langsung?\nKetik *4* untuk chat dengan sales kami.`;
  return msg;
}

function locationInfo() {
  return `📍 *Kecak Motor*\n\n` +
    `🏢 ${KB.address}\n` +
    `🗺️ ${KB.gmaps}\n\n` +
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
    `Ketik *4* untuk simulasi kredit dengan sales kami.\n\n` +
    `📞 ${KB.phone}\n\n` +
    `_Ketik *0* untuk kembali ke menu._`;
}

// ─── MAIN MESSAGE ROUTER ─────────────────────────────────────────────────────
function detectLanguage(text) {
  return ['hello', 'hi', 'help', 'price', 'stock', 'how', 'what', 'credit', 'promo']
    .some(w => text.toLowerCase().includes(w)) ? 'en' : 'id';
}

function findFamily(input) {
  for (const [key, fam] of Object.entries(KB.catalog)) {
    if (fam.keywords.some(kw => input.includes(kw))) return key;
  }
  if (input.includes('vario')) return 'vario_ask';
  if (input.includes('cbr'))   return 'cbr_ask';
  return null;
}

function route(from, text) {
  const input = text.trim().toLowerCase();

  // ── Handle active segment session ──
  const session = sessions[from];
  if (session && session.flow === 'segment_ask') {
    const isYes = ['ya', 'yes', 'iya', 'hotel', 'villa', 'homestay', 'guest house',
                   'koperasi', 'sppg', 'instansi', 'kantor', 'bpr', 'bank'].some(k => input.includes(k));
    if (isYes) {
      delete sessions[from];
      return segmentInfo(session.model) ||
        `Maaf, tidak ada diskon segmen tersedia untuk model ini.\n\nKetik *4* untuk tanya sales atau *0* untuk menu.`;
    } else {
      delete sessions[from];
      return `Baik! Untuk info lebih lanjut, ketik *4* untuk chat dengan sales kami.\n\n_Ketik *0* untuk menu._`;
    }
  }

  // ── Menu / greeting ──
  if (['menu', '0', 'halo', 'hi', 'hello', 'hai', 'mulai', 'start'].some(k => input.includes(k))) {
    return detectLanguage(input) === 'en' ? MENU_EN : MENU;
  }

  // ── Option 1: model overview ──
  if (input === '1' || input === 'harga' || input.includes('daftar motor')
    || input.includes('list motor') || input.includes('semua motor')) {
    return unitOverview();
  }

  // ── Model keyword → family detail ──
  const modelTriggers = ['harga', 'berapa', 'tipe', 'type', 'promo', 'motor', 'unit',
    'stok', 'stock', 'beat', 'genio', 'scoopy', 'vario', 'stylo', 'pcx', 'adv',
    'sonic', 'verza', 'cbr', 'crf', 'forza', 'monkey', 'revo', 'supra'];
  const hasModelTrigger = modelTriggers.some(k => input.includes(k));

  if (hasModelTrigger) {
    const familyKey = findFamily(input);
    if (familyKey === 'vario_ask') {
      return `Anda mencari Vario tipe berapa?\n\n• Ketik *vario 125* untuk Vario 125\n• Ketik *vario 160* untuk Vario 160\n• Ketik *stylo* untuk Stylo 160`;
    }
    if (familyKey === 'cbr_ask') {
      return `Anda mencari CBR tipe berapa?\n\n• Ketik *cbr 150* untuk CBR 150R\n• Ketik *cbr 250* untuk CBR 250RR`;
    }
    if (familyKey) {
      const promo = PROMO[familyKey] || PROMO._default;
      if (promo.segmen) {
        sessions[from] = { flow: 'segment_ask', model: familyKey };
      }
      return unitDetail(familyKey);
    }
    return unitOverview();
  }

  // ── Option 2: location ──
  if (input === '2' || input.includes('jam') || input.includes('alamat') || input.includes('lokasi')
    || input.includes('address') || input.includes('location') || input.includes('buka')
    || input.includes('tutup')) {
    return locationInfo();
  }

  // ── Option 3: credit ──
  if (input === '3' || input.includes('kredit') || input.includes('cicil') || input.includes('dp')
    || input.includes('finance') || input.includes('loan') || input.includes('angsuran')
    || input.includes('tenor')) {
    return creditInfo();
  }

  // ── Option 4: escalate ──
  if (input === '4' || input.includes('staff') || input.includes('sales') || input.includes('manusia')
    || input.includes('human') || input.includes('cs') || input.includes('admin')
    || input.includes('hubungi')) {
    notifyStaff({ type: 'escalation', phone: from, message: text });
    return `👤 Oke! Saya sudah menghubungi staff kami.\n\nStaff kami akan membalas dalam beberapa menit.\n\nJam operasional: ${KB.hours}\n\n_Ketik *0* untuk menu._`;
  }

  // ── Warranty ──
  if (input.includes('warranty') || input.includes('garansi')) {
    return `🛡️ *Garansi Honda*\n\nUnit baru: garansi 3 tahun atau 30.000 km\nSuku cadang resmi: garansi 6 bulan\n\nKetik *4* untuk info lebih lanjut.\n\n_Ketik *0* untuk menu._`;
  }

  // ── Default ──
  return `Maaf, saya belum mengerti permintaan Anda. 🙏\n\nKetik *0* untuk menu lengkap, atau *4* untuk bicara dengan staff kami.`;
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

app.get('/api/stats', (req, res) => res.json({ status: 'online' }));
app.use(express.static('dashboard'));

app.listen(CONFIG.PORT, () => {
  console.log(`\n🏍️  Kecak Motor Bot running on port ${CONFIG.PORT}`);
  console.log(`📱  Webhook URL: https://YOUR-DOMAIN/webhook`);
  console.log(`🔑  Verify token: ${CONFIG.VERIFY_TOKEN}\n`);
});
