# HANDOFF: AISYS Game Studio, Core Runtime, dan Generasi Manifest

**Diperbarui:** 25 November 2026
**Untuk:** agen pengembang AISYS yang melanjutkan pekerjaan ini
**Bahasa dokumen:** Indonesia (identifier kode tetap Inggris)

---

## 0. Cara memakai dokumen ini

1. Baca bagian 1-3 untuk memahami **apa yang sudah terjadi dan mengapa**.
2. Baca bagian 8-10 untuk tahu **apa yang harus dikerjakan sekarang** dan urutannya.
3. Lampiran A-C berisi bahan siap pakai (prompt Sesi 7, rencana evaluasi, kode perbaikan Studio).
4. Pekerjaan berikutnya **belum** dimulai dari evaluasi model. Ada perbaikan integrasi Studio yang harus selesai dulu (bagian 8).

---

## 1. Ringkasan satu halaman

- **Produk:** AISYS Game Studio, SPA Vite + React di Vercel (`aisys-game-engine.vercel.app`). Pengguna mendeskripsikan game, model AI (deepseek-v4-flash lewat gateway SumoPod) menghasilkan game HTML5 berbasis web. Target pengguna: mahasiswa dan dosen. Hasil akhir harus berupa **satu berkas HTML yang berjalan offline** (`file://`).
- **Masalah awal:** kode game dari model sering terpotong (100 sampai 600+ baris).
- **Akar masalah (terbukti dengan telemetri):** bukan batas token gateway. Model *thinking* menyala secara default dan menghabiskan seluruh 16.384 token untuk penalaran sebelum kode selesai.
- **Perbaikan 1:** `reasoning_effort: "none"` di payload (terverifikasi: dua game utuh 489 dan 497 baris, `finish_reason: "stop"`, sekitar 30 detik, `reasoning_tokens: 0`).
- **Perbaikan 2 (arsitektur):** model tidak lagi menulis seluruh game. Ada **AISYS Core Runtime** (`src/runtime/aisys-runtime.js`) yang menangani loop, fisika, input, audio, UI, dan analitik, sedangkan model hanya menulis **manifest deklaratif** (`AISYS.defineGame({...})`, 50-100 baris).
- **Genre pilot:** Endless Runner (contoh: EcoSort Run, game edukasi pemilahan sampah). Kontrak: `endless-runner-schema-1.md`.
- **Status:** runtime v0.1 selesai dan lolos pengujian independen di Chromium (selfTest 9/9, fuzz 300 manifest). Integrasi Studio ada, tetapi uji templat menemukan **6 masalah** yang belum diperbaiki (bagian 8). Evaluasi 20 percobaan dengan model **belum dijalankan**.

---

## 2. Konteks produk dan stack

| Hal | Detail |
|---|---|
| Frontend | Vite + React + TypeScript, deploy Vercel |
| Gateway model | SumoPod, `https://ai.sumopod.com/v1/chat/completions` (kompatibel OpenAI) |
| Model | `deepseek-v4-flash` |
| Pengguna | Mahasiswa dan dosen STIKOM Yos Sudarso; watermark bawaan "Built with AISYS HTML5 Engine" dan "STIKOM YOS SUDARSO" |
| Kendala keras | Hasil harus satu berkas HTML tanpa aset eksternal (portabel dan offline) |
| 9 genre resmi (rencana) | 2D Platformer, Top-Down Shooter, Puzzle Grid, Endless Runner, Rhythm, Physics/Slingshot, Tower Defense, Idle/Tycoon, Dungeon Crawler |
| Prinsip edukasi | **Ludic Learning**: konsep ilmu menjadi mekanik inti, bukan kuis yang menyela |
| Alur sesi Studio | Sesi 1-7. Sesi 6 = PRD (blueprint), Sesi 7 = eksekusi pembuatan kode game |

Berkas penting di repositori: lihat bagian 12.

---

## 3. Riwayat masalah dan keputusan

### 3.1 Diagnosis kode terpotong

Hipotesis awal: gateway membatasi output ke 4.096 token. **Terbantah**: sebuah langkah obrolan selesai normal (`stop`) dengan 4.283 token.

Telemetri yang dipasang di aplikasi: `finish_reason`, `completion_tokens`, `durasi`, `lineCount`, dan karakter `content` vs `reasoning`.

| Langkah | Hasil |
|---|---|
| Obrolan discovery (langkah 1-4) | 262-945 token, `stop`, 7-13 dtk, penalaran kecil |
| PRD (langkah 5) | 3.814-4.283 token, `stop`, tanpa kode |
| Generate kode (langkah 6) | **selalu 16.384 token, `finish_reason: "length"`**, ~105-110 dtk |
| Contoh pembagian pada langkah 6 | `reasoning` 44.588 dan 25.541 karakter vs `content` 6.742 dan 20.515 karakter |

Kesimpulan: thinking menyala secara default (dokumentasi DeepSeek: thinking aktif secara default dengan effort "high") dan menghabiskan anggaran token pada tugas generate game.

### 3.2 Tes parameter di gateway (curl)

| Parameter | Hasil |
|---|---|
| `thinking: {"type":"disabled"}` | **Diabaikan SumoPod**: `reasoning_content` tetap ada, `reasoning_tokens` 207, `completion_tokens` 285 |
| `reasoning_effort: "none"` | **Bekerja**: tanpa `reasoning_content`, `reasoning_tokens` 0, `completion_tokens` 62 |

Playground SumoPod menawarkan tingkat thinking: Auto, No thinking, Low, Medium, High.

### 3.3 Perbaikan lain di sisi aplikasi

- Ekstraktor lama mengambil blok kode mana pun (potongan draf di monolog sehingga panel Code menampilkan 4 dan 15 baris). Sekarang hanya blok yang valid (dokumen HTML dengan `<!DOCTYPE html>`, atau manifest dengan penanda).
- Ditambah penanda penutup (`<!-- END_OF_GAME -->` untuk mode HTML lama, `// END_OF_MANIFEST` untuk manifest).
- Larangan monolog ditambahkan ke system prompt. **Catatan:** aturan ini tidak memengaruhi `reasoning_content` karena itu jalur terpisah.

### 3.4 Kapasitas dan kunci API (informasi untuk tahap produksi)

