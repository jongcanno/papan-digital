# Sinkronisasi Lintas Perangkat (Multi-Device Realtime Sync) — Gawang Mini Jong Cano

Pembaruan arsitektur papan skor digital **GAWANG MINI JONG CANO** agar dapat berjalan secara real-time di berbagai perangkat fisik yang berbeda (misalnya: Layar Utama di Laptop/Smart TV/Proyektor dan Remote Kontrol di HP/Smartphone atau Tablet operator) tanpa memerlukan login akun.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Terkonfirmasi dari Tanya Jawab:**
> - **Metode Penghubung Perangkat:** Menggunakan **QR Code Otomatis di Layar** serta **Kode Room 6 Karakter** (contoh: `JONG26`) yang mudah dimasukkan dari perangkat mana pun.
> - **Infrastruktur Sinkronisasi:** Menggunakan **Server Realtime Instan Tanpa Login** (berbasis *Server-Sent Events / SSE Stream* + *Server-Authoritative State* di backend Express), sehingga setiap perubahan dari HP Remote langsung tampil di Layar Display dalam hitungan milidetik.

---

## 1. Overview & Core Concept

- **Apa yang Ditambahkan:** Sistem *Multi-Device Cloud Room* di mana setiap pertandingan memiliki **Kode Room 6 Karakter** unik. Operator cukup memindai QR Code yang tampil di Layar Utama menggunakan kamera HP atau memasukkan Kode Room untuk langsung mengendalikan papan skor dari perangkat lain.
- **Skenario Penggunaan Lapangan:**
  1. **Perangkat 1 (Laptop / TV / Proyektor):** Membuka mode **Layar Display** di pinggir lapangan atau ruang broadcast.
  2. **Perangkat 2 (HP / Tablet Wasit Meja):** Memindai QR Code dari layar laptop/TV dan otomatis masuk ke mode **Remote Operator** yang terhubung ke room yang sama.
  3. **Multi-Operator:** Beberapa perangkat remote dapat terhubung sekaligus (misalnya 1 HP pencatat waktu & skor, 1 tablet pencatat statistik & kartu).

---

## 2. User Experience & Visual Design

### Alur Menghubungkan Perangkat Baru
1. **Tombol & Indikator Koneksi di Header:**
   - Pada header Layar Display dan Remote terdapat badge interaktif **`ROOM: JONG26 (2 Perangkat)`** beserta ikon QR Code.
2. **Modal "Hubungkan Perangkat / Remote HP":**
   - Menampilkan **QR Code Resolusi Tinggi** yang mengarah langsung ke URL publik aplikasi dengan parameter `?room=KODE&mode=remote`.
   - Menampilkan **Kode Room 6 Karakter** dengan ukuran besar dan tombol **Salin Link Remote**.
   - Menyediakan kolom **Gabung ke Room Lain** (input 6 karakter) atau tombol **Buat Room Baru** jika ada lebih dari satu lapangan pertandingan.
3. **Sinkronisasi Aksi & Buzzer Jarak Jauh:**
   - Saat operator menekan tombol **Buzzer** di HP Remote, suara klakson digital akan berbunyi langsung di **Layar Display Utama** (TV/Laptop).
   - Saat operator memicu **Gol, Kartu Kuning/Merah, atau Substitusi** di HP, animasi overlay layar penuh langsung meluncur di Layar Display.

---

## 3. Key Product Decisions & Trade-Offs

- **Server-Authoritative Timer & State:**
  - *Pendekatan:* Server Express menyimpan state setiap Room dan menjalankan *countdown timer* secara otoritatif di sisi server.
  - *Alasan:* Jika layar HP operator terkunci atau sinyal seluler sempat terputus beberapa detik, waktu pertandingan di Layar Utama tidak akan meleset atau berhenti sendiri. Begitu HP aktif kembali, waktu dan skor langsung tersinkronisasi.
- **Kombinasi SSE (Server-Sent Events) + HTTP REST + Auto-Reconnect:**
  - *Pendekatan:* Menggunakan jalur streaming SSE (`/api/rooms/:roomId/events`) yang dipadukan dengan endpoint mutasi cepat (`POST /api/rooms/:roomId/sync`) dan mekanisme *auto-reconnect*.
  - *Alasan:* Jauh lebih tahan terhadap pembatasan jaringan seluler/firewall dibandingkan koneksi WebSocket mentah, tanpa perlu autentikasi rumit.
- **Dukungan URL Publik Otomatis (`Shared App URL`):**
  - *Pendekatan:* Generator QR Code secara cerdas menggunakan domain publik (`ais-pre-...`) agar saat dipindai oleh HP lain di luar akun pengembang, halaman langsung terbuka tanpa terhalang halaman login pengembang.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   MULTI-DEVICE REALTIME SYNC ARCHITECTURE                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [PERANGKAT 1: TV / LAPTOP]                [PERANGKAT 2: HP / TABLET]      │
│  ┌─────────────────────────┐               ┌────────────────────────────┐  │
│  │   BROADCAST DISPLAY     │               │     REMOTE CONTROLLER      │  │
│  │  - Tampilan 4:3 Neon    │               │  - Kontrol Waktu & Skor    │  │
│  │  - QR Code Room Modal   │               │  - Aksi Gol, Kartu, Sub    │  │
│  │  - Audio Buzzer Output  │               │  - Input Kode Room 6 Digit │  │
│  └────────────▲────────────┘               └──────┬──────────────▲──────┘  │
│               │                                   │              │         │
│    SSE Stream │ (Realtime Push)         HTTP POST │ (Mutations)  │ SSE     │
│               │                                   ▼              │         │
│  ┌────────────┴──────────────────────────────────────────────────┴──────┐  │
│  │                EXPRESS REALTIME ROOM SERVER (server.ts)              │  │
│  │  - Room State Store (In-Memory + Disk Persistence)                   │  │
│  │  - Server-Side Authoritative Countdown Timer (1s Tick)               │  │
│  │  - Remote Buzzer Signal Broadcaster                                  │  │
│  │  - Connected Device Presence Counter                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Endpoint API Sinkronisasi Baru (`server.ts`)
- `GET /api/rooms/:roomId`: Mengambil state terkini dari Room (atau membuat Room baru dengan default `GAWANG MINI JONG CANO` jika belum ada).
- `GET /api/rooms/:roomId/events`: Jalur streaming *Server-Sent Events* (SSE) untuk mendorong pembaruan state, sinyal buzzer jarak jauh (`buzzerTrigger`), dan jumlah perangkat aktif secara instan ke seluruh perangkat di Room tersebut.
- `POST /api/rooms/:roomId/sync`: Menerima perubahan state dari Remote Controller, memvalidasi, menyimpan, dan menyiarkannya ke semua perangkat yang terhubung.
- `POST /api/rooms/:roomId/buzzer`: Memicu bunyi klakson/buzzer dari HP Remote agar berbunyi serentak di Layar Display Utama.
