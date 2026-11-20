/* ============================================================
   app.js — JavaScript sisi browser (slide 36-39)
   - fetch() GET /api/layanan  -> kartu layanan
   - POST /api/pesan            -> form kontak
   - POST/PUT/DELETE /api/layanan -> halaman admin
   ============================================================ */

'use strict';

const IKON = {
  espresso: '☕',
  botolan: '🥛',
  coldbrew: '🧊',
  kelas: '🎓',
  kurir: '📦',
  kopi: '☕'
};

function rupiah(nilai) {
  if (nilai === null || nilai === undefined) return '';
  return 'Rp ' + Number(nilai).toLocaleString('id-ID');
}

function escapeHtml(teks) {
  return String(teks)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ------------------------------------------------------------
// Halaman Beranda: daftar layanan
// ------------------------------------------------------------
async function muatLayanan() {
  const wadah = document.querySelector('#daftar-layanan');
  if (!wadah) return;

  try {
    const res = await fetch('/api/layanan?aktif=1', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const layanan = await res.json();

    if (!layanan.length) {
      wadah.innerHTML = '<div class="status-kosong">Belum ada layanan yang diunggah admin.</div>';
      return;
    }

    wadah.innerHTML = layanan
      .map((item) => {
        const ikon = IKON[item.ikon] || IKON.kopi;
        const harga = item.harga ? `<div class="harga">${rupiah(item.harga)}</div>` : '';
        return `
          <article class="kartu">
            <div class="ik">${ikon}</div>
            <h3>${escapeHtml(item.nama)}</h3>
            <p>${escapeHtml(item.deskripsi)}</p>
            ${harga}
            <div class="meta">ID layanan #${item.id}</div>
          </article>`;
      })
      .join('');
  } catch (err) {
    wadah.innerHTML =
      '<div class="status-kosong">Daftar layanan belum bisa dimuat. Pastikan server sudah berjalan (npm start).</div>';
    console.error('Gagal memuat layanan:', err);
  }
}

// ------------------------------------------------------------
// Form kontak: POST /api/pesan
// ------------------------------------------------------------
function pasangFormKontak() {
  const form = document.querySelector('#form-kontak');
  if (!form) return;

  const notif = document.querySelector('#notif-kontak');
  const statusKirim = document.querySelector('#status-kirim');
  const tombol = document.querySelector('#tombol-kirim');

  function tampilkanError(errors) {
    form.querySelectorAll('.pesan-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('tampil');
    });
    for (const [field, pesan] of Object.entries(errors || {})) {
      const el = form.querySelector(`.pesan-error[data-untuk="${field}"]`);
      if (el) {
        el.textContent = pesan;
        el.classList.add('tampil');
      }
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // jangan reload halaman (slide 38)
    tampilkanError({});
    notif.className = 'notif';
    statusKirim.textContent = '';

    const data = Object.fromEntries(new FormData(form));

    tombol.disabled = true;
    statusKirim.textContent = 'Mengirim…';

    try {
      const res = await fetch('/api/pesan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const hasil = await res.json().catch(() => ({}));

      if (!res.ok) {
        tampilkanError(hasil.errors);
        notif.className = 'notif gagal';
        notif.textContent = hasil.pesan || 'Pesan belum terkirim. Coba lagi.';
        return;
      }

      notif.className = 'notif sukses';
      notif.textContent = hasil.pesan || 'Terima kasih, pesan Anda sudah terkirim!';
      form.reset();
    } catch (err) {
      notif.className = 'notif gagal';
      notif.textContent = 'Tidak bisa terhubung ke server. Periksa koneksi Anda.';
      console.error('Gagal mengirim pesan:', err);
    } finally {
      tombol.disabled = false;
      statusKirim.textContent = '';
    }
  });
}

// ------------------------------------------------------------
// Halaman admin
// ------------------------------------------------------------
async function muatDaftarAdmin() {
  const wadah = document.querySelector('#admin-layanan');
  if (!wadah) return;

  const res = await fetch('/api/layanan?aktif=semua');
  const layanan = res.ok ? await res.json() : [];

  document.querySelector('#hitung-layanan').textContent = layanan.length;

  if (!layanan.length) {
    wadah.innerHTML =
      '<tr><td colspan="5"><div class="status-kosong">Belum ada layanan. Tambahkan lewat formulir di atas.</div></td></tr>';
    return;
  }

  wadah.innerHTML = layanan
    .map((item) => {
      const harga = item.harga ? rupiah(item.harga) : '—';
      const status = item.aktif
        ? '<span class="sudah">Aktif</span>'
        : '<span class="masih-baru">Nonaktif</span>';
      return `
        <tr data-id="${item.id}">
          <td data-label="ID">${item.id}</td>
          <td data-label="Nama"><strong>${escapeHtml(item.nama)}</strong><br>
              <span class="meta">${escapeHtml(item.deskripsi)}</span></td>
          <td data-label="Harga">${harga}</td>
          <td data-label="Status">${status}</td>
          <td data-label="Aksi">
            <div class="aksi">
              <button class="tombol tombol-kecil" data-aksi="ubah" data-id="${item.id}">Ubah</button>
              <button class="tombol tombol-kecil tombol-merah" data-aksi="hapus" data-id="${item.id}">Hapus</button>
            </div>
          </td>
        </tr>`;
    })
    .join('');
}

function pasangAdmin() {
  if (!document.querySelector('#form-layanan')) return;

  const form = document.querySelector('#form-layanan');
  const notif = document.querySelector('#notif-admin');
  const judulForm = document.querySelector('#judul-form-layanan');
  const tombolSimpan = document.querySelector('#tombol-simpan');
  let idUbah = null;

  function notifTeks(teks, jenis) {
    notif.className = 'notif ' + jenis;
    notif.textContent = teks;
  }

  function resetForm() {
    idUbah = null;
    form.reset();
    judulForm.textContent = 'Tambah Layanan Baru';
    tombolSimpan.textContent = 'Simpan Layanan';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      nama: form.nama.value.trim(),
      deskripsi: form.deskripsi.value.trim(),
      ikon: form.ikon.value.trim() || 'kopi',
      harga: form.harga.value === '' ? null : Number(form.harga.value)
    };

    const url = idUbah ? `/api/layanan/${idUbah}` : '/api/layanan';
    const method = idUbah ? 'PUT' : 'POST';
    tombolSimpan.disabled = true;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const hasil = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifTeks(
          hasil.pesan || 'Gagal menyimpan layanan.',
          'gagal'
        );
        return;
      }

      notifTeks(
        idUbah ? 'Layanan berhasil diubah.' : 'Layanan baru berhasil ditambahkan.',
        'sukses'
      );
      resetForm();
      await muatDaftarAdmin();
    } catch (err) {
      notifTeks('Tidak bisa terhubung ke server.', 'gagal');
    } finally {
      tombolSimpan.disabled = false;
    }
  });

  document.querySelector('#admin-layanan').addEventListener('click', async (e) => {
    const tombol = e.target.closest('button[data-aksi]');
    if (!tombol) return;

    const id = tombol.dataset.id;
    const tr = tombol.closest('tr');

    if (tombol.dataset.aksi === 'hapus') {
      const nama = tr.querySelector('td[data-label="Nama"] strong')?.textContent || '';
      if (!confirm(`Yakin hapus layanan "${nama}"?`)) return;

      const res = await fetch(`/api/layanan/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        notifTeks('Layanan dihapus.', 'sukses');
        await muatDaftarAdmin();
      } else {
        const hasil = await res.json().catch(() => ({}));
        notifTeks(hasil.pesan || 'Gagal menghapus.', 'gagal');
      }
      return;
    }

    if (tombol.dataset.aksi === 'ubah') {
      const baris = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent);
      idUbah = id;
      form.nama.value = tr.querySelector('td[data-label="Nama"] strong').textContent;
      form.deskripsi.value = tr
        .querySelector('td[data-label="Nama"] .meta')
        .textContent;
      const teksHarga = tr.querySelector('td[data-label="Harga"]').textContent;
      form.harga.value = teksHarga === '—' ? '' : teksHarga.replace(/[^0-9]/g, '');
      form.ikon.value = 'kopi';
      judulForm.textContent = `Ubah Layanan #${id}`;
      tombolSimpan.textContent = 'Simpan Perubahan';
      form.nama.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  document.querySelector('#tombol-batal')?.addEventListener('click', resetForm);
}

// ------------------------------------------------------------
// Pesan masuk (bagian admin)
// ------------------------------------------------------------
async function muatPesan() {
  const wadah = document.querySelector('#daftar-pesan');
  if (!wadah) return;

  const res = await fetch('/api/pesan');
  const pesan = res.ok ? await res.json() : [];

  document.querySelector('#hitung-pesan').textContent = pesan.length;
  document.querySelector('#hitung-belum').textContent =
    pesan.filter((p) => !p.sudah_dibaca).length;

  if (!pesan.length) {
    wadah.innerHTML =
      '<tr><td colspan="5"><div class="status-kosong">Belum ada pesan masuk.</div></td></tr>';
    return;
  }

  wadah.innerHTML = pesan
    .map(
      (p) => `
      <tr data-id="${p.id}">
        <td data-label="ID">${p.id}</td>
        <td data-label="Pengirim"><strong>${escapeHtml(p.nama)}</strong><br>
            <span class="meta">${escapeHtml(p.email)}${p.telepon ? ' · ' + escapeHtml(p.telepon) : ''}</span></td>
        <td data-label="Pesan">${escapeHtml(p.isi)}</td>
        <td data-label="Waktu">${escapeHtml(p.dibuat_pada || '-')}</td>
        <td data-label="Status">
          ${p.sudah_dibaca
            ? '<span class="sudah">Sudah dibaca</span>'
            : '<button class="tombol tombol-kecil" data-aksi="baca" data-id="' + p.id + '">Tandai dibaca</button>'}
        </td>
      </tr>`
    )
    .join('');
}

// ------------------------------------------------------------
// Halaman masuk
// ------------------------------------------------------------
function pasangMasuk() {
  const form = document.querySelector('#form-masuk');
  if (!form) return;

  const notif = document.querySelector('#notif-masuk');
  const alasan = new URLSearchParams(location.search).get('alasan');

  if (alasan === 'belum-masuk') {
    notif.className = 'notif gagal';
    notif.textContent = 'Silakan masuk terlebih dahulu untuk membuka halaman admin.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    notif.className = 'notif';
    const tombol = document.querySelector('#tombol-masuk');
    tombol.disabled = true;

    try {
      const res = await fetch('/api/auth/masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value.trim(),
          password: form.password.value
        })
      });
      const hasil = await res.json().catch(() => ({}));
      if (!res.ok) {
        notif.className = 'notif gagal';
        notif.textContent = hasil.pesan || 'Gagal masuk.';
        return;
      }
      location.href = '/admin.html';
    } catch (err) {
      notif.className = 'notif gagal';
      notif.textContent = 'Tidak bisa terhubung ke server.';
    } finally {
      tombol.disabled = false;
    }
  });
}

function pasangKeluar() {
  const tombol = document.querySelector('#tombol-keluar');
  if (!tombol) return;
  tombol.addEventListener('click', async () => {
    await fetch('/api/auth/keluar', { method: 'POST' });
    location.href = '/masuk.html';
  });
}

// ------------------------------------------------------------
// Muat sesuai halaman
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  muatLayanan();
  pasangFormKontak();
  pasangAdmin();
  muatDaftarAdmin();
  muatPesan();
  pasangMasuk();
  pasangKeluar();
});
