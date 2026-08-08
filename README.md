# QSmart NextQ — Sistem Antrean Digital

> Submission **NextQ Hackathon 2026** · Demo Realtime Antrean Loket dengan Panel Admin & Display TV.

QSmart NextQ adalah sistem antrean digital berbasis web yang berjalan **tanpa server (client-side only)** — data disimpan di `localStorage` dan disinkronkan antar-tab/browser secara realtime memakai **BroadcastChannel API**. Cocok untuk demo live: buka *Admin* dan *Display TV* di dua tab/dua layar, lalu panggil tiket — semua update muncul seketika.

---

## 🚀 Fitur

### Panel Admin (`admin.html`)
- Pilih loket aktif (`selectCounter`)
- 4 kartu statistik realtime: **Menunggu / Dipanggil / Selesai / Rata-rata Durasi**
- Panel tiket aktif per loket (`activeTicketCode`) + **grace countdown** batas waktu hadir (`graceCountdownText`)
- 4 tombol aksi: **Panggil Berikutnya** (`btnCallNext`), **Hadir/Layani** (`btnServe`), **Selesaikan** (`btnFinish`), **Lewati** (`btnSkip`)
- Tabel antrean (`queueTableBody`) dengan **filter status** (Semua / Waiting / Called / Done) dan tombol **Lewati** per baris

### Display TV (`display.html`)
- Jam realtime WIB (`liveClock`) + tanggal
- Hero nomor raksasa (`heroTicketCode`) + kotak loket (`heroCounterBox`) dengan animasi saat tiket baru dipanggil
- Grid status seluruh loket (`countersGrid`): Siaga / Dipanggil / Dilayani
- Daftar antrean berikutnya (`nextTicketsList`)
- Marquee pengumuman berjalan di bawah
- **Suara**: chime "ding-dong" (Web Audio API) + pengumuman **Text-to-Speech bahasa Indonesia** saat tiket dipanggil — aktifkan via tombol `btnEnableSound`

### Engine (`js/engine.js`)
- 3 layanan default: Poli Umum (A), Poli Gigi (B), Apotek (C) + 3 loket
- Alur status: `waiting → called → serving → done` (atau `expired` setelah 2× dilewati)
- `BroadcastChannel` untuk sinkronisasi realtime antar tab
- Demo data 15 tiket siap-pakai, tombol **Reset Demo** di admin

---

## ▶️ Cara Menjalankan (Lokal)

Cukup buka file langsung atau jalankan server statis:

```bash
# opsi 1: langsung buka admin.html di browser
# opsi 2: python -m http.server 8000
python -m http.server 8000
```

Lalu buka:
- `http://localhost:8000/admin.html` — panel admin (kontrol loket)
- `http://localhost:8000/display.html` — display TV (monitor antrean)

> Untuk demo paling baik: buka **Admin** di satu layar/monitor dan **Display TV** di layar TV (atau 2 tab). Klik **Panggil Berikutnya** → display berbunyi "ding-dong" + pengumuman suara dan nomor tampil raksasa.

---

## ☁️ Deployment (Vercel / Netlify)

Proyek ini **100% statis** — tidak butuh build step.

### Vercel
1. Push repo ke GitHub (repo sudah public).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo `NextQ-Hackaton`.
3. Framework Preset: **Other** (atau biarkan otomatis).
4. Build Command & Output: **kosong / default** (root directory).
5. Deploy → dapat URL `https://nextq-hackaton.vercel.app`.

### Netlify
1. Buka [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
2. Pilih repo GitHub → **Deploy site** (publish directory default `/`).
3. Dapat URL `https://nextq-hackaton.netlify.app`.

> Catatan demo: karena memakai `localStorage` + `BroadcastChannel`, realtime hanya bekerja **dalam satu browser yang sama** (buka 2 tab). Untuk demo ke juri, buka admin dan display dari browser yang sama.

---

## 🗂 Struktur

```
├── index.html        (placeholder / landing)
├── admin.html        (panel admin)
├── display.html      (display TV)
├── css/style.css     (scrollbar, marquee, animasi)
└── js/
    ├── engine.js     (QSmartEngine: data, logika antrean, broadcast)
    ├── admin.js      (controller admin)
    └── display.js    (controller display + audio)
```

---

## ✅ Checklist Verifikasi Demo

- [ ] `admin.html` → pilih loket, panggil tiket, tampil di panel aktif + grace countdown berjalan
- [ ] Statistik Waiting/Called/Done/Avg-Duration ter-update realtime
- [ ] Tabel antrean filter Semua/Waiting/Called/Done + skip per baris
- [ ] `display.html` → nomor raksasa tampil + flash saat tiket dipanggil
- [ ] Grid loket berubah Siaga → Dipanggil → Dilayani
- [ ] Klik **Aktifkan Suara** → chime "ding-dong" + TTS bahasa Indonesia
- [ ] Jam WIB realtime & marquee berjalan
- [ ] GitHub repo **public**, README rapi, Google Form submission < 16:00 WIB
- [ ] Latihan pitching 2 menit (skrip: `03_NASKAH_PITCHING_DAN_LIVE_DEMO.md`)

---

## 🎤 Tips Pitching (20%)

1. **Hook (15 detik)**: buka display TV → tunjukkan antrean hidup + angka raksasa.
2. **Masalah**: antrean fisik tidak terstruktur, tidak ada estimasi waktu, pengumuman tidak terdengar.
3. **Solusi**: 2 menit demo live — panggil tiket dari admin, tunjukkan suara TTS, statistik, dan estimasi.
4. **Penutup**: QSmart NextQ mudah dipasang (tanpa server), siap diskalakan dengan backend real (WebSocket + DB) setelah demo.

---

Dibuat dengan ❤️ untuk **NextQ Hackathon 2026**.
