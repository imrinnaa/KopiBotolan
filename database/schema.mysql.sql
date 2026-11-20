-- Struktur database Kopi Botolan untuk MySQL / MariaDB.
-- Dipakai bila DB_DRIVER=mysql di .env. Jalankan: node database/setup-mysql.js
-- atau buat database `company_profile` lalu eksekusi file ini di phpMyAdmin.

CREATE TABLE IF NOT EXISTS layanan (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(120) NOT NULL CHECK (CHAR_LENGTH(TRIM(nama)) > 0),
  deskripsi   TEXT         NOT NULL,
  ikon        VARCHAR(40)  NOT NULL DEFAULT 'kopi',
  harga       INT          NULL,
  aktif       TINYINT(1)   NOT NULL DEFAULT 1,
  dibuat_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_layanan_aktif ON layanan (aktif, id);

CREATE TABLE IF NOT EXISTS pesan (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nama         VARCHAR(100) NOT NULL,
  email        VARCHAR(120) NOT NULL,
  telepon      VARCHAR(25)  NULL,
  isi          TEXT         NOT NULL,
  sudah_dibaca TINYINT(1)   NOT NULL DEFAULT 0,
  dibuat_pada  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_pesan_baru ON pesan (sudah_dibaca, id);

CREATE TABLE IF NOT EXISTS admin (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50) NOT NULL UNIQUE,
  pass_hash   VARCHAR(200) NOT NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesi (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  admin_id     INT NOT NULL,
  dibuat_pada  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expired_pada DATETIME NOT NULL,
  CONSTRAINT fk_sesi_admin FOREIGN KEY (admin_id) REFERENCES admin (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_sesi_expired ON sesi (expired_pada);
