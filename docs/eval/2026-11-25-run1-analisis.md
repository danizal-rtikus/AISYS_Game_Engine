# Evaluasi model run1 (25 Nov 2026): analisis

Data mentah: `scripts/eval/results/run1/` (`results.jsonl`, transkrip lengkap per percobaan, `report.md` hasil `summarize.mjs`).
Cara mengulang: `node scripts/eval/run-eval.mjs --model deepseek-v4-flash --out scripts/eval/results/<nama>` lalu `node scripts/eval/summarize.mjs scripts/eval/results/<nama>`.

## Pengaturan

| Hal | Nilai |
|---|---|
| Model | `deepseek-v4-flash` (catatan: Studio saat ini memakai `deepseek-flash`, karena migrasi `storage.ts` mengganti `deepseek-v4-flash`) |
| Parameter | `temperature 0.4`, `max_tokens 32768`, `reasoning_effort "none"`, tanpa streaming. Sama dengan Studio kecuali streaming. Lampiran B menyebut `max_tokens 16384`; dipakai nilai Studio karena itu yang dialami pengguna |
| Prompt / runtime | v2.0 / v0.1.0 |
| Percobaan | 22 = 5 topik × 4 variasi + 2 jebakan; satu kali jalan per PRD (bukan rata-rata beberapa seed) |
| Jawaban pengguna | Disimulasikan per sesi (lihat `scripts/eval/trials.json`). PRD tetap disusun model lewat Sesi 1-6 |
| selfTest | Node (8 pemeriksaan, `render` dilewati) **dan** Chromium (9/9 termasuk `render`) |

## Ringkasan metrik (Lampiran B)

| Metrik | Hasil | Ambang | Lulus |
|---|---|---|---|
| `finish_reason: "stop"` | 22/22 | ≥ 90% | ✅ |
| Manifest terekstrak dan `isPlayable` | 22/22 | ≥ 95% | ✅ |
| Lolos validator, percobaan pertama | 22/22, **0 peringatan clamp** | ≥ 85% | ✅ |
| selfTest lolos, percobaan pertama | 22/22 (Node 8/8; Chromium 9/9 termasuk `render`) | ≥ 90% | ✅ |
| Lolos setelah ≤ 1 perbaikan otomatis | 22/22 (perbaikan tidak pernah dipicu) | ≥ 98% | ✅ |
| Durasi median giliran manifest | 11,4 dtk (rentang 5,9-17,2) | < 20 dtk | ✅ |
| `completion_tokens` median giliran manifest | 1.004 (arcade ±480) | < 4.000 | ✅ |
| Field di luar cheat-sheet | 0/22 | < 5% | ✅ |
| PRD jebakan, definisi ketat (ada `// CATATAN`) | 1/2 | 2/2 | ❌ (lihat bawah) |

Tambahan: preset tema 22/22 sesuai pilihan, nilai tingkat kesulitan 22/22 sesuai pemetaan Sesi 4, 0 hook, teks di luar blok kode 2-4 kalimat, penalaran 0 karakter di semua giliran. Satu percobaan (`info-mudah-2`) butuh satu dorongan "Lanjut" tambahan karena model menulis ringkasan dulu lalu PRD setelah "Lanjut" pertama.

Biaya seluruh run: 987.898 token input, 56.619 token output (±45 ribu input per percakapan, didominasi system prompt ±5 ribu token yang dikirim ulang setiap giliran; kandidat prompt caching).

## Jebakan

- **`trap-sequence`** (urutan langkah bubble sort): model menjelaskan di Sesi 1 bahwa mekanik urutan belum ada, memetakan ke kategori tahapan (Perbandingan, Penukaran, Lanjut), dan manifest diawali `// CATATAN`. Benar.
- **`trap-doublejump`** (lompat ganda + power-up perisai): model menolak **di percakapan Sesi 2** ("belum tersedia… alternatif terdekat: nyawa dan kebal sesaat"), sehingga PRD dan manifest tidak memuat fitur itu dan tidak ada `// CATATAN`. Secara perilaku ini benar (pengguna diberi tahu, tidak ada mekanik palsu). Gagal hanya menurut definisi metrik yang mewajibkan `// CATATAN`; prompt sendiri hanya mewajibkan CATATAN bila **PRD** meminta fitur tersebut. **Usul:** ubah definisi metrik menjadi "tidak ada mekanik/field yang tidak didukung, dan pengguna diberi tahu (di chat atau lewat `// CATATAN`)". Dengan definisi itu hasilnya 2/2.

## Pelanggaran aturan prompt

