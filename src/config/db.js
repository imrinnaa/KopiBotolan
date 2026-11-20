'use strict';

// Lapisan akses database. Driver bisa diganti lewat DB_DRIVER di .env:
//   sqlite -> node:sqlite (bawaan Node.js 22.5+, tanpa paket native sama sekali)
//             bila tidak ada, fallback ke better-sqlite3 (dependency opsional)
//   mysql  -> mysql2/promise
// Antarmuka yang dipakai controller sama untuk semua driver: query(sql, params).

const fs = require('fs');
const path = require('path');
const config = require('./env');

function muat(modul) {
  try {
    return require(modul);
  } catch {
    return null;
  }
}

function bacaSkema(berkas) {
  return fs.readFileSync(path.join(__dirname, '..', '..', 'database', berkas), 'utf8');
}

// Frasa SQL untuk waktu, berbeda antar database. Dipakai controller agar
// query tetap satu bahasa di kedua driver.
const DIALEK = {
  sqlite: {
    sekarang: "datetime('now','localtime')",
    tambahJam: (jam) => `datetime('now', '+${Number(jam)} hours')`,
  },
  mysql: {
    sekarang: 'NOW()',
    tambahJam: (jam) => `DATE_ADD(NOW(), INTERVAL ${Number(jam)} HOUR)`,
  },
};

function buatSqliteNodeBawaan() {
  const { DatabaseSync } = muat('node:sqlite');
  if (!DatabaseSync) return null;

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  const db = new DatabaseSync(config.dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(bacaSkema('schema.sql'));

  return {
    driver: 'sqlite (node:sqlite)',
    dialek: DIALEK.sqlite,
    async query(sql, params = []) {
      const stmt = db.prepare(sql);
      const s = sql.trim().toLowerCase();
      if (s.startsWith('select') || s.startsWith('pragma') || s.startsWith('with')) {
        return [stmt.all(...params), []];
      }
      const hasil = stmt.run(...params);
      return [
        { insertId: Number(hasil.lastInsertRowid), affectedRows: Number(hasil.changes) },
        [],
      ];
    },
    async tutup() {
      db.close();
    },
  };
}

function buatSqlitePaket() {
  const Database = muat('better-sqlite3');
  if (!Database) {
    throw new Error(
      'SQLite tidak tersedia. Pakai Node.js 22.5 ke atas (ada node:sqlite), ' +
        'atau pasang: npm install better-sqlite3'
    );
  }

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  const db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(bacaSkema('schema.sql'));

  return {
    driver: 'sqlite (better-sqlite3)',
    dialek: DIALEK.sqlite,
    async query(sql, params = []) {
      const stmt = db.prepare(sql);
      const s = sql.trim().toLowerCase();
      if (s.startsWith('select') || s.startsWith('pragma') || s.startsWith('with')) {
        return [stmt.all(...params), []];
      }
      const hasil = stmt.run(...params);
      return [
        { insertId: Number(hasil.lastInsertRowid), affectedRows: Number(hasil.changes) },
        [],
      ];
    },
    async tutup() {
      db.close();
    },
  };
}

function buatMysql() {
  const mysql = muat('mysql2/promise');
  if (!mysql) {
    throw new Error(
      'DB_DRIVER=mysql dipilih, tetapi paket mysql2 belum terpasang. Jalankan: npm install mysql2'
    );
  }

  const pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });

  // Tabel dibuat saat koneksi pertama dipakai, jadi server langsung bisa jalan.
  const siapkan = (async () => {
    const skema = bacaSkema('schema.mysql.sql');
    for (const perintah of skema
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      await pool.query(perintah);
    }
  })();

  return {
    driver: 'mysql (mysql2)',
    dialek: DIALEK.mysql,
    async query(sql, params = []) {
      await siapkan;
      const [baris] = await pool.query(sql, params);
      return [baris, []];
    },
    async tutup() {
      await pool.end();
    },
  };
}

const db =
  config.driver === 'mysql'
    ? buatMysql()
    : buatSqliteNodeBawaan() || buatSqlitePaket();

module.exports = db;
module.exports.config = config;
