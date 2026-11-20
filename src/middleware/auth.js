'use strict';

// Autentikasi admin berbasis sesi + cookie httpOnly (poin BONUS).
// Sesi disimpan di tabel `sesi` lewat Prisma, cocok untuk proyek latihan.

const prisma = require('../config/db');
const config = require('../config/env');
const { hashKataSandi, cocokkanKataSandi } = require('../config/kata-sandi');

const NAMA_COOKIE = 'kbt_sesi';
const KEDALUWARSA_JAM = config.admin.sesiJam || 8;

function kueBagus() {
  return require('cookie-parser')();
}

async function siapkanAdmin() {
  // Pastikan akun admin ada dan kata sandinya cocok dengan .env.
  const ada = await prisma.admin.findUnique({
    where: { username: config.admin.user },
  });
  const hash = config.admin.passHash
    ? config.admin.passHash
    : hashKataSandi(config.admin.pass);

  if (!ada) {
    await prisma.admin.create({
      data: { username: config.admin.user, passHash: hash },
    });
    return;
  }

  // Bila ADMIN_PASS di .env berganti, hash lama diperbarui.
  if (!cocokkanKataSandi(config.admin.pass, ada.passHash)) {
    await prisma.admin.update({ where: { id: ada.id }, data: { passHash: hash } });
  }
}

async function verifikasiKredensial(username, kataSandi) {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;

  const cocok = config.admin.passHash
    ? cocokkanKataSandi(kataSandi, config.admin.passHash)
    : cocokkanKataSandi(kataSandi, admin.passHash);

  if (!cocok) return null;
  return { id: admin.id, username: admin.username };
}

async function buatSesi(res, admin) {
  const sesi = await prisma.sesi.create({
    data: {
      adminId: admin.id,
      expiredPada: new Date(Date.now() + KEDALUWARSA_JAM * 3600 * 1000),
    },
  });

  res.cookie(NAMA_COOKIE, sesi.id, {
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

  const sesi = await prisma.sesi.findUnique({
    where: { id: idSesi },
    include: { admin: true },
  });

  if (!sesi) {
    res.clearCookie(NAMA_COOKIE, { path: '/' });
    req.admin = null;
    return next();
  }

  if (sesi.expiredPada.getTime() < Date.now()) {
    await prisma.sesi.delete({ where: { id: idSesi } });
    res.clearCookie(NAMA_COOKIE, { path: '/' });
    req.admin = null;
    return next();
  }

  req.admin = { id: sesi.adminId, username: sesi.admin.username };
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
  if (idSesi) {
    await prisma.sesi.deleteMany({ where: { id: idSesi } });
  }
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