- Satu API key dipakai bersama berarti **saldo dan batas laju dibagi bersama** (RPM, TPM, concurrency, batas saldo). Tidak ada saluran terpisah per pengguna.
- Dokumentasi resmi SumoPod soal batas laju **tidak ditemukan**. Cek dashboard, tanyakan ke support, atau baca header respons (`x-ratelimit-*`, `Retry-After`).
- Bila banyak pengguna bersamaan: gunakan backend proxy dengan autentikasi dan kuota per pengguna, retry dengan backoff untuk 429, antrean sisi aplikasi, dan uji beban bertahap (5, 10, 20, 30 generate bersamaan).
- Jangan menyimpan API key di frontend. Rotasi key bila pernah tertempel di chat, riwayat terminal, atau repositori.

### 3.5 Keputusan arsitektur (disetujui pemilik produk)

- **Jalur 2 (Core Runtime) didahulukan** dibanding memperkaya prompt. Alasan: pola kode di prompt dibayar ulang pada setiap generate (token masukan dan keluaran), sedangkan di runtime dibayar sekali dan model hanya memanggil/mengisi data.
- **Genre pilot:** Endless Runner (struktur deklaratif paling bersih, uji selfTest mudah).
- **Mode `sequence`** (mis. Syntax Surfer) **ditunda ke v0.2**. v0.1 hanya mode `category`.
- **Hook dibatasi ~40 baris** agar model tidak kembali menulis loop game manual.
- **Hook API:** hanya 6 event (`onStart`, `onJump`, `onTick`, `onCollect`, `onHit`, `onGameOver`). Tidak ada `g.addScore`, `g.loseLife`, `g.say`, `g.fx.*`, `drawPlayer`, `drawEntity`. Manifest dilarang mengubah skor, nyawa, dan kecepatan secara langsung.
- Prinsip: YAGNI untuk v0.1; modul tambahan (`grid`, `physics-verlet`, `waypoints`) dimuat hanya bila game mendeklarasikannya (`requires: [...]`), nanti.

### 3.6 Koreksi penting (jangan diulang)

1. **Rumus kelayakan lompat memakai `world.speed` (kecepatan paling lambat), bukan `maxSpeed`.** Waktu tumpang tindih rintangan di bawah pemain adalah `(w_hazard + w_player) / speed`, jadi kasus terburuk adalah kecepatan paling lambat. Rekomendasi awal yang memakai `maxSpeed` keliru dan sudah dikoreksi.
2. **Bot selfTest harus memusatkan lompatan pada tengah rintangan** (jendela waktu takeoff ±50 ms, kriteria nol tabrakan). Bot heuristik lama menghasilkan negatif palsu (menandai game yang sebenarnya adil sebagai gagal).
3. **`defineGame` tidak boleh mendaftarkan listener `DOMContentLoaded` bila halaman sudah siap.** Periksa `document.readyState`.
4. **`preventDefault()` pada `pointerdown` mencegah iframe mengambil fokus**, sehingga keyboard tidak sampai ke game di preview Studio. Sudah diperbaiki (hapus `preventDefault`, panggil `window.focus()`).
5. **Mesin simulasi selfTest harus `headless` dan `silent`.** Sebelumnya selfTest mengirim 146 pesan `aisys:track` palsu dan membuat 19 AudioContext sebelum pemain menyentuh game.
6. **`aisys:track` dikirim setelah skor dan kombo diperbarui** (sebelumnya tertinggal satu kejadian).
7. **Pemeriksaan `render` di Node dilaporkan `skipped`**, bukan lulus. Pengujian visual hanya sah di browser sungguhan.
8. Kecepatan model dari log sekitar 200 token/detik; perkiraan awal 100-150 terlalu pesimistis. Manifest 2-3 ribu token seharusnya selesai dalam 12-25 detik.

---

## 4. Arsitektur target

```
[ Model ] --(manifest 50-100 baris: AISYS.defineGame({...}) // END_OF_MANIFEST)--+
                                                                                v
[ Studio ] --(ekstraktor: penanda + kit + uji sintaks)--> [ srcdoc iframe sandbox ]
              runtime (?raw)  +  manifest  (+ jembatan error, + selfTest)
                                                                                |
[ Unduh .html ] = satu berkas: templat + runtime + manifest (offline, file://) <-+
```

- Runtime diimpor lewat `?raw` dari `src/runtime/aisys-runtime.js` (JavaScript murni, header lisensi ISC dan atribusi Lucide tertanam).
- Studio menerima pesan dari iframe: `aisys:selftest`, `aisys:track`, `aisys:export`, dan (usulan) `aisys:error`.
- Perbaikan otomatis (satu kali, berbasis patch SEARCH/REPLACE, bukan generate ulang) memakai hasil validator dan selfTest sebagai sinyal. **Belum dibangun.**
- Simpan `engineVersion` bersama setiap game tersimpan (runtime akan berevolusi; game lama tidak boleh rusak).

---

## 5. Spesifikasi runtime v0.1 (`src/runtime/aisys-runtime.js`)

**Ukuran:** ~54-58 KB mentah, ~28,5 KB setelah minify (esbuild), ~7-8 KB gzip (angka dilaporkan agen).

**Mesin:**
- Langkah waktu tetap `FIXED_DT = 1/120` dengan akumulator; `MAX_FRAME_DT = 0.05` (mencegah menembus rintangan setelah tab kembali aktif).
- Ruang koordinat logis 1280×720 (16:9), skala otomatis dan berbasis `devicePixelRatio`; `touch-action: none`; jeda otomatis saat tab tidak aktif.
- Input: keyboard (Spasi, W, Panah Atas), pointer/sentuh. `window.focus()` dipanggil pada aksi agar fokus keyboard masuk ke iframe.
- Audio: *singleton* `AudioContext` per halaman, dibuat lazy pada gestur pertama (`unlockSharedAudio()`); `play()` tidak memanggil `resume()` berulang. Jenis SFX: `jump`, `coin`, `hit`, `laser`, `boom`. Mute tersimpan (try/catch dengan cadangan memori).
- Seeded RNG (`createPRNG(seed)`).
- Semua teks digambar lewat `fillText` (tanpa `innerHTML`); label dibatasi (item ≤32, `explain` ≤120, kategori ≤24 karakter).
- Penyimpanan (`localStorage`) dibungkus try/catch; di iframe sandbox tanpa `allow-same-origin` akan melempar `SecurityError` dan jatuh ke cadangan memori (sudah diuji).

