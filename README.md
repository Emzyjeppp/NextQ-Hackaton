# Q-Smart (Antrean Cerdas) 🚀

Q-Smart adalah sistem antrean digital modern berbasis web yang dirancang untuk memberikan pengalaman antre yang lebih baik, tanpa stres, dan penuh kepastian bagi pasien maupun pelanggan.

Aplikasi ini berjalan **100% di sisi klien (browser)** tanpa memerlukan server backend. Seluruh data disimpan secara lokal menggunakan `localStorage` dan disinkronisasikan antar-tab secara *realtime* memanfaatkan **BroadcastChannel API**.

---

## ✨ Fitur Utama

### 📱 Tampilan Pasien / Pengguna
- **Antarmuka Mobile-First:** Desain responsif yang mudah digunakan di perangkat seluler.
- **Pengambilan Tiket Realtime:** Pasien dapat mengambil tiket antrean dengan sekali klik.
- **Estimasi Waktu Dinamis:** Sistem menghitung sisa waktu tunggu berdasarkan rata-rata pelayanan aktual secara cerdas.
- **Notifikasi Panggilan:** Peringatan visual yang berdenyut saat giliran tiba.

### 👨‍💼 Panel Operator (Admin)
- **Manajemen Loket:** Memilih loket operasional (Poli Umum, Poli Gigi, Apotek).
- **Statistik Cerdas:** Memantau jumlah antrean, tiket selesai, dan rata-rata durasi pelayanan secara langsung.
- **Kendali Antrean:** Tombol aksi lengkap (Panggil Berikutnya, Tandai Hadir, Selesaikan, atau Lewati).
- **Grace Period Countdown:** Timer hitung mundur 3 menit untuk pasien yang dipanggil namun belum hadir.

### 📺 Display TV (Ruang Tunggu)
- **Tampilan Interaktif:** Menampilkan tiket yang sedang dipanggil dengan animasi menonjol.
- **Daftar Antrean:** Menampilkan grid status loket dan daftar nomor urut berikutnya.
- **Sistem Pengumuman Suara:** Dilengkapi dengan bunyi *chime* (Ding-Dong) dan **Text-to-Speech bahasa Indonesia** otomatis saat tiket dipanggil.

---

## 🚀 Cara Menjalankan Aplikasi (Lokal)

Karena aplikasi ini sepenuhnya berbasis HTML statis, Anda dapat menjalankannya dengan sangat mudah:

1. Clone repositori ini ke komputer Anda.
2. Gunakan Live Server (ekstensi VS Code) atau jalankan local server bawaan Python:
   ```bash
   python -m http.server 8000
   ```
3. Buka URL berikut di browser Anda:
   - **Halaman Pasien:** `http://localhost:8000/`
   - **Panel Admin:** `http://localhost:8000/admin.html`
   - **Display TV:** `http://localhost:8000/display.html`

> **Tips Simulasi:** Buka ketiga halaman di atas pada tab browser yang sama. Cobalah untuk mengambil tiket di halaman Pasien, lalu tekan 'Panggil' di halaman Admin, dan perhatikan bagaimana Display TV langsung berbunyi dan tersinkronisasi seketika!

---

## 🌐 Live Demo

Cobalah langsung tanpa perlu instalasi!
👉 [**Demo Q-Smart di Netlify**](https://nextq-hackaton.netlify.app/)

*(Ingat: untuk melihat efek sinkronisasi realtime, pastikan Anda membuka halaman Pasien, Admin, dan Display TV pada tab-tab di satu aplikasi browser yang sama).*

---
Dibuat dengan ❤️ untuk layanan publik yang lebih baik.