- **Jumlah item di bawah 8** (aturan: 8-16 item total): `eko-misk` 7 item, `trap-doublejump` 6 item. Minimal 3 item per kategori tetap terpenuhi di semua percobaan.
- **Konten contoh disalin:** `ling-mudah-1` (topik sama dengan contoh di prompt) menyalin 9 item contoh EcoSort apa adanya; `ling-misk` dan `trap-doublejump` memakai ulang sebagian. Ukuran rintangan di hampir semua percobaan menyalin contoh (44×48, 90×24). Tidak salah, tetapi variasi rendah.

## Tinjauan konten awal (bukan pengganti tinjauan dosen)

Saya membaca semua 155 item dari 17 game bermateri belajar. Item berikut **perlu diputuskan dosen**; sisanya tampak benar untuk tingkat sekolah, tetapi tetap belum diverifikasi ahli. Daftar lengkap ada di `scripts/eval/results/run1/report.md` bagian "Konten belajar".

| Percobaan | Item | Masalah |
|---|---|---|
| `sej-mudah-2` | Fatmawati → "Proklamator" | **Salah.** Proklamator hanya Soekarno dan Hatta; Fatmawati menjahit bendera pusaka |
| `sej-mudah-2` | BM Diah → "Perumus Naskah" | **Kemungkinan salah.** BM Diah menyimpan konsep naskah, bukan perumus (perumus: Soekarno, Hatta, Achmad Soebardjo) |
| `sej-mudah-2` | Sayuti Melik → "Perumus Naskah" | Meragukan: ia mengetik naskah, bukan merumuskan |
| `ling-misk` | Kertas koran → "Anorganik Daur Ulang" | **Tidak konsisten:** kertas adalah bahan organik; label kategori menyiratkan anorganik |
| `info-mudah-2` | Gateway → "Network" | Meragukan: `explain` mendefinisikan gateway penerjemah protokol, yang umumnya diajarkan di lapisan atas (hingga Application) |
| `info-mudah-2` | Switch (Data Link) dan Switch Layer-3 (Network) | Ambigu bagi pemain: dua item "switch" di kategori berbeda |
| `info-mudah-1` | Headset → "Output" | Ambigu: headset umumnya punya mikrofon (input dan output) |
| `bio-mudah-2` | Burung pelatuk → "Karnivora" | Meragukan: pemakan serangga, sebagian spesies juga makan buah/biji/getah (omnivora) |
| `eko-mudah-2` | Bor listrik → "Barang Modal" | Bergantung konteks: bor di rumah tangga adalah barang konsumsi |
| `eko-mudah-1` | Buku pelajaran → "Sekunder" | Bergantung buku acuan: sebagian materi menggolongkan pendidikan sebagai kebutuhan primer |
| `eko-misk` | Pajak Hotel, Pajak Restoran | Klasifikasi (daerah) benar, tetapi sejak UU HKPD 2022 keduanya digabung menjadi PBJT; istilah usang |
| `sej-mudah-1` | Samudera Pasai "kesultanan Islam pertama di Nusantara" | Umum diajarkan, tetapi diperdebatkan (Perlak sering disebut lebih awal) |

Ringkasnya: dari 17 game dengan materi belajar, **1 game (`sej-mudah-2`) memuat klasifikasi yang salah** dan 1 game (`ling-misk`) memuat label kategori yang tidak konsisten. Kriteria selesai fase ("nol game yang dibagikan memuat fakta edukasi yang salah") **belum** terpenuhi tanpa tinjauan manusia.

## Yang tidak diuji

- Studio sungguhan dengan streaming (harness memanggil API tanpa streaming; ekstraktor yang dipakai sama).
- Model `deepseek-flash` yang saat ini dipakai Studio.
- Variasi hasil antar-run (setiap PRD dijalankan sekali; temperature 0,4).
- Jawaban pengguna yang tidak terduga (jawaban disimulasikan, selalu sesuai pertanyaan).
- Uji main manusia, ponsel asli, dan audio.

## Keputusan (sesuai Lampiran B)

Semua metrik otomatis lulus kecuali jebakan menurut definisi ketat. Tidak ada kegagalan teknis yang terpusat, jadi **runtime tidak perlu diubah**. Perbaikan yang disarankan ada di sisi prompt dan proses konten:

1. Tegaskan di Sesi 2/6 bahwa nama kategori harus konsisten dengan sifat item, dan bahwa kategori berbasis tokoh/peran harus memakai definisi baku (mis. "Proklamator").
2. Tegaskan minimal 8 item total di PRD (Sesi 6), bukan hanya di Sesi 7.
3. Perbarui definisi metrik jebakan (lihat di atas).
4. Lanjut ke tinjauan konten oleh dosen dan uji main nyata (langkah 6 handoff), lalu uji ulang dengan `deepseek-flash` atau samakan model Studio dengan model yang dievaluasi.