**Validator (`validateManifest`):**
- Wajib: `schema === 1`, `kit === "endless-runner"`, `id`, `title`. Field tak dikenal diabaikan; angka di luar rentang di-clamp dengan peringatan.
- Tinggi lompat `H = v² / (2g)`; **tolak** bila `H < 27`. Tinggi rintangan dibatasi `≤ floor(0.6·H)`.
- **Kelayakan per rintangan (pakai `world.speed`):**
  - `tAbove = 2·sqrt(v² − 2·g·h) / g`
  - `tReq = (w_hazard + w_player) / world.speed + 0.12`
  - bila `tAbove < tReq`: clamp lebar ke `floor((tAbove − 0.12)·speed − w_player)` jika ≥ 20 px, selain itu tolak dengan pesan diagnostik.
- Validasi silang blok `learning`: kategori minimal 2, setiap `item.category` ada, setiap kategori punya minimal satu item.
- Jarak adil antar rintangan (spawner): `gap ≥ v·(T + 0.22)·1.15 + 160 px`, dihitung terhadap kecepatan saat spawn.

**`AISYS.selfTest(manifest)`** (berjalan di dalam iframe; mesin `headless` dan `silent`; hasil dikirim lewat `postMessage`):

| # | Pemeriksaan |
|---|---|
| 1 | `validate`: manifest lolos validator |
| 2 | `render`: sampel piksel kanvas luar layar (di Node: `skipped`) |
| 3 | `jump`: input lompat mengubah `y`, apeks sesuai teori |
| 4 | `progress`: jarak dan skor bertambah dalam simulasi 10 detik |
| 5 | `spawn`: setiap tipe `spawner.table` muncul |
| 6 | `numerik`: tidak ada NaN/Infinity |
| 7 | `bot adil`: bot berpusat di tengah rintangan, takeoff ±50 ms, 3 seed, pada `world.speed` dan `maxSpeed`, **nol tabrakan** (18 sub-run) |
| 8 | `hooks`: nol eksepsi hook |
| 9 | `belajar`: pemungutan item benar dan salah tercatat |

**Protokol pesan iframe ke Studio:**

| `type` | Muatan |
|---|---|
| `aisys:selftest` | `{ ok, checks[], metrics: { distance, score } }` (**gunakan `ok`, bukan `passed`**) |
| `aisys:track` | `{ gameId, event, itemId, isCorrect, score, combo }` (selisih ringan, dikirim setelah state diperbarui) |
| `aisys:export` | `{ analytics, distance, gameId, score, title, objectives, misconceptions }` (dua yang terakhir ditambahkan agen) |
| `aisys:error` | `{ message, line }` (usulan, lihat Lampiran C) |

Semua `postMessage` dijaga `window.parent !== window` dan hanya dikirim oleh mesin non-headless.

**Analitik:** `byCategory` mencatat hasil terhadap **kategori target** saat itu. Untuk menganalisis miskonsepsi gunakan daftar `mistakes` (item, kategorinya, target saat salah, `explain`).

---

## 6. Kontrak manifest (ringkas; sumber lengkap: `endless-runner-schema-1.md`)

Bentuk contoh lengkap ada di Lampiran A. Ringkasan rentang:

| Blok | Field |
|---|---|
| root | `schema` (1), `kit`, `id`, `title`, `seed`, `theme.preset`, `hud`, `hooks` |
| `player` | `x` 80-600, `w` 20-120, `h` 20-120, `gravity` 800-4000, `jumpVelocity` 400-1400, `lives` 1-9, `invulnerableSec` 0-3 |
| `world` | `groundY` 400-680, `speed` 150-600, `maxSpeed` ≥ speed (≤1200), `accel` 0-30, `layers` |
| `spawner` | `interval [min,max]`, `table[]` (`hazard`: `w` 20-140, `h` 16-110, `weight`; `item`: `weight`, `heights` ground/mid/high) |
| `rules` | `perSecond`, `correct`, `wrong`, `hazard`, `combo`, `difficulty` |
| `learning` | `subject`, `concept`, `objectives[]`, `misconceptions[]`, `mode: "category"`, `categories[]`, `items[]`, `target {rotateAfterCorrect 2-15, bias 0.2-0.8}` |

### Status fitur (kontrak vs runtime)

| Fitur | Status |
|---|---|
| Mekanik inti, validator, selfTest, analitik | Diverifikasi independen |
| `theme.preset` (`clean-modern`, `neon`, `cartoon`, `retro-pixel`) | **Dilaporkan diimplementasikan agen, belum diverifikasi** (berkas runtime terbaru belum diperiksa) |
| `theme.palette` (override warna) | Disebut ada, **kunci-kuncinya belum didokumentasikan**; tidak masuk cheat-sheet |
| `world.layers` (`clouds`, `hills`), `hud` (`score`, `lives`, `combo`, `target`) | Dilaporkan aktif, belum diverifikasi |
| `learning.objectives` dan `misconceptions` pada ekspor | Dilaporkan ditambahkan, belum diverifikasi |
| `rules.correct.combo`, `rules.wrong.lives`, `rules.wrong.combo` | Tidak dipakai runtime; sebaiknya dihapus dari kontrak |
| Hook `drawPlayer`, `drawEntity`, helper `g.addScore` dll. | **Tidak ada dan tidak akan ditambahkan** (keputusan) |
| `learning.mode: "sequence"` | Ditunda ke v0.2 |

---

## 7. Hasil verifikasi independen

Pengujian dilakukan di Chromium headless (Playwright) dan Node pada berkas `standalone-test*.html` yang diunggah. Angka berikut hasil pengukuran, bukan laporan agen.

