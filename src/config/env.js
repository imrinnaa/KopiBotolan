'use strict';

// Pembaca file .env tanpa paket tambahan (proyek ini sengaja hanya butuh express,
// cookie-parser, dan better-sqlite3). Kredensial database TIDAK ditulis di kode.

// File .env diletakkan di akar proyek: <akar>/.env, di mana <akar> adalah folder
// yang memuat package.json dan src/. __dirname di sini <akar>/src/config.

const fs = require('fs');
const path = require('path');

const AKAR_PROYEK = path.resolve(__dirname, '..', '..');
const ENV_FILE = path.join(AKAR_PROYEK, '.env');

function bacaEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const baris = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
  for (const baris_ of baris) {
    const teks = baris_.trim();
    if (!teks || teks.startsWith('#')) continue;
    const nama = teks.slice(0, teks.indexOf('=')).trim();
    let nilai = teks.slice(teks.indexOf('=') + 1).trim();
    if (
      (nilai.startsWith('"') && nilai.endsWith('"')) ||
      (nilai.startsWith("'") && nilai.endsWith("'"))
    ) {
      nilai = nilai.slice(1, -1);
    }
    if (!(nama in process.env)) process.env[nama] = nilai;
  }
}

bacaEnv();

function ambil(nama, bawaan) {
  const nilai = process.env[nama];
  return nilai === undefined || nilai === '' ? bawaan : nilai;
}

module.exports = {
  akarProyek: AKAR_PROYEK,
  fileEnv: ENV_FILE,

  port: Number(ambil('PORT', 3000)),
  nodeEnv: ambil('NODE_ENV', 'development'),

  // --- Database ---
  driver: ambil('DB_DRIVER', 'sqlite').toLowerCase(),
  dbPath: path.resolve(AKAR_PROYEK, ambil('DB_PATH', './data/kopi-botolan.sqlite')),
  mysql: {
    host: ambil('DB_HOST', 'localhost'),
    port: Number(ambil('DB_PORT', 3306)),
    user: ambil('DB_USER', 'root'),
    password: ambil('DB_PASS', ''),
    database: ambil('DB_NAME', 'company_profile'),
  },

  // --- Login admin ---
  admin: {
    user: ambil('ADMIN_USER', 'admin'),
    pass: ambil('ADMIN_PASS', 'admin123'),
    passHash: ambil('ADMIN_PASS_HASH', ''),
    sessionSecret: ambil('SESSION_SECRET', 'ganti-ini'),
    sesiJam: 8,
  },

  // --- Info perusahaan ---
  perusahaan: {
    nama: ambil('NAMA_PERUSAHAAN', 'Kopi Botolan'),
    tagline: ambil('TAGLINE', ''),
  },
};
