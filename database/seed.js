'use strict';

// Isi database dengan data awal: npm run seed
//   node database/seed.js          -> isi bila tabel layanan masih kosong
//   node database/seed.js --reset  -> hapus lalu isi ulang

const fs = require('fs');
const path = require('path');

const config = require('../src/config/env');
const db = require('../src/config/db');

const reset = process.argv.includes('--reset');

async function main() {
  if (!fs.existsSync(config.dbPath)) {
    console.error('File database belum ada. Jalankan server dulu: npm start');
    process.exit(1);
  }

  const [layanan] = await db.query('SELECT COUNT(*) AS jumlah FROM layanan');
  const jumlah = layanan[0].jumlah;

  if (jumlah > 0 && !reset) {
    console.log(`Tabel layanan sudah berisi ${jumlah} data. Pakai --reset untuk mengisi ulang.`);
    return;
  }

  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  // seed.sql berisi DELETE + INSERT; dijalankan satu per satu agar portabel.
  for (const perintah of seed.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.query(perintah);
  }

  const [baris] = await db.query('SELECT id, nama FROM layanan ORDER BY id');
  console.log(`Selesai. ${baris.length} layanan tersimpan:`);
  for (const item of baris) console.log(`  ${item.id}. ${item.nama}`);

  const [psn] = await db.query('SELECT COUNT(*) AS jumlah FROM pesan');
  console.log(`Pesan contoh: ${psn[0].jumlah}`);
}

main()
  .catch((err) => {
    console.error('Gagal mengisi database:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.tutup();
  });