| Uji | Hasil |
|---|---|
| selfTest di browser | 9/9 lolos, `render` = 248 warna nyata, DPR 2 dan 3 terbaca |
| Game terpasang dan berjalan | Ya (Spasi dan ketukan memulai; lompat keyboard di iframe sandbox: `vy` = −580, fokus benar) |
| Iframe `sandbox="allow-scripts"` | `localStorage` melempar `SecurityError`, cadangan memori bekerja; pesan sampai dengan `e.source` benar, origin `null` |
| Efek samping selfTest | Sebelum input: hanya 1 pesan (`aisys:selftest`), 0 AudioContext, 0 peringatan audio; setelah gestur: 1 AudioContext `running` |
| `aisys:track` setelah 1 item benar | `score: 52` (50 + 2 poin pasif), `combo: 1` |
| Ekspor | `aisys:export` sampai, memuat `analytics`, `distance`, `gameId`, `score`, `title`, `type` |
| Ponsel (emulasi) | Tanpa meta viewport: layout 980 px (game kecil dan bergeser); dengan meta viewport: 390 px, banner lanskap muncul di potret |
| Fuzz 300 manifest acak (generator saya, rentang skema) | 81 ditolak, 219 valid, **219 lolos selfTest, 0 gagal, 0 crash** |
| Fuzz (laporan agen) | 50 ditolak, 250 valid, 250 lolos, 0 crash (generator berbeda, angka tidak bisa dibandingkan langsung) |
| Manifest contoh EcoSort (Lampiran A) | Lolos validator tanpa peringatan dan selfTest 9/9 di Chromium (diuji pada runtime sebelum penambahan tema) |

**Caveat metodologis:**
- Validator dan bot selfTest memakai asumsi fisika yang sama. Lulus 100% membuktikan **konsistensi rumus dan bot**, bukan bahwa **manusia** merasa game itu adil. Jendela 120 ms harus dikalibrasi lewat uji main nyata.
- Distribusi fuzz acak tidak sama dengan distribusi manifest keluaran model. Tingkat penolakan validator pada keluaran model baru diketahui setelah evaluasi.
- Pengujian saya bukan di iOS Safari atau ponsel asli, dan suara tidak diverifikasi.

---

## 8. Masalah terbuka (kerjakan sebelum evaluasi model)

Ditemukan dari uji templat iframe persis seperti potongan `PreviewPanel.tsx` yang dikirim (runtime + manifest, `sandbox="allow-scripts allow-pointer-lock allow-modals"`). Kode perbaikan ada di Lampiran C.

| # | Masalah | Hasil uji | Prioritas |
|---|---|---|---|
| 1 | `</script>` dalam teks manifest memutus halaman (potongan tidak menunjukkan escape, padahal laporan menyebutnya ada) | Game gagal terpasang; markup masuk ke DOM iframe | Tinggi |
| 2 | Manifest yang melempar error tidak dilaporkan | Layar kosong, 0 pesan ke Studio | Tinggi |
| 3 | `selfTest` tidak pernah berjalan di preview (`?selftest=1` tidak ada di `srcdoc`) | 0 pesan `aisys:selftest` dalam 1,8 dtk | Tinggi |
| 4 | `App.tsx` membaca `e.data.passed`, runtime mengirim `ok` | Log Studio selalu "Gagal ❌" | Tinggi |
| 5 | `handleMessage` tidak memeriksa `e.source`; unduhan ekspor tanpa pembatasan | Iframe tak terkait dapat memicu handler | Sedang |
| 6 | Sandbox lebih luas dari perlu | `allow-modals`, `allow-pointer-lock` tidak dibutuhkan | Rendah |

Masalah lain yang masih perlu ditangani:
- Templat ekspor harus memuat `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, banner lanskap, dan menjalankan di `file://` tanpa Studio (uji pembukaan langsung).
- Opsional: `maximum-scale=1.0, user-scalable=no` pada viewport memblokir zoom; pertimbangkan aksesibilitas.
- `deepseekStream.ts`: pastikan payload memakai `reasoning_effort: "none"`; **hapus atau buat bersuara fallback yang diam-diam mengulang request tanpa parameter** saat HTTP 400; catat nilai effort di telemetri; pertimbangkan `temperature` lebih rendah (0,2-0,4) untuk kode.
- Perbaikan otomatis berbasis patch (satu kali, kirim pesan error dan potongan baris terkait, bukan generate ulang).
- Penyimpanan `engineVersion` per game.

---

## 9. Yang belum terverifikasi

- Implementasi 4 preset tema, `layers`, `hud`, ekspor `objectives`/`misconceptions` (berkas runtime terbaru belum diperiksa). Perlu tangkapan layar tiap preset dan daftar kunci `theme.palette`.
- Berkas lengkap `public/review/htmlExtractor.ts`, `PreviewPanel.tsx`, `App.tsx` (hanya potongan yang ditinjau). Potongan ekstraktor terlihat benar (penanda `// END_OF_MANIFEST`, properti `kit:`, uji `new Function`).
- iOS Safari dan ponsel asli (unlock audio, tinggi layar, kinerja frame rate), suara yang benar-benar keluar.
- Kualitas dan kelayakan manifest keluaran model, akurasi konten edukasi, kelayakan bagi manusia (uji main).
- Batas laju resmi SumoPod dan perilaku saat 10-100 pengguna bersamaan.

---

## 10. Langkah berikutnya (urut)

1. **Perbaiki integrasi Studio** (bagian 8, poin 1-6; kode di Lampiran C). Setelah itu uji ulang dengan manifest yang mengandung `</script>`, manifest yang melempar error, dan pastikan `aisys:selftest` muncul di tab Log dengan status benar.
2. **Verifikasi runtime terbaru:** jalankan `selfTest` pada manifest contoh (Lampiran A, sekarang memakai `theme: { preset: "cartoon" }`), ambil tangkapan layar 4 preset, dan dokumentasikan kunci `theme.palette` lalu perbarui cheat-sheet.
3. **Tempel Lampiran A** ke `src/config/defaultSkill.ts` dan `public/skill-config.json`, naikkan versi prompt.
4. **Jalankan evaluasi 20 percobaan** (Lampiran B) dan catat tabel metrik per percobaan. Laporkan hasilnya apa adanya, termasuk kegagalan.
5. **Tinjau hasil:** bila kegagalan terpusat di satu jenis, perbaiki prompt; bila validator terlalu sering menolak atau selfTest gagal pada manifest yang wajar, perbaiki runtime. Ulangi 20 percobaan setelah perubahan besar.
6. Setelah lolos: uji main nyata (5 game terbaik × 3 orang) untuk kalibrasi jendela 120 ms, dan uji di ponsel asli (Android Chrome, iOS Safari).

