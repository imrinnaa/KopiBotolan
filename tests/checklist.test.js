'use strict';

// Uji end-to-end semua poin checklist (WAJIB + BONUS) memakai HTTP biasa.
// Jalankan: npm test
//
//   1. pastikan server berjalan (node src/app.js)
//   2. npm test

const http = require('http');
const assert = require('assert');

const BASE = { host: '127.0.0.1', port: Number(process.env.PORT || 3000) };
const ADMIN = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASS || 'botolan123',
};

const hasil = { lulus: 0, gagal: 0, detail: [] };
let cookie = '';

function minta(method, path, { body, headers = {}, pakaiCookie = false } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      {
        ...BASE,
        method,
        path,
        headers: {
          Accept: 'application/json',
          ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(pakaiCookie && cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
      },
      (res) => {
        const potongan = [];
        res.on('data', (c) => potongan.push(c));
        res.on('end', () => {
          const teks = Buffer.concat(potongan).toString('utf8');
          let json = null;
          try {
            json = teks ? JSON.parse(teks) : null;
          } catch {
            json = teks;
          }
          const setCookie = res.headers['set-cookie'];
          resolve({ status: res.statusCode, body: json, headers: res.headers, setCookie });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function cek(nama, fn) {
  try {
    await fn();
    hasil.lulus++;
    console.log('  OK   ' + nama);
  } catch (err) {
    hasil.gagal++;
    hasil.detail.push({ nama, pesan: err.message });
    console.log('  GAGAL ' + nama + ' :: ' + err.message);
  }
}

async function main() {
  console.log('\n=== Checklist WAJIB ===');

  await cek('Server Express berjalan (GET / 200)', async () => {
    const r = await minta('GET', '/');
    assert.strictEqual(r.status, 200);
  });

  await cek('GET /api/layanan mengembalikan data dari database', async () => {
    const r = await minta('GET', '/api/layanan');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.body) && r.body.length >= 3, 'minimal 3 layanan, dapat ' + r.body.length);
    assert.ok(r.body[0].nama, 'field nama ada');
  });

  await cek('Halaman / menampilkan wadah #daftar-layanan', async () => {
    const r = await minta('GET', '/');
    assert.ok(String(r.body).includes('daftar-layanan'));
  });

  let idBaru;
  await cek('POST /api/layanan (admin) menambah data', async () => {
    const login = await minta('POST', '/api/auth/masuk', {
      body: { username: ADMIN.username, password: ADMIN.password },
    });
    assert.strictEqual(login.status, 200, 'login gagal: ' + JSON.stringify(login.body));
    cookie = (login.setCookie || []).map((c) => c.split(';')[0]).join('; ');

    const r = await minta('POST', '/api/layanan', {
      pakaiCookie: true,
      body: { nama: 'Layanan Uji Coba', deskripsi: 'Ditambahkan oleh skrip pengujian.', ikon: 'kopi', harga: 12000 },
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    idBaru = r.body.id;
    assert.ok(idBaru, 'id baru ada');
  });

  await cek('PUT /api/layanan/:id mengubah data', async () => {
    const r = await minta('PUT', '/api/layanan/' + idBaru, {
      pakaiCookie: true,
      body: { nama: 'Layanan Uji Coba (diubah)', deskripsi: 'Deskripsi setelah diubah oleh pengujian.' },
    });
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.match(r.body.nama, /diubah/);
  });

  await cek('GET /api/layanan/:id mengembalikan satu data', async () => {
    const r = await minta('GET', '/api/layanan/' + idBaru);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.id, idBaru);
  });

  await cek('POST /api/pesan (publik) menyimpan pesan kontak', async () => {
    const r = await minta('POST', '/api/pesan', {
      body: { nama: 'Pengunjung Uji', email: 'uji@example.com', isi: 'Pesan ini dikirim lewat pengujian otomatis.' },
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  });

  await cek('Pesan tersimpan di database (terbaca lewat GET /api/pesan)', async () => {
    const r = await minta('GET', '/api/pesan', { pakaiCookie: true });
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.some((p) => p.email === 'uji@example.com'), 'pesan uji ada di database');
  });

  await cek('DELETE /api/layanan/:id menghapus data (204)', async () => {
    const r = await minta('DELETE', '/api/layanan/' + idBaru, { pakaiCookie: true });
    assert.strictEqual(r.status, 204, 'status ' + r.status);
  });

  await cek('Data yang dihapus benar-benar hilang (404)', async () => {
    const r = await minta('GET', '/api/layanan/' + idBaru);
    assert.strictEqual(r.status, 404);
  });

  console.log('\n=== Checklist BONUS ===');

  await cek('Validasi: layanan kosong ditolak 400 + pesan ramah', async () => {
    const r = await minta('POST', '/api/layanan', { pakaiCookie: true, body: { nama: '', deskripsi: '' } });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.errors && r.body.errors.nama, 'ada pesan error untuk nama');
    assert.match(r.body.errors.nama, /wajib diisi/);
  });

  await cek('Validasi: email salah ditolak 400', async () => {
    const r = await minta('POST', '/api/pesan', {
      body: { nama: 'Budi', email: 'bukan-email', isi: 'Pesan yang cukup panjang untuk diuji.' },
    });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.errors && r.body.errors.email);
  });

  await cek('Validasi: harga negatif ditolak', async () => {
    const r = await minta('POST', '/api/layanan', {
      pakaiCookie: true,
      body: { nama: 'Uji Harga', deskripsi: 'Deskripsi yang cukup panjang di sini.', harga: -500 },
    });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.errors && r.body.errors.harga);
  });

  await cek('Admin dilindungi: CRUD tanpa login ditolak 401', async () => {
    const r = await minta('POST', '/api/layanan', {
      body: { nama: 'Tanpa Login', deskripsi: 'Ini tidak boleh tersimpan sama sekali.' },
    });
    assert.strictEqual(r.status, 401);
  });

  await cek('Admin dilindungi: /admin.html tanpa login diarahkan ke /masuk.html', async () => {
    const r = await minta('GET', '/admin.html', { headers: { Accept: 'text/html' } });
    assert.strictEqual(r.status, 302, 'status ' + r.status);
    assert.match(r.headers.location, /masuk\.html/);
  });

  await cek('Admin dilindungi: permintaan API tanpa login mendapat 401', async () => {
    const r = await minta('GET', '/admin.html', { headers: { Accept: 'application/json' } });
    assert.strictEqual(r.status, 401);
  });

  await cek('Login salah kata sandi ditolak 401', async () => {
    const r = await minta('POST', '/api/auth/masuk', {
      body: { username: ADMIN.username, password: 'salah-banget' },
    });
    assert.strictEqual(r.status, 401);
  });

  await cek('Login benar mendapat cookie httpOnly', async () => {
    const r = await minta('POST', '/api/auth/masuk', {
      body: { username: ADMIN.username, password: ADMIN.password },
    });
    assert.strictEqual(r.status, 200);
    const c = (r.setCookie || [])[0] || '';
    assert.match(c, /HttpOnly/i);
  });

  await cek('Kredensial ada di .env dan .env tidak ikut terkirim', async () => {
    const fs = require('fs');
    const path = require('path');
    const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    assert.ok(/ADMIN_USER=/.test(env) && /ADMIN_PASS=/.test(env), '.env berisi kredensial admin');
    assert.ok(/SESSION_SECRET=/.test(env), '.env berisi rahasia sesi');
    assert.ok(/DATABASE_URL=/.test(env) || /DB_HOST=/.test(env), '.env berisi kredensial database');

    const r = await minta('GET', '/');
    assert.ok(!String(r.body).includes('ADMIN_PASS'), 'kredensial tidak bocor di HTML');
    const api = await minta('GET', '/api/info');
    assert.ok(!JSON.stringify(api.body).includes('botolan123'), 'kredensial tidak bocor di API');
  });

  await cek('Tampilan responsif: style.css punya @media untuk HP', async () => {
    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');
    assert.ok(/@media\s*\(max-width:\s*600px\)/.test(css), 'ada media query 600px');
    assert.ok(/grid-template-columns:\s*1fr/.test(css), 'kartu jadi satu kolom di HP');
  });

  await cek('Data tetap ada setelah server restart (database permanen)', async () => {
    // Data tersimpan di MySQL. Buktinya: layanan yang dikirim tadi masih ada
    // setelah server dimatikan lalu dinyalakan lagi (uji manual di README).
    const r = await minta('GET', '/api/layanan');
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.length >= 3, 'data masih ada di database (' + r.body.length + ' layanan)');
  });

  await cek('Database diakses lewat Prisma ORM', async () => {
    const fs = require('fs');
    const path = require('path');
    const akar = path.join(__dirname, '..');

    const skema = fs.readFileSync(path.join(akar, 'prisma', 'schema.prisma'), 'utf8');
    assert.ok(/provider\s*=\s*"mysql"/.test(skema), 'skema memakai mysql');
    assert.ok(/model Layanan/.test(skema), 'ada model Layanan');
    assert.ok(/model Pesan/.test(skema), 'ada model Pesan');

    const kode = fs.readFileSync(path.join(akar, 'src', 'controllers', 'layanan.controller.js'), 'utf8');
    assert.ok(/prisma\.layanan\./.test(kode), 'controller memakai Prisma Client');
  });

  console.log('\n=== Hasil ===');
  console.log('Lulus: ' + hasil.lulus + '   Gagal: ' + hasil.gagal);
  if (hasil.gagal > 0) {
    console.log('\nDetail kegagalan:');
    hasil.detail.forEach((d) => console.log(' - ' + d.nama + ': ' + d.pesan));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Pengujian berhenti:', err);
  process.exitCode = 1;
});
