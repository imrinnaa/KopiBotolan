'use strict';

// Controller layanan: SELECT, INSERT, UPDATE, DELETE (slide 26-27).

const db = require('../config/db');
const { validasiLayanan } = require('../middleware/validasi');

function ambilId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalisasi(baris) {
  return {
    id: baris.id,
    nama: baris.nama,
    deskripsi: baris.deskripsi,
    ikon: baris.ikon || 'kopi',
    harga: baris.harga === null ? null : Number(baris.harga),
    aktif: Boolean(baris.aktif),
    dibuat_pada: baris.dibuat_pada,
    diubah_pada: baris.diubah_pada,
  };
}

exports.semua = async (req, res, next) => {
  try {
    const hanyaAktif = req.query.aktif === '1' || req.query.aktif === 'semua' ? null : 1;
    let sql = 'SELECT * FROM layanan';
    const params = [];
    if (hanyaAktif) {
      sql += ' WHERE aktif = 1';
    }
    sql += ' ORDER BY id ASC';
    const [baris] = await db.query(sql, params);
    res.json(baris.map(normalisasi));
  } catch (err) {
    next(err);
  }
};

exports.satu = async (req, res, next) => {
  try {
    const id = ambilId(req);
    if (!id) return res.status(400).json({ pesan: 'ID layanan tidak valid.' });

    const [baris] = await db.query('SELECT * FROM layanan WHERE id = ?', [id]);
    if (!baris[0]) return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });
    res.json(normalisasi(baris[0]));
  } catch (err) {
    next(err);
  }
};

exports.tambah = async (req, res, next) => {
  try {
    const { valid, errors, data } = validasiLayanan(req.body || {});
    if (!valid) {
      return res.status(400).json({
        pesan: 'Data layanan belum lengkap. Periksa kembali isian Anda.',
        errors,
      });
    }

    const sql = `INSERT INTO layanan (nama, deskripsi, ikon, harga)
                 VALUES (?, ?, ?, ?)`;
    const [hasil] = await db.query(sql, [
      data.nama,
      data.deskripsi,
      data.ikon || 'kopi',
      data.harga === undefined ? null : data.harga,
    ]);

    const [baris] = await db.query('SELECT * FROM layanan WHERE id = ?', [hasil.insertId]);
    res.status(201).json(normalisasi(baris[0]));
  } catch (err) {
    next(err);
  }
};

exports.ubah = async (req, res, next) => {
  try {
    const id = ambilId(req);
    if (!id) return res.status(400).json({ pesan: 'ID layanan tidak valid.' });

    const { valid, errors, data } = validasiLayanan(req.body || {});
    if (!valid) {
      return res.status(400).json({
        pesan: 'Data layanan belum lengkap. Periksa kembali isian Anda.',
        errors,
      });
    }

    const [lama] = await db.query('SELECT * FROM layanan WHERE id = ?', [id]);
    if (!lama[0]) return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });

    // Field yang tidak dikirim memakai nilai lama, sehingga PUT dan PATCH sama nyaman.
    const nama = data.nama ?? lama[0].nama;
    const deskripsi = data.deskripsi ?? lama[0].deskripsi;
    const ikon = data.ikon || lama[0].ikon || 'kopi';
    const harga = data.harga === undefined ? lama[0].harga : data.harga;

    await db.query(
      `UPDATE layanan
          SET nama = ?, deskripsi = ?, ikon = ?, harga = ?, diubah_pada = ${db.dialek.sekarang}
        WHERE id = ?`,
      [nama, deskripsi, ikon, harga, id]
    );

    const [baris] = await db.query('SELECT * FROM layanan WHERE id = ?', [id]);
    res.json(normalisasi(baris[0]));
  } catch (err) {
    next(err);
  }
};

exports.hapus = async (req, res, next) => {
  try {
    const id = ambilId(req);
    if (!id) return res.status(400).json({ pesan: 'ID layanan tidak valid.' });

    const [hasil] = await db.query('DELETE FROM layanan WHERE id = ?', [id]);
    if (!hasil.affectedRows) {
      return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