**Kriteria selesai fase ini:** semua metrik di Lampiran B tercapai, nol game yang dibagikan memuat fakta edukasi yang salah, dan uji main nyata tidak menemukan rintangan yang terasa tidak adil.

---

## 11. Aturan kerja untuk agen

1. **Jangan melaporkan "100% selesai" tanpa bukti independen.** Sertakan angka mentah, definisi metrik, lingkungan uji (Node atau browser), dan apa yang **tidak** diuji.
2. **Setiap uji dilaporkan lengkap** (misalnya 9/9 pemeriksaan per manifest), bukan hanya ringkasan.
3. **Pisahkan "dieksekusi" dari "lolos".** Hasil fuzz harus menyebut jumlah ditolak, valid, dan lolos selfTest.
4. **Verifikasi visual hanya sah di browser sungguhan.** Hasil Node tidak boleh dipakai untuk klaim render, audio, atau fokus.
5. **Jaga cheat-sheet sinkron dengan runtime.** Jangan menjanjikan fitur yang tidak dipakai kode; perbarui `endless-runner-schema-1.md` setiap kali kontrak berubah.
6. **Jangan menambah fitur di luar daftar** (YAGNI) tanpa persetujuan: tidak ada `drawPlayer`, helper skor, mode `sequence`, atau modul genre lain sebelum fase ini selesai.
7. **Keamanan:** isi manifest dan hook adalah kode buatan model yang berjalan di iframe sandbox. Perlakukan pesan dari iframe sebagai data tak tepercaya (periksa `e.source`, bersihkan nama berkas, batasi laju).
8. Jangan menempelkan API key atau token di percakapan, log, atau berkas; rotasi bila bocor.
9. Beri tahu pemilik produk bila ada klaim di laporan sebelumnya yang ternyata salah (contoh: escape `</script>` dan try/catch yang dilaporkan ada tetapi tidak terlihat di potongan kode).

---

## 12. Peta berkas

| Berkas | Peran |
|---|---|
| `src/runtime/aisys-runtime.js` | Core Runtime v0.1 (engine, validator, selfTest, ikon, audio) |
| `src/runtime/test-runtime.cjs` | Uji Node: 4 skenario manifest, uji rusak, fuzz. Ingat: pemeriksaan render di Node = `skipped` |
| `public/standalone-test.html` | Halaman uji mandiri (runtime + manifest EcoSort + kartu selfTest yang dapat dilipat). Buka di `file://` |
| `endless-runner-schema-1.md` | Kontrak manifest resmi (sebagian fitur lama dihapus lewat keputusan di bagian 3.5 dan 6) |
| `src/utils/deepseekStream.ts` | Panggilan gateway (SSE), payload `reasoning_effort`, telemetri token dan karakter |
| `src/utils/htmlExtractor.ts` | Ekstraksi manifest (penanda, `kit:`, uji sintaks) dan dokumen HTML lama |
| `src/components/PreviewPanel.tsx` | Iframe sandbox, penyatuan runtime + manifest, templat ekspor, fokus keyboard |
| `src/App.tsx` | Jembatan pesan iframe, ekspor JSON analitik |
| `src/components/ChatPanel.tsx` | Kartu status generasi dan tombol "Lanjutkan" |
| `src/config/defaultSkill.ts` dan `public/skill-config.json` | System prompt (versi 1.8) |
| `src/utils/storage.ts` | `localStorage` dan migrasi prompt |
| `public/review/` | Salinan `htmlExtractor.ts`, `PreviewPanel.tsx`, `App.tsx` untuk ditinjau |

---

## 13. Peta jalan jangka menengah (setelah fase ini)

- **Runtime modular:** `requires: ['grid' | 'physics' | 'waypoints']` untuk Puzzle Grid, Physics/Slingshot (Verlet), dan Tower Defense, dimuat hanya bila dideklarasikan.
- **Kit per genre** dengan struktur deklaratif (entitas, spawner, aturan) dan hook minimal.
- **Galeri ide edukasi statis** di Sesi 2 (kartu kurasi yang lolos uji intrinsik), sehingga model hanya mengembangkan ide yang dipilih.
- **Format PRD edukasi (Sesi 6):** tujuan pembelajaran, konsep yang diuji, miskonsepsi umum, cara mekanik mengajarkannya tanpa kuis yang menyela.
- **Konten edukasi sebagai data terpisah** (dapat dikoreksi dosen tanpa regenerate kode), dan analitik belajar (ringkasan konsep, ekspor JSON/CSV).
- **Revisi berbasis patch** untuk tombol "Ubah Visual" dan "Ubah Mekanik" (diff SEARCH/REPLACE).
- **Mode `sequence`** (Syntax Surfer) di v0.2.
- **Backend proxy** dengan autentikasi, kuota per pengguna, antrean, dan retry untuk 429.
- **Aksesibilitas:** palet aman buta warna, opsi kurangi gerakan, pembatasan zoom viewport yang dipertimbangkan ulang.
- **Pengujian berkelanjutan:** fuzz dan selfTest sebagai bagian CI, serta penambahan prompt caching (bagian prompt yang tetap diletakkan lebih dulu).
- **Akurasi konten:** tinjauan dosen untuk setiap game edukasi sebelum dibagikan (contoh kesalahan yang pernah ditemukan: "merah + biru = ungu" hanya benar pada model pigmen RYB, di layar RGB menjadi magenta; istilah era geologi yang lazim adalah Kenozoikum).

---

## Lampiran A: Prompt Sesi 7 (siap tempel ke `defaultSkill.ts`)

Salin isi di antara dua penanda berikut. Versi ini memuat `theme`, `world.layers`, dan `hud` berdasarkan laporan agen; setelah verifikasi runtime (langkah 2), sesuaikan bila ada perbedaan.

<!-- BEGIN PROMPT SESI 7 -->

## SESI 7: GENERASI GAME (MANIFEST AISYS)

