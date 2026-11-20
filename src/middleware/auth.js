'use strict';

// Autentikasi admin berbasis sesi + cookie httpOnly (poin BONUS).
// Tidak memakai paket JWT: sesi disimpan di tabel `sesi`, cocok untuk proyek latihan.

const crypto = require('crypto');
const db = require('../config/db');
const config = require('../config/env');
const { hashKataSandi, cocokkanKataSandi } = require('../config/kata-sandi');

const NAMA_COOKIE = 'kbt_sesi';
const KEDALUWARSA_JAM = config.admin.sesiJam || 8;

function buatIdSesi() {
  return crypto.randomBytes(24).toString('hex');
}

function kueBagus() {
  // cookie-parser tanpa secret; kita memakai tanda tangan sendiri lewat id acak.
  return require('cookie-parser')();
}

async function siapkanAdmin() {
  // Pastikan akun admin ada dan kata sandinya cocok dengan .env.
  // Bila admin pertama kali dibuat memakai ADMIN_PASS yang lama, hash-nya
  // diperbarui agar selalu mengikuti nilai .env saat ini.
  const [baris] = await db.query('SELECT * FROM admin WHERE username = ? LIMIT 1', [
    config.admin.user,
  ]);
  const hash = config.admin.passHash
    ? config.admin.passHash
    : hashKataSandi(config.admin.pass);

  if (!baris[0]) {
    await db.query('INSERT INTO admin (username, pass_hash) VALUES (?, ?)', [
      config.admin.user,
      hash,
    ]);
    return;
  }

  if (!cocokkanKataSandi(config.admin.pass, baris[0].pass_hash)) {
    await db.query('UPDATE admin SET pass_hash = ? WHERE id = ?', [hash, baris[0].id]);
  }
}

async function verifikasiKredensial(username, kataSandi) {
  const [baris] = await db.query('SELECT * FROM admin WHERE username = ? LIMIT 1', [username]);
  const admin = baris[0];
  if (!admin) return null;

  const cocok = config.admin.passHash
    ? cocokkanKataSandi(kataSandi, config.admin.passHash)
    : cocokkanKataSandi(kataSandi, admin.pass_hash);

  if (!cocok) return null;
  return { id: admin.id, username: admin.username };
}

async function buatSesi(res, admin) {
  const id = buatIdSesi();
  const expired = new Date(Date.now() + KEDALUWARSA_JAM * 3600 * 1000);
  await db.query('INSERT INTO sesi (id, admin_id, expired_pada) VALUES (?, ?, ?)', [
    id,
    admin.id,
    expired.toISOString().slice(0, 19).replace('T', ' '),
  ]);

  res.cookie(NAMA_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: KEDALUWARSA_JAM * 3600 * 1000,
    path: '/',
  });
}

function ambilSesi(req) {
  return req.cookies && req.cookies[NAMA_COOKIE] ? req.cookies[NAMA_COOKIE] : null;
}

async function cariAdmin(req, res, next) {
  const idSesi = ambilSesi(req);
  if (!idSesi) {
    req.admin = null;
    return next();
  }
  const [baris] = await db.query(
    `SELECT a.id, a.username, s.expired_pada
       FROM sesi s JOIN admin a ON a.id = s.admin_id
      WHERE s.id = ? LIMIT 1`,
    [idSesi]
  );
  const sesi = baris[0];
  if (!sesi) {
    res.clearCookie(NAMA_COOKIE, { path: '/' });
    req.admin = null;
    return next();
  }

  const kedaluwarsa = new Date(String(sesi.expired_pada).replace(' ', 'T') + 'Z');
  if (kedaluwarsa.getTime() < Date.now()) {
    await db.query('DELETE FROM sesi WHERE id = ?', [idSesi]);
    res.clearCookie(NAMA_COOKIE, { path: '/' });
    req.admin = null;
    return next();
  }

  req.admin = { id: sesi.id, username: sesi.username };
  next();
}

function butuhAdmin(req, res, next) {
  if (!req.admin) {
    if (req.path.startsWith('/api/') || req.get('Accept')?.includes('application/json')) {
      return res.status(401).json({ pesan: 'Silakan masuk terlebih dahulu.' });
    }
    return res.redirect('/masuk.html?alasan=belum-masuk');
  }
  next();
}

async function keluar(req, res) {
  const idSesi = ambilSesi(req);
  if (idSesi) await db.query('DELETE FROM sesi WHERE id = ?', [idSesi]);
  res.clearCookie(NAMA_COOKIE, { path: '/' });
}

module.exports = {
  kueBagus,
  siapkanAdmin,
  verifikasiKredensial,
  buatSesi,
  cariAdmin,
  butuhAdmin,
  keluar,
  NAMA_COOKIE,
};
