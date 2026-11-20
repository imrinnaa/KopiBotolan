'use strict';

// Lapisan akses database. Driver bisa diganti lewat DB_DRIVER di .env:
//   sqlite -> better-sqlite3 (dipakai bawaan proyek ini)
//   mysql  -> mysql2/promise
// Antarmuka yang dipakai controller sama untuk keduanya (query(sql, params)).

const path = require('path');
const fs = require('fs');
const config = require('./env');

function buatSqlite() {
  // better-sqlite3 dipasang sebagai dependency; dimuat di sini agar pesan
  // errornya jelas bila paket belum terpasang.
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    throw new Error(
      'Paket better-sqlite3 belum terpasang. Jalankan: npm install'
    );
  }

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  const db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const skema = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  db.exec(skema);

  return {
    driver: 'sqlite',
    // better-sqlite3: kirim semua baris sekaligus, parameter pakai ? atau nama.
    async query(sql, params = []) {
      const stmt = db.prepare(sql);
      const s = sql.trim().toLowerCase();
      if (s.startsWith('select') || s.startsWith('pragma') || s.startsWith('with')) {
        return [stmt.all(...params), []];
      }
      const hasil = stmt.run(...params);
      return [
        { insertId: Number(hasil.lastInsertRowid), affectedRows: hasil.changes },
        [],
      ];
    },
    async tutup() {
      db.close();
    },
  };
}

function buatMysql() {
  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (err) {
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

  return {
    driver: 'mysql',
    async query(sql, params = []) {
      const [baris] = await pool.query(sql, params);
      return [baris, []];
    },
    async tutup() {
      await pool.end();
    },
  };
}

const db = config.driver === 'mysql' ? buatMysql() : buatSqlite();

module.exports = db;
module.exports.config = config;