Tugasmu di sesi ini: menulis **satu manifest game** untuk AISYS Core Runtime (kit `"endless-runner"`, `schema: 1`) berdasarkan PRD yang disetujui pengguna di Sesi 6.

Kamu **tidak** menulis HTML, CSS, game loop, kanvas, audio, atau kode fisika. Semua itu sudah disediakan runtime. Kamu hanya mengisi data.

### FORMAT KELUARAN (WAJIB)

1. Keluarkan **tepat satu** blok kode `js` berisi `AISYS.defineGame({ ... });` yang diakhiri baris `// END_OF_MANIFEST`.
2. Di luar blok kode, tulis paling banyak 2 kalimat Bahasa Indonesia (apa game-nya dan satu asumsi penting). Jangan menulis monolog berpikir, rencana, atau draf kode.
3. Semua teks yang tampil ke pemain (`title`, `label`, `explain`, `subject`, `concept`) berbahasa Indonesia. Semua `id` huruf kecil tanpa spasi (contoh: `"kulit-pisang"`).
4. Hanya gunakan field yang tercantum di cheat-sheet. Jangan menambah field lain.

### CHEAT-SHEET API

Wajib: `schema` (selalu `1`), `kit` (selalu `"endless-runner"`), `id`, `title`. Sisanya opsional; angka di luar rentang pada `player`, `world`, dan `spawner` akan dipotong runtime.

| Blok | Field (rentang, nilai bawaan) |
|---|---|
| root | `seed` (string; menentukan pola acak yang bisa diulang) |
| `theme` | `preset`: `"clean-modern"` \| `"neon"` \| `"cartoon"` \| `"retro-pixel"` (bawaan `"clean-modern"`) |
| `player` | `x` 80-600 (220), `w` 20-120 (44), `h` 20-120 (56), `gravity` 800-4000 (2400), `jumpVelocity` 400-1400 (900), `lives` 1-9 (3), `invulnerableSec` 0-3 (1.2) |
| `world` | `groundY` 400-680 (600), `speed` 150-600 (360), `maxSpeed` ≥ speed, ≤ 1200 (720), `accel` 0-30 (6), `layers` opsional: `["clouds", "hills"]` (bawaan: keduanya) |
| `spawner.interval` | `[min, max]` detik, bawaan `[0.9, 1.5]` |
| `spawner.table[]` hazard | `{ type: "hazard", id, w: 20-140, h: 16-110, weight }` |
| `spawner.table[]` item | `{ type: "item", weight, heights: ["ground" \| "mid" \| "high"] }` |
| `rules` | `perSecond` (5), `correct: { score, sfx }`, `wrong: { score (negatif), sfx, showExplain }`, `hazard: { lives: -1, sfx, shake (saran 0-20) }`, `combo: { step, max }`, `difficulty: { everySec, speed }` |
| `rules.*.sfx` | `"jump"`, `"coin"`, `"hit"`, `"laser"`, `"boom"` |
| `learning` (opsional) | `subject`, `concept`, `objectives[]`, `misconceptions[]`, `mode: "category"`, `categories[]`: `{ id, label (≤24 huruf), color }`, `items[]`: `{ id, label (≤32 huruf), category, explain (≤120 huruf) }`, `target: { rotateAfterCorrect: 2-15 (5), bias: 0.2-0.8 (0.5) }` |
| `hud` (opsional) | elemen yang tampil: `"score"`, `"lives"`, `"combo"`, `"target"` (bawaan: semuanya) |
| `hooks` (opsional) | lihat bagian HOOKS |

Tanpa blok `learning`, game berjalan sebagai arcade biasa dengan koin generik.

### GAYA VISUAL

Pilih **satu** `theme.preset` yang paling cocok dengan gaya visual di PRD:

- `"clean-modern"`: bersih dan serius (akademik, bisnis).
- `"neon"`: teknologi, siber, malam hari.
- `"cartoon"`: ceria, ramah anak, alam dan lingkungan.
- `"retro-pixel"`: arcade klasik, nuansa nostalgia.

Biarkan `world.layers` dan `hud` tidak ditulis kecuali PRD memintanya. Jika `hud` ditulis pada game belajar, **selalu** sertakan `"target"`.

### ATURAN KELAYAKAN (agar manifest tidak ditolak validator)

- Jika PRD tidak meminta lain, pakai nilai `player` dan `world` seperti pada contoh. Pilihan aman: `speed` 300-450, `maxSpeed` ≤ 720, `accel` 4-10.
- Setiap rintangan harus bisa dilompati dengan waktu yang cukup. Dengan `player` bawaan dan `speed` 360, lebar maksimal rintangan adalah:

| Tinggi rintangan `h` | Lebar maksimal `w` |
|---|---|
| ≤ 48 | 140 |
| 70 | 119 |
| 90 | 97 |
| 110 | 72 |

  (Tinggi maksimal yang masih bisa dilompati dengan pemain bawaan sekitar 101.) Rintangan yang terlalu lebar atau tinggi akan dipotong atau ditolak. Jika mengubah `gravity`, `jumpVelocity`, atau `speed`, pilih ukuran rintangan yang lebih kecil, bukan lebih besar.
- Jarak antar rintangan diatur runtime. Jangan membuat `spawner.interval` di bawah `[0.9, 1.5]` kecuali PRD menuntut.
- Sertakan paling sedikit satu rintangan dan satu entri `item` di `spawner.table`.

### ATURAN KONTEN BELAJAR (Ludic Learning)

Konsep ilmu harus menjadi **mekanik**: pemain belajar dengan mengambil item yang cocok dengan target, bukan menjawab kuis.

- Pakai 2-4 kategori, minimal 3 item per kategori, total 8-16 item. Setiap `id` unik.
- Setiap item harus jelas termasuk **satu** kategori saja. Hindari item yang klasifikasinya bergantung pada konteks.
- Sertakan minimal satu item yang menargetkan miskonsepsi yang ditulis di PRD, dan cantumkan miskonsepsi itu di `misconceptions`.
- `explain` singkat (≤120 huruf), benar secara ilmiah, dan menjelaskan **alasan** item masuk kategori itu.
- Hanya pakai fakta yang kamu yakin benar dan umum diajarkan. Jika ragu, ganti item. Jangan mengarang angka, tanggal, istilah, atau rumus.
- `mode` selalu `"category"`.

