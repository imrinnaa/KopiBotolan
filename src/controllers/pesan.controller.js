'use strict';

// Controller pesan kontak + masuk/keluar admin. Semua akses data lewat Prisma.

const prisma = require('../config/db');
const { validasiPesan, validasiLogin } = require('../middleware/validasi');
const auth = require('../middleware/auth');

function normalisasiPesan(item) {
  if (!item) return null;
  return {
    id: item.id,
    nama: item.nama,
    email: item.email,
    telepon: item.telepon,
    isi: item.isi,
    sudah_dibaca: Boolean(item.sudahDibaca),
    dibuat_pada: item.dibuatPada,
  };
}

exports.kirim = async (req, res, next) => {
  try {
    const { valid, errors, data } = validasiPesan(req.body || {});
    if (!valid) {
      return res.status(400).json({
        pesan: 'Pesan belum terkirim. Periksa kembali isian Anda.',
        errors,
      });
    }

    const item = await prisma.pesan.create({
      data: { nama: data.nama, email: data.email, telepon: data.telepon, isi: data.isi },
    });
    res.status(201).json({
      pesan: 'Terima kasih! Pesan Anda sudah kami terima.',
      id: item.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.semua = async (req, res, next) => {
  try {
    const items = await prisma.pesan.findMany({ orderBy: { id: 'desc' } });
    res.json(items.map(normalisasiPesan));
  } catch (err) {
    next(err);
  }
};

exports.jumlahBelumDibaca = async (req, res, next) => {
  try {
    const jumlah = await prisma.pesan.count({ where: { sudahDibaca: false } });
    res.json({ jumlah });
  } catch (err) {
    next(err);
  }
};

exports.tandaiDibaca = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ pesan: 'ID pesan tidak valid.' });
    }

    try {
      await prisma.pesan.update({ where: { id }, data: { sudahDibaca: true } });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ pesan: 'Pesan tidak ditemukan.' });
      }
      throw err;
    }
    res.json({ pesan: 'Pesan ditandai sudah dibaca.' });
  } catch (err) {
    next(err);
  }
};

// --- Masuk / keluar admin ---

exports.masuk = async (req, res, next) => {
  try {
    const { valid, errors, data } = validasiLogin(req.body || {});
    if (!valid) {
      return res.status(400).json({ pesan: 'Isian masuk belum lengkap.', errors });
    }

    const admin = await auth.verifikasiKredensial(data.username, data.kataSandi);
    if (!admin) {
      return res.status(401).json({ pesan: 'Nama pengguna atau kata sandi salah.' });
    }

    await auth.buatSesi(res, admin);
    res.json({ pesan: 'Berhasil masuk.', admin: { username: admin.username } });
  } catch (err) {
    next(err);
  }
};

exports.keluar = async (req, res, next) => {
  try {
    await auth.keluar(req, res);
    res.json({ pesan: 'Anda sudah keluar.' });
  } catch (err) {
    next(err);
  }
};

exports.saya = (req, res) => {
  res.json({
    masuk: Boolean(req.admin),
    admin: req.admin ? { username: req.admin.username } : null,
  });
};
