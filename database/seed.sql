-- Data awal tabel layanan (3-5 contoh, sesuai slide Hari 1)
-- Terpisah dari schema.sql agar seed bisa dijalankan ulang: npm run seed

DELETE FROM layanan;

INSERT INTO layanan (nama, deskripsi, ikon, harga) VALUES
  ('Espresso Tanpa Buru-buru',
   'Satu shot espresso dari biji robusta Gayo yang disangrai sendiri. Diseduh 27 detik, bukan sekadar penaik semangat.',
   'espresso', 18000),
  ('Kopi Botolan Signature',
   'Kopi susu aren dengan dua lapis seduhan: tubruk hitam dan susu segar. Ini rumah minum kami yang sesungguhnya.',
   'botolan', 22000),
  ('Cold Brew 12 Jam',
   'Disiapkan semalaman dalam suhu ruang, disajikan dingin tanpa es berlebihan. Pelan, tapi tahan lama.',
   'coldbrew', 26000),
  ('Kelas Cupping & Roasting',
   'Belajar membedakan_notes aroma dan memanggang biji untuk usaha kopi sendiri. Dua jam, bawa pulang 100 gram.',
   'kelas', 150000),
  ('Kopi Kurir Kantor',
   'Pesan untuk satu ruangan. Lima cup atau lebih dikirim ke kantor, lengkap dengan gula terpisah dan catatan nama.',
   'kurir', 95000);

-- Data contoh pesan dari pengunjung (agar halaman admin langsung punya isi)
DELETE FROM pesan;
INSERT INTO pesan (nama, email, telepon, isi, sudah_dibaca) VALUES
  ('Sinta', 'sinta@example.com', '081200001111',
   'Halo, saya mau tanya apakah Kopi Botolan menerima pesanan untuk acara kantor? Kira-kira minimal pesan berapa cup?', 0),
  ('Bayu', 'bayu@example.com', '081200002222',
   'Kelas roastingnya kapan jadwal berikutnya? Saya daftar satu orang.', 0);