### BATAS FITUR

Mekanik berikut **belum tersedia**: lompat ganda, meluncur, rintangan udara, banyak jalur, boss, power-up, jawaban pilihan ganda, urutan token, palet atau karakter kustom di luar 4 preset tema. Jika PRD memintanya, jangan dibuat. Petakan ke bentuk kategori yang paling dekat dan tulis satu baris komentar `// CATATAN: ...` di awal blok kode.

### HOOKS (opsional; default `hooks` dikosongkan atau tidak ditulis)

Gunakan hanya bila PRD membutuhkan perilaku yang tidak bisa diatur lewat data. Total maksimal sekitar 40 baris. Hook yang melempar error membuat game gagal uji.

| Hook | Argumen |
|---|---|
| `onStart` | `(g)` |
| `onJump` | `(g)` |
| `onTick` | `(g, dt)` |
| `onCollect` | `(g, ent, isCorrect)`; `ent.data` berisi item belajar (`id`, `label`, `category`) |
| `onHit` | `(g, ent)`; `ent` adalah rintangan yang ditabrak |
| `onGameOver` | `(g, analytics)` |

`g` yang boleh **dibaca**: `g.state`, `g.time`, `g.distance`, `g.score`, `g.lives`, `g.combo`, `g.speed`, `g.player` (`x`, `y`, `vy`, `onGround`), `g.targetCategory`, `g.rng()`.
`g` yang boleh **dipanggil**: `g.showToast(teks, detik)` dan `g.audio.play(sfx)`.
Jangan mengubah `g.score`, `g.lives`, atau `g.speed` secara langsung.

### CONTOH LENGKAP (acuan bentuk dan gaya, bukan isi)

```js
AISYS.defineGame({
  schema: 1, kit: "endless-runner",
  id: "ecosort-run", title: "EcoSort Run", seed: "ecosort-01",
  theme: { preset: "cartoon" },

  learning: {
    subject: "Lingkungan Hidup",
    concept: "Pemilahan sampah organik, anorganik, dan B3",
    objectives: ["Mengelompokkan sampah berdasarkan sifatnya"],
    misconceptions: ["Baterai bekas dianggap sampah anorganik biasa"],
    mode: "category",
    categories: [
      { id: "organik",   label: "Organik",   color: "#3FA34D" },
      { id: "anorganik", label: "Anorganik", color: "#2F80ED" },
      { id: "b3",        label: "B3",        color: "#E5484D" }
    ],
    items: [
      { id: "kulit-pisang", label: "Kulit pisang",   category: "organik",   explain: "Terurai alami dan bisa dijadikan kompos." },
      { id: "daun-kering",  label: "Daun kering",    category: "organik",   explain: "Bahan alami yang membusuk menjadi kompos." },
      { id: "sisa-nasi",    label: "Sisa nasi",      category: "organik",   explain: "Sisa makanan: cepat membusuk, bisa dikomposkan." },
      { id: "botol",        label: "Botol plastik",  category: "anorganik", explain: "Sulit terurai; bisa didaur ulang." },
      { id: "kaleng",       label: "Kaleng minuman", category: "anorganik", explain: "Logam yang bisa didaur ulang berulang kali." },
      { id: "kantong",      label: "Kantong plastik", category: "anorganik", explain: "Sangat lama terurai; kurangi pemakaiannya." },
      { id: "baterai",      label: "Baterai bekas",  category: "b3",        explain: "Mengandung logam berbahaya; jangan buang ke tempat sampah biasa." },
      { id: "lampu",        label: "Lampu neon bekas", category: "b3",      explain: "Mengandung merkuri; perlu penanganan khusus." },
      { id: "obat",         label: "Obat kedaluwarsa", category: "b3",      explain: "Bahan kimianya bisa mencemari tanah dan air." }
    ],
    target: { rotateAfterCorrect: 5, bias: 0.5 }
  },

  player: { x: 220, w: 44, h: 56, gravity: 2400, jumpVelocity: 900, lives: 3, invulnerableSec: 1.2 },
  world:  { groundY: 600, speed: 360, maxSpeed: 720, accel: 6 },

  spawner: {
    interval: [0.9, 1.5],
    table: [
      { type: "hazard", id: "batu",     w: 44, h: 48, weight: 3 },
      { type: "hazard", id: "genangan", w: 90, h: 24, weight: 2 },
      { type: "item", weight: 5, heights: ["ground", "mid", "high"] }
    ]
  },

  rules: {
    perSecond: 5,
    correct: { score: 50, sfx: "coin" },
    wrong:   { score: -20, sfx: "hit", showExplain: true },
    hazard:  { lives: -1, sfx: "hit", shake: 8 },
    combo:   { step: 5, max: 4 },
    difficulty: { everySec: 15, speed: 25 }
  }
});
// END_OF_MANIFEST
```

### CHECKLIST SEBELUM MENJAWAB

- Satu blok `js`, diakhiri `// END_OF_MANIFEST`, tanpa HTML atau penjelasan panjang.
- Hanya field dari cheat-sheet; satu `theme.preset`; semua `id` unik dan huruf kecil.
- Ukuran rintangan sesuai tabel kelayakan.
- Setiap `item.category` ada di `categories`; setiap kategori punya minimal 3 item.
- Semua `explain` benar secara ilmiah dan ≤120 huruf.

<!-- END PROMPT SESI 7 -->

---

## Lampiran B: Rencana evaluasi 20 percobaan

**Tujuan:** memutuskan apakah jalur manifest siap dipakai pengguna, dan memetakan kegagalan sebelum perbaikan berikutnya.

**Pengaturan (dibekukan selama evaluasi):** `reasoning_effort: "none"`, `max_tokens: 16384`, `temperature` tetap (catat nilainya), versi runtime dan versi prompt dicatat di setiap baris.

**Bahan uji (20 PRD):**
- 5 topik × 4 variasi. Topik: lingkungan, jaringan komputer/informatika, biologi, ekonomi, sejarah.
- Variasi: 2 variasi mudah (kategori jelas), 1 variasi dengan miskonsepsi eksplisit, 1 variasi arcade tanpa blok `learning`.
- Tambahkan 2 PRD "jebakan" yang meminta mekanik yang belum didukung (mis. urutan token atau lompat ganda) untuk menguji kepatuhan pada BATAS FITUR.
- PRD dihasilkan lewat alur Sesi 1-6 yang sebenarnya, bukan ditulis tangan, supaya mencerminkan pemakaian nyata.

