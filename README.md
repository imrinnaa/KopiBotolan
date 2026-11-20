# Kopi Botolan — Website Company Profile

Proyek workshop **Full-Stack JavaScript** (JavaScript, Node.js, Express.js & Database).
Website company profile untuk kedai kopi fiktif "Kopi Botolan", lengkap dengan halaman
publik, form kontak, dan panel admin yang dilindungi login.

Perusahaan: **Kopi Botolan** — Jl. Dago Giri No. 27, Bandung. Berdiri 2019,
memanggang biji sendiri dan menerima pesanan kopi untuk kantor.

---

## Cara menjalankan

Syarat: **Node.js 20+** sudah terpasang.

```bash
cd KopiBotolan
npm install
npm start
```

Lalu buka **http://localhost:3000**

Perintah lain:

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan server |
| `npm run dev` | Menjalankan server, restart otomatis saat kode berubah |
| `npm run seed` | Mengisi data contoh layanan (dijalankan otomatis saat server pertama hidup) |
| `npm run reset` | Mengosongkan lalu mengisi ulang data contoh |
| `npm test` | Menjalankan 22 pengujian checklist (server harus sedang berjalan) |

### Kredensial admin

Kredensial disimpan di file `.env` (tidak ikut di-commit):

```
ADMIN_USER=admin
ADMIN_PASS=botolan123
```

Halaman admin: **http://localhost:3000/admin.html**

> Ganti `ADMIN_PASS` sebelum dipakai sungguhan. Kata sandi disimpan sebagai
> hash `scrypt`, bukan teks asli.

---

## Halaman

| Halaman | Alamat | Sumber data |
| --- | --- | --- |
| Beranda | `/` | Statis (HTML) |
| Tentang Kami | `/#tentang` | Statis (HTML) |
| Layanan | `/#layanan` | Database · `GET /api/layanan` |
| Kontak | `/#kontak` | Database · `POST /api/pesan` |
| Masuk | `/masuk.html` | Statis |
| Admin | `/admin.html` | Database · CRUD + pesan masuk |

## API

| Method | Endpoint | Fungsi | Akses |
| --- | --- | --- | --- |
| GET | `/api/layanan` | Semua layanan aktif | publik |
| GET | `/api/layanan?aktif=semua` | Semua layanan, termasuk nonaktif | publik |
| GET | `/api/layanan/:id` | Satu layanan | publik |
| POST | `/api/layanan` | Tambah layanan | admin |
| PUT | `/api/layanan/:id` | Ubah layanan | admin |
| DELETE | `/api/layanan/:id` | Hapus layanan | admin |
| POST | `/api/pesan` | Kirim pesan kontak | publik |
| GET | `/api/pesan` | Daftar pesan masuk | admin |
| PATCH | `/api/pesan/:id/dibaca` | Tandai sudah dibaca | admin |
| POST | `/api/auth/masuk` | Masuk | publik |
| POST | `/api/auth/keluar` | Keluar | publik |
| GET | `/api/auth/saya` | Info sesi | publik |
| GET | `/api/info` | Info aplikasi | publik |

Contoh uji cepat dengan curl:

```bash
# Tambah layanan (harus login dulu)
curl -c kue.txt -X POST http://localhost:3000/api/auth/masuk \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"botolan123"}'

curl -b kue.txt -X POST http://localhost:3000/api/layanan \
  -H "Content-Type: application/json" \
  -d '{"nama":"Americano","deskripsi":"Espresso dengan air panas, ringan di perut.","harga":20000}'

# Kirim pesan kontak
curl -X POST http://localhost:3000/api/pesan \
  -H "Content-Type: application/json" \
  -d '{"nama":"Budi","email":"budi@example.com","isi":"Apakah ada menu vegan?"}'
```

## Struktur folder

```
KopiBotolan/
├── package.json
├── .env                 ← kredensial lokal (tidak di-commit)
├── .env.example         ← contoh kredensial
├── .gitignore
├── database/
│   ├── schema.sql       ← tabel layanan, pesan, admin, sesi
│   ├── seed.sql         ← data contoh
│   └── seed.js          ← pemangkas data contoh
├── src/
│   ├── app.js           ← merakit server
│   ├── config/
│   │   ├── env.js       ← pembaca .env
│   │   ├── db.js        ← koneksi database (SQLite / MySQL)
│   │   └── kata-sandi.js← hash scrypt
│   ├── middleware/
│   │   ├── validasi.js  ← validasi input + pesan error
│   │   ├── auth.js      ← sesi + cookie login
│   │   └── logger.js    ← pencatat permintaan
│   ├── routes/          ← layanan, pesan, auth
│   └── controllers/     ← logika setiap rute
├── public/
│   ├── index.html       ← Beranda + Tentang + Layanan + Kontak
│   ├── admin.html       ← kelola layanan + baca pesan
│   ├── masuk.html       ← halaman login
│   ├── 404.html
│   ├── style.css        ← responsif (3 kolom → 1 kolom di HP)
│   └── app.js           ← fetch() ke API
└── tests/
    └── checklist.test.js
```

## Peta checklist

### WAJIB

| Checklist | Di mana |
| --- | --- |
| Server Express berjalan tanpa error | `src/app.js`, `npm start` |
| Endpoint CRUD layanan + POST pesan berfungsi | `src/routes/`, `src/controllers/` |
| Halaman Layanan tampil dari database | `public/app.js` → `muatLayanan()` |
| Pesan form kontak tersimpan di database | `POST /api/pesan` |
| Admin bisa tambah, ubah, hapus layanan | `public/admin.html` |
| Kode tersimpan rapi | struktur folder di atas |

### BONUS

| Checklist | Di mana |
| --- | --- |
| Validasi input + pesan error ramah | `src/middleware/validasi.js` |
| Halaman admin dilindungi login | `src/middleware/auth.js` |
| Tampilan rapi di layar HP | `public/style.css` (`@media max-width: 600px`) |
| Kredensial database di `.env` | `.env`, `src/config/env.js` |
| Bisa di-deploy online | lihat bagian Deploy di bawah |

## Database

Bawaan memakai **SQLite** lewat `better-sqlite3`, file di `data/kopi-botolan.sqlite`.
Tidak perlu memasang MySQL. Tabel dibuat otomatis saat server pertama dijalankan.

Bila mau memakai **MySQL**, ubah `.env`:

```
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=rahasiaanda
DB_NAME=company_profile
```

lalu buat tabelnya dengan `database/schema.sql` (skema memakai `AUTO_INCREMENT` untuk
MySQL; jalankan `npm run seed --reset` bila perlu).

## Keamanan

- Query selalu memakai placeholder `?`, bukan sambungan string.
- Kata sandi admin disimpan sebagai hash `scrypt` dengan `timingSafeEqual`.
- Sesi disimpan di tabel `sesi`, cookie `httpOnly` + `sameSite=lax`, kedaluwarsa 8 jam.
- Kredensial tidak pernah ditulis di kode, HTML, atau respons API.

## Deploy

Proyek siap dipasang di layanan Node.js biasa (Railway, Render, Fly.io, VPS).

1. `npm install`
2. Set environment variable `PORT`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET`,
   dan `DB_DRIVER` + kredensial database di panel penyedia layanan.
3. `npm start`

Untuk SQLite di hosting, pastikan folder `data/` bisa ditulis; bila hosting bersifat
sementara (ephemeral), sebaiknya pakai `DB_DRIVER=mysql`.

## Anggota

Rina Anggraeni — XI PPLG 1 — NIS 14740
