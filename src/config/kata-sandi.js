'use strict';

// Hash kata sandi memakai crypto bawaan Node (scrypt), tanpa paket tambahan.
// Format tersimpan: scrypt:<salt-hex>:<hash-hex>

const crypto = require('crypto');

function hashKataSandi(teks) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(teks), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function cocokkanKataSandi(teks, tersimpan) {
  if (!tersimpan || typeof tersimpan !== 'string') return false;
  const bagian = tersimpan.split(':');
  if (bagian.length !== 3 || bagian[0] !== 'scrypt') return false;
  const hash = crypto.scryptSync(String(teks), bagian[1], 64);
  const acuan = Buffer.from(bagian[2], 'hex');
  return hash.length === acuan.length && crypto.timingSafeEqual(hash, acuan);
}

module.exports = { hashKataSandi, cocokkanKataSandi };
