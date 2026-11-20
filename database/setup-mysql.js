'use strict';

// Menyiapkan database MySQL/MariaDB untuk proyek ini.
// Jalankan sekali sebelum npm start:  node database/setup-mysql.js
// (XAMPP: nyalakan dulu MySQL-nya.)

const fs = require('fs');
const path = require('path');
const config = require('../src/config/env');

function bagi(sql) {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const mysql = require('mysql2/promise');

  const koneksi = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
  });

  await koneksi.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await koneksi.changeUser({ database: config.mysql.database });
  console.log(`Database "${config.mysql.database}" siap.`);

  const skema = fs.readFileSync(path.join(__dirname, 'schema.mysql.sql'), 'utf8');
  for (const perintah of bagi(skema)) await koneksi.query(perintah);
  console.log('Tabel layanan, pesan, admin, dan sesi dibuat.');

  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  for (const perintah of bagi(seed)) await koneksi.query(perintah);
  console.log('Data contoh sudah diisi. Sekarang jalankan: npm start');

  await koneksi.end();
}

main().catch((err) => {
  console.error('Gagal menyiapkan MySQL:', err.message);
  process.exit(1);
});
