-- Struktur database Kopi Botolan (SQLite)
-- Tabel: layanan (data dari slide: id, nama, deskripsi) dan pesan (id, nama, email, isi)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS layanan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nama        TEXT    NOT NULL CHECK (length(trim(nama)) > 0),
  deskripsi   TEXT    NOT NULL DEFAULT '',
  ikon        TEXT    NOT NULL DEFAULT 'kopi',
  harga       INTEGER,
  aktif       INTEGER NOT NULL DEFAULT 1,
  dibuat_pada TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  diubah_pada TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_layanan_aktif ON layanan (aktif, id);

CREATE TABLE IF NOT EXISTS pesan (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nama         TEXT NOT NULL CHECK (length(trim(nama)) > 0),
  email        TEXT NOT NULL,
  telepon      TEXT,
  isi          TEXT NOT NULL CHECK (length(trim(isi)) > 0),
  sudah_dibaca INTEGER NOT NULL DEFAULT 0,
  dibuat_pada  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_pesan_baru ON pesan (sudah_dibaca, id DESC);

CREATE TABLE IF NOT EXISTS admin (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  pass_hash     TEXT NOT NULL,
  dibuat_pada   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS sesi (
  id         TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admin (id) ON DELETE CASCADE,
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  expired_pada TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesi_expired ON sesi (expired_pada);
