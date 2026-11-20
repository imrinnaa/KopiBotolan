'use strict';

// app.js — merakit semua bagian menjadi satu server (slide 34-35).
// Folder public/ berisi halaman statis; API berada di server yang sama,
// sehingga tidak perlu pengaturan CORS.
// Database diakses lewat Prisma Client (prisma/schema.prisma).

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const prisma = require('./config/db');
const auth = require('./middleware/auth');
const logger = require('./middleware/logger');
const { isiDataAwal } = require('../database/data-awal');

const layananRoutes = require('./routes/layanan.routes');
const pesanRoutes = require('./routes/pesan.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const publik = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(logger);
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(cookieParser());
app.use(auth.cariAdmin);

// --- Halaman admin & masuk ---
// Ditaruh SEBELUM express.static, karena app.use(static) yang berjalan lebih
// dulu akan langsung mengirim file dan mengakhiri respons — route tidak sempat
// memeriksa cookie login.
app.get('/admin.html', auth.butuhAdmin, (req, res) => {
  res.sendFile(path.join(publik, 'admin.html'));
});
app.get('/masuk.html', (req, res) => {
  if (req.admin) return res.redirect('/admin.html');
  res.sendFile(path.join(publik, 'masuk.html'));
});

// --- Halaman statis ---
app.use(express.static(publik, { index: 'index.html', maxAge: '1h' }));

// --- API ---
app.use('/api/layanan', layananRoutes);
app.use('/api/pesan', pesanRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/info', (req, res) => {
  res.json({
    nama: config.perusahaan.nama,
    tagline: config.perusahaan.tagline,
    driver: 'prisma (mysql)',
    versi: require('../package.json').version,
  });
});

// --- 404 untuk API, halaman umum ---
app.use('/api', (req, res) => {
  res.status(404).json({ pesan: `Rute ${req.method} ${req.originalUrl} tidak ditemukan.` });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(publik, '404.html'));
});

// --- Error handler terpusat (empat parameter, diletakkan paling akhir) ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ pesan: 'Isi permintaan bukan JSON yang valid.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ pesan: 'Data terlalu besar.' });
  }
  console.error('ERROR:', err);
  res.status(500).json({ pesan: 'Terjadi kesalahan di server. Coba lagi sebentar lagi.' });
});

// Isi data contoh sekali saja, saat tabel layanan masih kosong.
async function isiBilaKosong() {
  const jumlah = await prisma.layanan.count();
  if (jumlah > 0) return;
  await isiDataAwal(prisma);
  console.log('Data contoh layanan ditambahkan (npm run seed untuk mengisi ulang).');
}

async function mulai() {
  await auth.siapkanAdmin();
  await prisma.sesi.deleteMany({ where: { expiredPada: { lt: new Date() } } });
  await isiBilaKosong();

  const server = app.listen(config.port, () => {
    console.log(`Kopi Botolan berjalan di http://localhost:${config.port}`);
    console.log(`Database: prisma (mysql) — ${config.mysql.database}`);
    console.log(`Admin: ${config.admin.user} — buka http://localhost:${config.port}/masuk.html`);
  });

  const berhenti = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', berhenti);
  process.on('SIGTERM', berhenti);
}

if (require.main === module) {
  mulai().catch((err) => {
    console.error('Gagal menjalankan server:', err.message);
    process.exit(1);
  });
}

module.exports = { app, mulai };