**Data yang dicatat per percobaan:** id PRD, `finish_reason`, `completion_tokens`, durasi, hasil ekstraktor, galat dan peringatan validator, hasil `selfTest` per pemeriksaan, jumlah baris hook, field di luar cheat-sheet yang muncul, dan hasil perbaikan otomatis (bila ada).

| Metrik | Ambang lulus |
|---|---|
| `finish_reason: "stop"` | ≥ 90% |
| Manifest terekstrak dan `isPlayable` | ≥ 95% |
| Lolos validator pada percobaan pertama | ≥ 85% |
| `selfTest` lolos pada percobaan pertama | ≥ 90% |
| Lolos setelah satu perbaikan otomatis | ≥ 98% |
| Durasi median | < 20 dtk (perkiraan wajar: 12-25 dtk) |
| `completion_tokens` median | < 4.000 |
| Penggunaan field di luar cheat-sheet | < 5% |
| PRD jebakan ditangani dengan benar (tidak membuat mekanik yang tidak ada, ada `// CATATAN`) | 2 dari 2 |

**Penilaian manual (dosen atau pengajar):**
- **Akurasi konten:** setiap `explain` dan klasifikasi item diperiksa. Target ≥ 95% item benar, dan **tidak ada** item yang salah pada game yang akan dibagikan.
- **Uji intrinsik:** apakah konsep benar-benar dipelajari lewat mekanik (bukan sekadar kuis)? Tandai lulus atau gagal per game.
- **Uji main nyata (5 game terbaik × 3 orang):** apakah rintangan terasa adil, apakah target dan umpan balik jelas, apakah ada frustrasi yang tidak wajar. Hasil ini juga dipakai untuk mengkalibrasi jendela waktu 120 ms di validator.

**Keputusan:**
- **Lanjut** bila semua metrik tercapai.
- **Perbaiki prompt** bila kegagalan terpusat di satu jenis (mis. ukuran rintangan, field di luar cheat-sheet).
- **Perbaiki runtime** bila validator terlalu sering menolak atau `selfTest` gagal pada manifest yang tampak wajar.
- Ulangi 20 percobaan setelah perubahan besar pada prompt atau runtime.

---

## Lampiran C: Perbaikan integrasi Studio (dari uji templat PreviewPanel)

Diuji di Chromium dengan templat iframe persis seperti potongan kode `PreviewPanel.tsx` yang dikirim agen (runtime + manifest contoh, `sandbox="allow-scripts allow-pointer-lock allow-modals"`).

| # | Temuan | Hasil uji | Perbaikan |
|---|---|---|---|
| 1 | `</script>` di dalam teks manifest memutus halaman | Game gagal terpasang, dan markup `<b id=pwn>` masuk ke DOM iframe | Escape saat menyisipkan kode (lihat bawah) |
| 2 | Manifest yang melempar error tidak dilaporkan | Layar kosong, 0 pesan ke Studio | Jembatan error (lihat bawah) |
| 3 | `selfTest` tidak pernah berjalan di preview | 0 pesan `aisys:selftest` dalam 1,8 dtk (`?selftest=1` tidak ada di `srcdoc`) | Panggil `AISYS.selfTest(...)` setelah manifest termuat |
| 4 | `App.tsx` membaca `e.data.passed`, padahal runtime mengirim `ok` | Log Studio akan selalu menampilkan "Gagal ❌" (dari pembacaan kode) | Pakai `e.data.ok` |
| 5 | `handleMessage` tidak memeriksa `e.source` | Iframe lain yang tidak terkait memicu handler ekspor | Periksa sumber pesan dan batasi laju |
| 6 | Atribut sandbox lebih luas dari yang perlu | `allow-modals` dan `allow-pointer-lock` tidak dibutuhkan game | Hapus, sisakan `allow-scripts` |

Rasio kanvas 16:9 terjaga di iframe lanskap maupun potret (900×520 → 900×506, 420×760 → 420×236, 1000×300 → 533×300), jadi `object-fit` tidak mendistorsi.

**1) Escape saat menyisipkan ke `<script>`:**

```ts
const escapeInline = (s: string) =>
  s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
// gunakan untuk aisysRuntimeSource dan playableCode.code
```

**2) Jembatan error (letakkan sebagai `<script>` pertama di `<head>`):**

```html
<script>
  addEventListener('error', function (e) {
    parent.postMessage({ type: 'aisys:error', message: String(e.message).slice(0, 300), line: e.lineno }, '*');
  });
  addEventListener('unhandledrejection', function (e) {
    parent.postMessage({ type: 'aisys:error', message: String(e.reason).slice(0, 300) }, '*');
  });
</script>
```

**3) Jalankan selfTest setelah manifest** (gunakan objek manifest asli, jangan `JSON.parse(JSON.stringify(...))`, supaya hook ikut diuji):

```html
<script>
  setTimeout(function () {
    try { if (window.__AISYS_GAME__) AISYS.selfTest(window.__AISYS_GAME__.rawManifest); }
    catch (err) { parent.postMessage({ type: 'aisys:error', message: String(err).slice(0, 300) }, '*'); }
  }, 0);
</script>
```

**4-5) Penguatan `handleMessage` di `App.tsx`:**

```ts
if (e.source !== iframeRef.current?.contentWindow) return;   // iframeRef perlu dibagikan ke App
const passed = e.data.ok ?? e.data.passed;
// untuk aisys:export: izinkan paling banyak 1 unduhan per 2 detik
const safeId = String(e.data.gameId || 'game').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40);
a.download = `aisys-analytics-${safeId}.json`;
```

Catatan: manifest (termasuk hook) adalah kode buatan model yang berjalan di dalam iframe dan dapat memanggil `parent.postMessage`. Karena itu pemeriksaan sumber dan pembatasan laju penting walau iframe sudah di-sandbox. Pesan error dan log sebaiknya juga dikirim ke alur perbaikan otomatis.
