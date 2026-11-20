'use strict';

// Controller pesan kontak (POST /api/pesan) dan halaman masuk (login admin).

const db = require('../config/db');
const { validasiPesan, validasiLogin } = require('../middleware/validasi');
const auth = require('../middleware/auth');

function normalisasiPesan(baris) {
  return {
    id: baris.id,
    nama: baris.nama,
    email: baris.email,
    telepon: baris.telepon,
    isi: baris.isi,
    sudah_dibaca: Boolean(baris.sudah_dibaca),
    dibuat_pada: baris.dibuat_pada,
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

    const [hasil] = await db.query(
      'INSERT INTO pesan (nama, email, telepon, isi) VALUES (?, ?, ?, ?)',
      [data.nama, data.email, data.telepon, data.isi]
    );

    res.status(201).json({
      pesan: 'Terima kasih! Pesan Anda sudah kami terima.',
      id: hasil.insertId,
    });
  } catch (err) {
    next(err);
  }
};

exports.semua = async (req, res, next) => {
  try {
    const [baris] = await db.query('SELECT * FROM pesan ORDER BY id DESC');
    res.json(baris.map(normalisasiPesan));
  } catch (err) {
    next(err);
  }
};

exports.jumlahBelumDibaca = async (req, res, next) => {
  try {
    const [baris] = await db.query(
      'SELECT COUNT(*) AS jumlah FROM pesan WHERE sudah_dibaca = 0'
    );
    res.json({ jumlah: baris[0].jumlah });
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
    const [hasil] = await db.query('UPDATE pesan SET sudah_dibaca = 1 WHERE id = ?', [id]);
    if (!hasil.affectedRows) {
      return res.status(404).json({ pesan: 'Pesan tidak ditemukan.' });
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
      return res.status(400).json({
        pesan: 'Isian masuk belum lengkap.',
        errors,
      });
    }

    const admin = await auth.verifikasiKredensial(data.username, data.kataSandi);
    if (!admin) {
      return res.status(401).json({
        pesan: 'Nama pengguna atau kata sandi salah.',
      });
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
