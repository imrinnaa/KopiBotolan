'use strict';

// Validasi input + pesan error yang ramah (poin BONUS).
// Semua pesan memakai Bahasa Indonesia dan menyebut field yang dimaksud.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function bersihkan(teks) {
  if (teks === null || teks === undefined) return '';
  return String(teks).trim();
}

function potong(teks, maks) {
  return teks.length > maks ? teks.slice(0, maks) : teks;
}

function validasiLayanan(input, { sebagian = false } = {}) {
  const errors = {};
  const data = {};

  if (!sebagian || input.nama !== undefined) {
    const nama = potong(bersihkan(input.nama), 120);
    if (!nama) {
      errors.nama = 'Nama layanan wajib diisi.';
    } else if (nama.length < 3) {
      errors.nama = 'Nama layanan minimal 3 huruf.';
    } else {
      data.nama = nama;
    }
  }

  if (!sebagian || input.deskripsi !== undefined) {
    const deskripsi = potong(bersihkan(input.deskripsi), 600);
    if (!deskripsi) {
      errors.deskripsi = 'Deskripsi layanan wajib diisi, supaya pengunjung tahu isinya.';
    } else if (deskripsi.length < 10) {
      errors.deskripsi = 'Deskripsi minimal 10 huruf.';
    } else {
      data.deskripsi = deskripsi;
    }
  }

  if (input.ikon !== undefined && input.ikon !== null && input.ikon !== '') {
    const ikon = potong(bersihkan(input.ikon), 40).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(ikon)) {
      errors.ikon = 'Ikon hanya boleh huruf kecil, angka, dan tanda hubung.';
    } else {
      data.ikon = ikon;
    }
  }

  if (input.harga !== undefined && input.harga !== null && input.harga !== '') {
    const harga = Number(input.harga);
    if (!Number.isFinite(harga) || harga < 0) {
      errors.harga = 'Harga harus berupa angka dan tidak boleh negatif.';
    } else if (harga > 100000000) {
      errors.harga = 'Harga terlalu besar.';
    } else {
      data.harga = Math.round(harga);
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, data };
}

function validasiPesan(input) {
  const errors = {};

  const nama = potong(bersihkan(input.nama), 100);
  if (!nama) errors.nama = 'Nama wajib diisi.';
  else if (nama.length < 2) errors.nama = 'Nama minimal 2 huruf.';

  const email = potong(bersihkan(input.email), 120);
  if (!email) {
    errors.email = 'Email wajib diisi.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Format email belum benar, contoh: nama@email.com.';
  }

  const isi = potong(bersihkan(input.isi), 1000);
  if (!isi) {
    errors.isi = 'Pesan wajib diisi.';
  } else if (isi.length < 10) {
    errors.isi = 'Pesan minimal 10 huruf, agar jelas maksudnya.';
  }

  let telepon = null;
  if (bersihkan(input.telepon)) {
    telepon = potong(bersihkan(input.telepon), 25);
    if (!/^\+?[0-9\s-]{6,25}$/.test(telepon)) {
      errors.telepon = 'Nomor telepon hanya boleh angka, spasi, tanda hubung, dan + di depan.';
      telepon = null;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, errors: {}, data: { nama, email, isi, telepon } };
}

function validasiLogin(input) {
  const errors = {};
  const username = bersihkan(input.username);
  const kataSandi = input.password === undefined || input.password === null ? '' : String(input.password);

  if (!username) errors.username = 'Nama pengguna wajib diisi.';
  if (!kataSandi) errors.password = 'Kata sandi wajib diisi.';

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, errors: {}, data: { username, kataSandi } };
}

module.exports = { validasiLayanan, validasiPesan, validasiLogin, EMAIL_RE };
