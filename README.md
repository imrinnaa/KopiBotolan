# Kopi Botolan — Website Company Profile

Proyek workshop **Full-Stack JavaScript** (JavaScript, Node.js, Express.js & Database).
Website company profile untuk kedai kopi fiktif "Kopi Botolan", lengkap dengan halaman
publik, form kontak, dan panel admin yang dilindungi login.

Perusahaan: **Kopi Botolan** — Jl. Dago Giri No. 27, Bandung. Berdiri 2019,
memanggang biji sendiri dan menerima pesanan kopi untuk kantor.

---

## Cara menjalankan

Syarat: **Node.js 18+**, dan **MySQL/MariaDB berjalan** (misalnya lewat XAMPP).
Database yang dipakai bernama **`company_profile`** — seperti contoh di slide.
Akses database memakai **Prisma ORM** (skema di `prisma/schema.prisma`).

```bash
cd KopiBotolan
npm install
npx prisma generate      # membuat Prisma Client (sekali saja, atau setelah skema berubah)
npx prisma db push       # membuat tabel di database (sekali saja)
npm start                # data contoh otomatis terisi bila masih kosong
```

Lalu buka **http://localhost:3000**

Perintah lain:

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan server |
| `npm run dev` | Menjalankan server, restart otomatis saat kode berubah |
| `npm run prisma:generate` | Membuat ulang Prisma Client |
| `npm run prisma:push` | Menyesuaikan tabel database dengan `schema.prisma` |
| `npm run prisma:studio` | Membuka tampilan data di browser (Prisma Studio) |
| `npm run seed` | Mengisi ulang data contoh layanan |
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
├── prisma/
│   └── schema.prisma    ← skema database (model Layanan, Pesan, Admin, Sesi)
├── database/
│   ├── data-awal.js     ← data contoh + pengisi otomatis
│   └── seed.js          ← npm run seed
├── src/
│   ├── app.js           ← merakit server
│   ├── config/
│   │   ├── env.js       ← pembaca .env
│   │   ├── db.js        ← Prisma Client
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

## Database (Prisma ORM)

Database **MySQL/MariaDB** bernama **`company_profile`**, tabel: `layanan`, `pesan`,
`admin`, `sesi`. Struktur tabel **tidak ditulis sebagai SQL**, melainkan sebagai
skema Prisma di `prisma/schema.prisma`:

```prisma
model Layanan {
  id         Int      @id @default(autoincrement())
  nama       String   @db.VarChar(120)
  deskripsi  String   @db.Text
  ikon       String   @default("kopi") @db.VarChar(40)
  harga      Int?
  aktif      Boolean  @default(true)
  dibuatPada DateTime @default(now()) @map("dibuat_pada")
  diubahPada DateTime @updatedAt @map("diubah_pada")
  @@map("layanan")
}
```

Controller memanggil Prisma Client, contoh:
`prisma.layanan.findMany()`, `prisma.layanan.create({ data: {...} })`,
`prisma.pesan.delete({ where: { id } })`.

Koneksi diatur lewat `DATABASE_URL` di `.env`:

```
DATABASE_URL="mysql://root:@localhost:3306/company_profile"
```

Siapkan sekali saja: `npx prisma db push`. Lihat data:
`npx prisma studio` (buka http://localhost:5555). Bisa juga lewat phpMyAdmin.

## Keamanan

- Akses database lewat **Prisma Client** — nilai dikirim sebagai parameter, bukan disambung ke query.
- Kata sandi admin disimpan sebagai hash `scrypt` dengan `timingSafeEqual`.
- Sesi disimpan di tabel `sesi`, cookie `httpOnly` + `sameSite=lax`, kedaluwarsa 8 jam.
- Kredensial tidak pernah ditulis di kode, HTML, atau respons API.

## Deploy

Proyek siap dipasang di layanan Node.js biasa (Railway, Render, Fly.io, VPS).

1. `npm install`
2. `npx prisma generate` lalu `npx prisma db push`
3. Set environment variable `PORT`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET`,
   dan `DATABASE_URL` di panel penyedia layanan.
4. `npm start`

## Anggota

Rina Anggraeni — XI PPLG 1 — NIS 14740
