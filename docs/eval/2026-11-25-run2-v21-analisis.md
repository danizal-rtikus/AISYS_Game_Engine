# Evaluasi model run2 (25 Nov 2026): uji ulang prompt v2.1

Data mentah: `scripts/eval/results/run2-v21/` (`results.jsonl`, transkrip, `report.md`). Pengaturan sama dengan run1 (`deepseek-v4-flash`, `temperature 0.4`, `max_tokens 32768`, `reasoning_effort "none"`).

## Apa yang diuji

Prompt v2.1 menambah aturan di Sesi 2 (nama kategori sesuai sifat item, istilah baku memakai definisi baku, hindari item ambigu) dan mewajibkan total 8-16 item sejak PRD. Uji ulang memakai:

- 8 percobaan run1 yang bermasalah: `sej-mudah-2`, `ling-misk`, `info-mudah-2`, `info-mudah-1`, `bio-mudah-2`, `eko-mudah-2`, `eko-misk`, `trap-doublejump`.
- 2 percobaan **holdout** baru (`bio-holdout`, `eko-holdout`) dengan topik yang tidak dipakai sebagai contoh di aturan baru.

**Bias:** contoh di aturan v2.1 (Fatmawati, Switch Layer-3, headset, bor listrik, kertas) diambil dari kegagalan run1, jadi hasil 8 percobaan ulang lebih optimistis dari kenyataan. Holdout dipakai untuk mengurangi bias ini, tetapi hanya 2 percobaan.

## Metrik

| Metrik | run1 (8 yang sama) | run2 (10) |
|---|---|---|
| `finish_reason: "stop"` | 8/8 | 10/10 |
| Playable, percobaan pertama | 8/8 | **9/10** (lihat temuan 1) |
| Lolos validator dan selfTest, percobaan pertama | 8/8 | 9/10 |
| Lolos setelah ≤ 1 perbaikan otomatis | 8/8 | 10/10 |
| Total item 8-16 | 6/8 | **10/10** |
| Durasi / token median giliran manifest | — | 12,8 dtk / 987 |
| Field di luar cheat-sheet | 0 | 0 |
| Jebakan (`trap-doublejump`) | lolos (chat) | lolos (chat) |

## Temuan

1. **Model lupa menutup blok kode** (`ling-misk`): manifest lengkap (penanda `// END_OF_MANIFEST` ada, sintaks valid), tetapi tanpa ```` ``` ```` penutup. Ekstraktor menganggapnya masih streaming sehingga tidak playable; di Studio game ini akan tampil sebagai "kode terpotong". Perbaikan otomatis berhasil. **Sudah diperbaiki di ekstraktor:** kode tanpa pagar penutup diterima bila sudah playable (penanda akhir ada dan sintaks valid). Diuji: kasus ini lolos, 63 prefiks streaming dari respons yang sama tidak ada yang dianggap selesai terlalu awal, dan 7 kasus ekstraktor sebelumnya tidak berubah.
2. **Aturan 8-16 item bekerja:** 10/10 (run1: 2 percobaan di bawah 8).
3. **Kesalahan spesifik run1 hilang** (Fatmawati sebagai proklamator, headset, burung pelatuk, gateway, bor listrik ambigu, label "Anorganik Daur Ulang"), **tetapi kesalahan baru muncul di item lain:**

| Percobaan | Item | Masalah |
|---|---|---|
| `info-mudah-2` | Modem → "Network" | **Salah** menurut pengajaran umum OSI (modem: lapisan fisik) |
| `info-mudah-2` | Access Point → "Network" | **Salah** menurut pengajaran umum (AP: lapisan data link) |
| `sej-mudah-2` | "Soegondo Djojopoespito" dan "Sugondo Joyopuspito" | **Orang yang sama** muncul dua kali dengan ejaan berbeda |
| `sej-mudah-2` | WR Supratman → "Perumus Sumpah Pemuda" | **Salah**: pencipta lagu Indonesia Raya, bukan perumus |
| `sej-mudah-2` | Muhammad Yamin → "Panitia Sembilan" | Ambigu: `explain`-nya sendiri menyebut ia juga perumus Sumpah Pemuda (kategori lain di game yang sama) |
| `trap-doublejump` | Kertas koran → "Anorganik"; miskonsepsi "kertas dianggap organik" | **Diperdebatkan** dan bertentangan dengan contoh di prompt v2.1. Contoh itu sendiri kurang tepat karena golongan kertas memang diperdebatkan di materi sekolah. **Prompt v2.2** mengganti contohnya dengan kaleng aluminium dan melarang item yang golongannya diperdebatkan (v2.2 belum diuji ulang) |
| `eko-holdout` | "Membayar pajak" → konsumen; "Belanja barang dan jasa" → pemerintah | Ambigu: produsen juga membayar pajak; membeli barang juga kegiatan konsumen |
| `eko-misk` | Pajak Hotel, Pajak Restoran | Istilah usang sejak UU HKPD 2022 (kini PBJT), klasifikasi tetap benar |

`bio-holdout` (organ per sistem) tidak ditemukan masalah.

## Kesimpulan

- Aturan prompt memperbaiki **struktur** (jumlah item, konsistensi label) secara andal.
- Aturan prompt **tidak** menghilangkan **kesalahan fakta**: kesalahan berpindah ke item lain. Dari 9 game bermateri belajar di run2, 3 memuat item yang salah atau diperdebatkan (`info-mudah-2`, `sej-mudah-2`, `trap-doublejump`). Ini batas pengetahuan model, bukan masalah format.
- **Tinjauan dosen sebelum game dibagikan tetap wajib** (kriteria selesai fase). Karena konten sudah berupa data terpisah di manifest, langkah yang paling efektif berikutnya adalah alur tinjauan/koreksi konten oleh dosen di Studio (peta jalan bagian 13), bukan menambah aturan prompt.
- Topik sejarah tampak paling rawan: satu-satunya percobaan sejarah yang diuji ulang (`sej-mudah-2`) masih memuat kesalahan, dengan jenis kesalahan berbeda dari run1.
