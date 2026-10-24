# Digital Futsal & Mini Soccer Broadcast Scoreboard (Papan Skor Digital Futsal)

Aplikasi web papan skor digital kelas broadcast profesional untuk pertandingan futsal dan mini soccer yang interaktif, responsif, dan sinkron secara real-time antara Layar Display Utama dan Remote Controller operator lapangan.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Pilihan Terkonfirmasi dari Tanya Jawab:**
> - **Efek Suara:** Menggunakan generator digital audio buzzer sintetis presisi tinggi (Web Audio API) tanpa efek suara TTS selebrasi gol, menjamin kejelasan klakson pertandingan resmi tanpa distorsi audio.
> - **Integrasi Kecerdasan Buatan (Gemini):** Format analisis berupa **Ulasan Taktis Gaya Komentator TV Pertandingan** dan **Rilis Berita Pers Olahraga Resmi Futsal** pasca-pertandingan / paruh babak.
> - **Dual-Layer Realtime Synchronization:** Mendukung sinkronisasi multi-device otomatis menggunakan kode ruang pertandingan (*Room Code / Match PIN*), didukung BroadcastChannel + LocalStorage untuk latensi nol pada perangkat lokal dan Firestore realtime listener saat mode online aktif.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun:** Papan skor digital mutakhir dengan rasio broadcast 1600x1200 (4:3) adaptif, dilengkapi panel remote operator yang dapat dibuka sebagai modal mengambang atau halaman kendali tersendiri di perangkat ponsel/tablet.
- **Pengguna Sasaran:** Operator broadcast, panitia turnamen futsal/mini soccer, wasit meja/pencatat waktu, serta penonton di arena lapangan maupun streaming layar lebar.
- **Nilai Utama:** Kemudahan pengoperasian pertandingan lewat hotkey keyboard cepat atau smartphone remote, visual neon broadcast beresolusi tinggi, animasi overlay gol/kartu/substitusi spektakuler, pencatatan statistik mendalam, dan pembuatan berita/ulasan taktis instan otomatis.

---

## 2. User Experience & Visual Design

### Alur Pengguna (User Flows)
1. **Inisiasi Pertandingan:** Operator mengatur nama kedua tim, warna jersey/neon, mengunggah logo tim (PNG transparan), serta mengisi daftar 9 pemain per tim (5 pemain utama, 2 cadangan, 2 ofisial).
2. **Kendali Pertandingan:** Operator dapat mengontrol waktu (Start/Pause, penambahan/pengurangan menit & detik), skor, babak (Period 1, Period 2, Extra Time, Penalty), serta kartu dan substitusi pemain.
3. **Momen Kritis & Overlay:** Saat gol dicetak atau kartu/pergantian dilakukan, Layar Utama menampilkan animasi panggung dramatis bergerak masuk dari kiri ke kanan dengan detail nama dan nomor pemain.
4. **Buzzer & Akhir Waktu:** Ketika timer menyentuh `00:00`, sistem secara otomatis memicu nada buzzer klakson digital bertempo ganda dan menampilkan modal peringatan visual "WAKTU HABIS".
5. **Adu Penalti (Shootout):** Tombol aktivasi mode penalti membuka grid 7 penendang untuk Home dan Away dengan indikator dot visual gol (hijau) atau gagal (merah).
6. **Statistik & Analisis AI:** Modal statistik pertandingan menyajikan perbandingan *Shots, Shots on Target, Corners, Yellow/Red Cards*, serta persentase *Ball Possession*. Tombol AI Gemini memicu pembuatan ulasan komentator taktis TV dan laporan berita olahraga lengkap dalam hitungan detik.

### Identitas Visual & Tema "Premium Dark Neon"
- **Aesthetic Mood:** Cyber-athletic broadcast arena, atmosfer stadion malam dengan pencahayaan neon tajam dan kontras tinggi.
- **Palet Warna:**
  - *Background Canvas:* Deep Midnight Onyx (`#080b11`, gradient radial ke `#0d131f`)
  - *Tim Home Accent:* Cyan Neon Glow (`#00f0ff`, border `rgba(0, 240, 255, 0.4)`)
  - *Tim Away Accent:* Crimson Amber Neon Glow (`#ff3366` / `#ff9900`)
  - *Display Timer:* High-Luminance Digital Yellow/Lime (`#39ff14` / `#fcee0a`)
  - *Surfaces & Panels:* Slate Glassmorphism (`rgba(15, 23, 42, 0.85)` dengan hairline border `1px solid rgba(255, 255, 255, 0.1)`)
- **Tipografi:**
  - *Display Scores & Timer:* Google Font **Chakra Petch** & font-mono tabular numerals untuk efek display digital LED kokoh tanpa jitter layout.
  - *Header & Team Titles:* **Outfit** (Bold & uppercase tracking wide).
  - *Body, Stat Bars & Controls:* **Plus Jakarta Sans** untuk kenyamanan membaca di controller.
- **Hierarki & Komposisi 4:3 (1600x1200 Scaling):**
  - Container menggunakan viewport scaler otomatis (CSS transform scale / aspect-ratio container) agar tetap presisi 4:3 baik di layar proyektor, monitor 4:3, maupun layar broadcast modern.
  - *Header:* Minimalis dengan ikon trofi emas di tengah, indikator status sinkronisasi, dan tombol aksi utilitas (Statistik, Remote Pop-up, Tes Buzzer, Bantuan Shortcut).
  - *Main Stage:* Kiri (Home Team & Penalti), Tengah (Timer Kotak Neon & Indikator Babak), Kanan (Away Team & Penalti).

