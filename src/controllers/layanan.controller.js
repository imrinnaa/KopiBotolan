'use strict';

// Controller layanan memakai Prisma Client (ORM).
// Model Layanan ada di prisma/schema.prisma.

const prisma = require('../config/db');
const { validasiLayanan } = require('../middleware/validasi');

function ambilId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Prisma sudah mengembalikan bentuk yang hampir sama dengan API lama.
function normalisasi(item) {
  if (!item) return null;
  return {
    id: item.id,
    nama: item.nama,
    deskripsi: item.deskripsi,
    ikon: item.ikon || 'kopi',
    harga: item.harga,
    aktif: Boolean(item.aktif),
    dibuat_pada: item.dibuatPada,
    diubah_pada: item.diubahPada,
  };
}

exports.semua = async (req, res, next) => {
  try {
    const hanyaAktif = req.query.aktif !== 'semua';
    const items = await prisma.layanan.findMany({
      where: hanyaAktif ? { aktif: true } : {},
      orderBy: { id: 'asc' },
    });
    res.json(items.map(normalisasi));
  } catch (err) {
    next(err);
  }
};

exports.satu = async (req, res, next) => {
  try {
    const id = ambilId(req);
    if (!id) return res.status(400).json({ pesan: 'ID layanan tidak valid.' });

    const item = await prisma.layanan.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });
    }
    res.json(normalisasi(item));
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

    const item = await prisma.layanan.create({
      data: {
        nama: data.nama,
        deskripsi: data.deskripsi,
        ikon: data.ikon || 'kopi',
        harga: data.harga === undefined ? null : data.harga,
      },
    });
    res.status(201).json(normalisasi(item));
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

    const lama = await prisma.layanan.findUnique({ where: { id } });
    if (!lama) {
      return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });
    }

    const item = await prisma.layanan.update({
      where: { id },
      data: {
        nama: data.nama ?? lama.nama,
        deskripsi: data.deskripsi ?? lama.deskripsi,
        ikon: data.ikon || lama.ikon || 'kopi',
        harga: data.harga === undefined ? lama.harga : data.harga,
      },
    });
    // diubahPada terisi otomatis oleh @updatedAt di skema Prisma.
    res.json(normalisasi(item));
  } catch (err) {
    next(err);
  }
};

exports.hapus = async (req, res, next) => {
  try {
    const id = ambilId(req);
    if (!id) return res.status(400).json({ pesan: 'ID layanan tidak valid.' });

    try {
      await prisma.layanan.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ pesan: `Layanan dengan ID ${id} tidak ditemukan.` });
      }
      throw err;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
