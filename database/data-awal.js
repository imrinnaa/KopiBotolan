'use strict';

// Data contoh untuk tabel layanan dan pesan.
// Dipakai oleh database/seed.js dan pengisian otomatis saat server pertama hidup.

const LAYANAN_AWAL = [
  {
    nama: 'Espresso Tanpa Buru-buru',
    deskripsi:
      'Satu shot espresso dari biji robusta Gayo yang disangrai sendiri. Diseduh 27 detik, bukan sekadar penaik semangat.',
    ikon: 'espresso',
    harga: 18000,
  },
  {
    nama: 'Kopi Botolan Signature',
    deskripsi:
      'Kopi susu aren dengan dua lapis seduhan: tubruk hitam dan susu segar. Ini rumah minum kami yang sesungguhnya.',
    ikon: 'botolan',
    harga: 22000,
  },
  {
    nama: 'Cold Brew 12 Jam',
    deskripsi:
      'Disiapkan semalaman dalam suhu ruang, disajikan dingin tanpa es berlebihan. Pelan, tapi tahan lama.',
    ikon: 'coldbrew',
    harga: 26000,
  },
  {
    nama: 'Kelas Cupping & Roasting',
    deskripsi:
      'Belajar membedakan aroma dan memanggang biji untuk usaha kopi sendiri. Dua jam, bawa pulang 100 gram.',
    ikon: 'kelas',
    harga: 150000,
  },
  {
    nama: 'Kopi Kurir Kantor',
    deskripsi:
      'Pesan untuk satu ruangan. Lima cup atau lebih dikirim ke kantor, lengkap dengan gula terpisah dan catatan nama.',
    ikon: 'kurir',
    harga: 95000,
  },
];

const PESAN_AWAL = [
  {
    nama: 'Sinta',
    email: 'sinta@example.com',
    telepon: '081200001111',
    isi: 'Halo, saya mau tanya apakah Kopi Botolan menerima pesanan untuk acara kantor? Kira-kira minimal pesan berapa cup?',
  },
  {
    nama: 'Bayu',
    email: 'bayu@example.com',
    telepon: '081200002222',
    isi: 'Kelas roastingnya kapan jadwal berikutnya? Saya daftar satu orang.',
  },
];

// Mengosongkan lalu mengisi ulang tabel. Dipanggil dari seed.js dan app.js.
async function isiDataAwal(prisma, { pesan = true } = {}) {
  await prisma.layanan.deleteMany();
  for (const item of LAYANAN_AWAL) {
    await prisma.layanan.create({ data: item });
  }
  if (pesan) {
    await prisma.pesan.deleteMany();
    for (const item of PESAN_AWAL) {
      await prisma.pesan.create({ data: item });
    }
  }
}

module.exports = { LAYANAN_AWAL, PESAN_AWAL, isiDataAwal };