---

## 3. Key Product Decisions & Trade-Offs

- **Desain Arsitektur Dual-Window & Sinkronisasi:**
  - *Pendekatan Terpilih:* Mengombinasikan Web BroadcastChannel API + LocalStorage untuk sinkronisasi lokal instan (<2ms) antar-tab browser di satu laptop/komputer, dan Firestore listener untuk sinkronisasi multi-device jarak jauh melalui Match Code PIN.
  - *Alasan:* Memungkinkan operator bekerja offline tanpa ketergantungan koneksi internet arena yang lambat, namun tetap siap dihubungkan ke HP remote wasit meja.
- **Audio Buzzer Sintetis (Web Audio API):**
  - *Pendekatan Terpilih:* Menggunakan osilator multi-nada (Dual-Square wave 440Hz + 880Hz dengan modulasi envelope klakson stadion futsal).
  - *Alasan:* Bebas dari file MP3 eksternal yang rawan 404/CORS, nol latensi, dan bekerja stabil di semua browser modern.
- **Server-Side Gemini API Proxy:**
  - *Pendekatan Terpilih:* Backend Express (`/api/gemini/analyze`) menggunakan SDK `@google/genai` dengan model `gemini-3.8-flash`, menjaga keamanan API key di environment server AI Studio.
  - *Alasan:* Menghasilkan teks komentator TV berbahasa Indonesia yang hidup, cerdas menganalisis statistik jalannya laga, dan mematuhi standar arsitektur aman.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FUTSAL SCOREBOARD SYSTEM                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   BROADCAST DISPLAY       │      │   MOBILE / MODAL REMOTE     │   │
│   │   (1600x1200 4:3 Canvas)  │      │   (Operator Controller UI)  │   │
│   │  - Neon Scoreboard        │      │  - Timer controls           │   │
│   │  - Digital LED Timer      │◄────►│  - Score & Period Steppers  │   │
│   │  - Penalty Shootout Dots  │      │  - Squad & Substitution     │   │
│   │  - Action Animated Overlay│      │  - Match Stats Adjuster     │   │
│   └─────────────▲─────────────┘      └──────────────▲──────────────┘   │
│                 │                                   │                  │
│                 └─────────────────┬─────────────────┘                  │
│                                   │                                    │
│                 ┌─────────────────▼─────────────────┐                  │
│                 │     REALTIME STATE SYNCHRONIZER   │                  │
│                 │  - BroadcastChannel (Local Sync)  │                  │
│                 │  - LocalStorage State Persistence │                  │
│                 │  - Firebase Firestore (Cloud Sync)│                  │
│                 └─────────────────▲─────────────────┘                  │
│                                   │                                    │
│                 ┌─────────────────▼─────────────────┐                  │
│                 │    SERVER API PROXY (Express)     │                  │
│                 │  - POST /api/gemini/analyze       │                  │
│                 │  - Google GenAI (gemini-3.8-flash)│                  │
│                 └───────────────────────────────────┘                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Struktur Data Utama (Match State)
- `matchId`: ID sesi / kode kamar pertandingan (contoh: `"FUTSAL-2026"`).
- `timer`: `{ minutes: number, seconds: number, isRunning: boolean, mode: 'down' }`.
- `period`: 1 | 2 | 3 (Extra 1) | 4 (Extra 2) | 5 (Penalties).
- `homeTeam` & `awayTeam`:
  - `name`: string
  - `logoUrl`: string (Data URL atau asset bawaan)
  - `score`: number
  - `fouls`: number
  - `color`: string (tema aksen hex)
  - `players`: Array<{ id: string, number: number, name: string, role: 'starter' | 'sub' | 'official', yellowCards: number, redCard: boolean, goals: number }>
  - `penalties`: Array<boolean | null> (hingga 7 penendang, true = Gol, false = Gagal, null = belum menendang)
- `stats`:
  - `home`: `{ shots: number, shotsOnTarget: number, corners: number, possession: number }`
  - `away`: `{ shots: number, shotsOnTarget: number, corners: number, possession: number }`
- `activeOverlay`: `{ type: 'goal' | 'card' | 'sub' | 'timeup', team: 'home' | 'away', data: any, id: number } | null`

### Peta Shortcut Keyboard (Bebas Konflik)
| Tombol | Fungsi |
| :--- | :--- |
| **Spasi** | Start / Pause Timer Pertandingan |
| **Panah Atas / Bawah** | Tambah / Kurang Menit Timer |
| **Panah Kanan / Kiri** | Tambah / Kurang Detik Timer |
| **Q / A** | Tambah / Kurang Skor Tim Home |
| **P / L** | Tambah / Kurang Skor Tim Away |
| **K / J** | Tambah / Kurang Babak (Period) |
| **T / G** | Gol / Gagal Adu Penalti Tim Home |
| **Y / H** | Gol / Gagal Adu Penalti Tim Away |
| **Z / X** | Kartu Kuning (Home / Away) |
| **C / V** | Kartu Merah (Home / Away) |
| **PageUp / PageDown** | Menu Cepat Pergantian Pemain (Home / Away) |
| **M** | Buka / Tutup Panel Remote Controller |
