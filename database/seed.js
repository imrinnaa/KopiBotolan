'use strict';

// Isi database dengan data contoh: npm run seed
//   node database/seed.js          -> isi bila tabel layanan masih kosong
//   node database/seed.js --reset  -> hapus lalu isi ulang

require('../src/config/env'); // mengisi process.env dari .env sebelum Prisma membacanya
const prisma = require('../src/config/db');
const { isiDataAwal } = require('./data-awal');

const reset = process.argv.includes('--reset');

async function main() {
  const jumlah = await prisma.layanan.count();

  if (jumlah > 0 && !reset) {
    console.log(`Tabel layanan sudah berisi ${jumlah} data. Pakai --reset untuk mengisi ulang.`);
    return;
  }

  await isiDataAwal(prisma);

  const layanan = await prisma.layanan.findMany({ orderBy: { id: 'asc' } });
  console.log(`Selesai. ${layanan.length} layanan tersimpan:`);
  for (const item of layanan) console.log(`  ${item.id}. ${item.nama}`);

  const pesan = await prisma.pesan.count();
  console.log(`Pesan contoh: ${pesan}`);
}

main()
  .catch((err) => {
    console.error('Gagal mengisi database:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
