# AISYS Contract: Endless-Runner Kit (Schema 1)

## 0. Prinsip Kontrak
1. **Model Hanya Menulis Data:** Fisika, spawner, tabrakan (AABB), penghitungan skor, HUD, menu utama, game over, dan analitik pembelajaran adalah tanggung jawab runtime engine. Hook kode bersifat opsional, dengan batasan ketat maksimal sekitar 40 baris.
2. **Ruang Koordinat Logis:** Sistem kanvas menggunakan resolusi logis tetap **1280×720 (rasio 16:9)**. Runtime engine yang menangani penskalaan resolusi layar, *letterboxing*, dan *Device Pixel Ratio* (DPR).
3. **Validator di Runtime:**
   - Field yang tidak dikenal diabaikan **tanpa peringatan**.
   - Nilai angka di luar rentang pada `player`, `world`, `spawner`, dan `learning.target` di-*clamp* dan dicatat di `validation.warnings`.
   - Field wajib yang hilang atau salah membuat manifest tidak valid: kanvas menampilkan layar "AISYS Engine: Manifest Error" berisi daftar error, dan `selfTest` mengirim `aisys:selftest` dengan `ok: false` serta pemeriksaan `validate` gagal (detail berisi pesan error).
   - Studio hanya menampilkan hasil `selfTest` (termasuk detail pemeriksaan yang gagal) dan `aisys:error`. `validation.warnings` belum dikirim ke Studio.
4. **Field Wajib:** `schema`, `kit`, `id`, `title`. Blok `learning` bersifat opsional; jika ditiadakan, game otomatis berjalan sebagai *arcade endless runner* klasik dengan item koin generik.

---

## 1. Spesifikasi Manifest Lengkap (Acuan: EcoSort Run, ~55 Baris)

```javascript
AISYS.defineGame({
  schema: 1, 
  kit: "endless-runner",
  id: "ecosort-run", 
  title: "EcoSort Run", 
  seed: "ecosort-01",
  theme: { preset: "clean-modern" }, // Opsi: clean-modern | neon | cartoon | retro-pixel

  learning: {
    subject: "Lingkungan Hidup",
    concept: "Pemilahan sampah organik, anorganik, dan B3",
    objectives: ["Mengelompokkan sampah berdasarkan sifatnya"],
    misconceptions: ["Baterai bekas dianggap sampah anorganik biasa"],
    mode: "category", // v0.1: "category" | v0.2 (cadangan): "sequence"
    categories: [
      { id: "organik",   label: "Organik",   color: "#3FA34D" },
      { id: "anorganik", label: "Anorganik", color: "#2F80ED" },
      { id: "b3",        label: "B3",        color: "#E5484D" }
    ],
    items: [
      { id: "kulit-pisang", label: "Kulit pisang",  category: "organik",   explain: "Terurai alami, bisa jadi kompos." },
      { id: "botol",        label: "Botol plastik", category: "anorganik", explain: "Sulit terurai, didaur ulang." },
      { id: "baterai",      label: "Baterai bekas", category: "b3",        explain: "Mengandung logam berbahaya." }
    ],
    target: { rotateAfterCorrect: 5, bias: 0.5 } // bias: proporsi item yang cocok dengan target aktif
  },

  player: { 
    x: 220, 
    w: 44, 
    h: 56, 
    gravity: 2400, 
    jumpVelocity: 900, 
    lives: 3, 
    invulnerableSec: 1.2 
  },

  world: { 
    groundY: 600, 
    speed: 360, 
    maxSpeed: 720, 
    accel: 6, 
    layers: ["clouds", "hills"] 
  },

  spawner: {
    interval: [0.9, 1.5], // Rentang detik; runtime akan menaikkannya jika melanggar jarak adil
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
    combo:   { step: 5, max: 4 }, // Pengali skor naik setiap 5 benar beruntun
    difficulty: { everySec: 15, speed: 25 }
  },

  hud: ["score", "lives", "combo", "target"], // Opsional; tombol mute selalu tampil
  hooks: {} // Opsional, maksimal 40 baris
});
```

---

## 2. Referensi Field (Rentang, Default, & Perilaku)

1. **`player`:**
   * `x`: 80–600 (default: `220`).
   * `w`, `h`: 20–120 (default: `44, 56`).
   * `gravity`: 800–4000 (default: `2400`).
   * `jumpVelocity`: 400–1400 (default: `900`).
   * `lives`: 1–9 (default: `3`).
   * `invulnerableSec`: 0–3.0 (default: `1.2`).
   * *Catatan:* Hanya mendukung *single jump* pada v0.1 (tanpa double jump atau slide).
2. **`world`:**
   * `groundY`: 400–680 (default: `600`).
   * `speed`: 150–600 (default: `360`).
   * `maxSpeed`: $\ge$ speed, maksimal 1200 (default: `720`).
   * `accel`: 0–30 (default: `6`).
   * `layers`: array layer latar belakang, hanya `clouds` dan `hills` (default: keduanya). Nilai lain diabaikan tanpa peringatan; array kosong dianggap default.
3. **`spawner.table`:**
   * `hazard`: `id`, `w` (20–140), `h` (16–110), `weight`. Runtime membatasi `h` agar selalu dapat dilompati.
   * `item`: `weight`, `heights` (`ground` | `mid` | `high`). Item mengambil data dari `learning.items`, atau otomatis menjadi koin generik bila `learning` tidak didefinisikan.
4. **`rules`:**
   * `perSecond` (default `5`), `correct: { score, sfx }`, `wrong: { score, sfx, showExplain }`, `hazard: { lives, sfx, shake }`, `combo: { step, max }`, `difficulty: { everySec, speed }`.
   * Nilai `hazard.lives` negatif mengurangi nyawa. Item salah selalu mereset kombo.
   * `correct.combo`, `wrong.combo`, dan `wrong.lives` **tidak dipakai runtime** (dihapus dari kontrak).
   * `sfx`: synthesizer audio internal (`coin`, `hit`, `jump`, `laser`, `boom`).
   * `shake`: intensitas guncangan layar (0–20).
   * `difficulty`: menambah kecepatan sebesar `speed` setiap `everySec` detik.
5. **`learning.target`:**
   * `rotateAfterCorrect`: 2–15 (ganti kategori target setelah N item benar terkumpul).
   * `bias`: 0.2–0.8 (probabilitas item target muncul di jalur spawner).
   * Pergantian target dilakukan secara seeded, ditampilkan di HUD, dan diumumkan lewat toast notifikasi.
   * Panjang teks dipotong runtime: item `label` ≤32, `explain` ≤120, kategori `label` ≤24 karakter. Toast "Salah!" menampilkan label + `explain` utuh (batas toast 200 karakter, kotak menyesuaikan jumlah baris).
   * Teks runtime bersifat generik (tidak terikat topik): toast target "🎯 TARGET BARU: Kumpulkan {label kategori}!", ringkasan Game Over "Item Dipungut: N | Akurasi: X%".
6. **`theme.preset`:** `clean-modern` (bawaan) | `neon` | `cartoon` | `retro-pixel`. Nilai lain diganti `clean-modern` dengan peringatan. Preset menentukan warna, font, dan gaya gambar pemain.
7. **`theme.palette`** (opsional, **khusus pengembang; tidak dimasukkan ke prompt model**): override per kunci di atas preset. Belum divalidasi runtime (nilai salah tipe dapat merusak tampilan).

   | Kunci | Tipe | Dipakai untuk |
   |---|---|---|
   | `font` | nama font CSS (mis. `"monospace"`) | Teks HUD, menu, toast, dan game over (layar error tetap `sans-serif`/`monospace`) |
   | `bg` | array 2–3 warna (bukan array → bawaan) | Gradien langit vertikal (atas → bawah) |
   | `cloudColor` | warna | Layer `clouds` |
   | `hillColor` | warna | Layer `hills` |
   | `ground` | array 4 warna | Gradien tanah |
   | `groundLine` | warna | Garis tepi tanah |
   | `player` | array 2 warna | Gradien badan pemain |
   | `playerBorder` | warna atau `null` | Outline pemain |
   | `hazard` | array 2 warna | Gradien rintangan |
   | `hudBg` | warna | Latar panel HUD |
   | `hudBorder` | warna atau `null` | Tepi panel HUD |
   | `accent` | warna | Aksen (fallback warna target) |
   | `hudText` | warna | **Belum dipakai render.** Teks skor (`#fbbf24`) dan ikon mute (`#ffffff`) masih warna tetap |

   `playerStyle` (`rounded` / `glow` / `cartoon` / `pixel`) mengikuti preset dan tidak bisa di-override.
8. **`hud`:** array elemen yang tampil: `score`, `lives`, `combo` (muncul saat kombo ≥ 2), `target` (default: semuanya). Tombol mute dan watermark selalu tampil.

---

## 3. Jaminan Matematis & Fair-Play Runtime Engine

Runtime menjamin game selalu adil (*fair*) dan dapat dimainkan tanpa perlu dihitung manual oleh model:
* **Tinggi Lompatan Maksimal:**
  $$H = \frac{v^2}{2g}$$
  *(Contoh: $900^2 / (2 \times 2400) \approx 168.75\text{ px}$)*.
  * Validator otomatis menolak tinggi rintangan (*hazard*) di atas $0.6 \times H$ (~100 px).
  * Validator menolak manifest bila $H < 27$ px.
  * Ketinggian item (di atas posisi `ground`): `mid` = $0.45H$, `high` = $\min(0.85H,\ H - 20)$.
* **Kelayakan per rintangan** (dihitung pada `world.speed`, kecepatan paling lambat = kasus terburuk):
  $$t_{above} = \frac{2\sqrt{v^2 - 2gh}}{g}, \qquad t_{req} = \frac{w_{hazard} + w_{player}}{\text{world.speed}} + 0.12$$
  Bila $t_{above} < t_{req}$, lebar di-clamp ke $\lfloor (t_{above} - 0.12)\cdot\text{speed} - w_{player} \rfloor$ jika hasilnya ≥ 20 px; selain itu manifest ditolak dengan pesan diagnostik.
* **Waktu di Udara (*Hang Time*):**
  $$T = \frac{2v}{g}$$
  *(Contoh: $(2 \times 900) / 2400 = 0.75\text{ detik}$)*.
* **Jarak Aman Antar Hazard (*Fair Gap*),** dihitung terhadap kecepatan saat spawn:
  $$\text{Gap Minimum} \ge \text{speed} \times (T + 0.22) \times 1.15 + 160\text{ px}$$
  Interval spawner dari manifest tidak dapat melanggar batas jarak aman ini (spawn hazard ditunda). Batas bawah interval: `[0.4, 0.6]` detik.
* **Analitik Pembelajaran Otomatis:**
  * Setiap pungutan dicatat oleh engine (`track('collect', item.id, isCorrect)`) dan dikirim ke Studio sebagai `aisys:track`.
  * `byCategory` mencatat hasil terhadap **kategori target** saat itu; untuk miskonsepsi gunakan `mistakes` (item, kategorinya, target saat salah, `explain`).
  * Layar Game Over menampilkan total item, akurasi, dan hingga 4 item yang keliru (label, label kategori, `explain`; dibungkus agar tetap di dalam kartu).
  * Analitik berlaku per ronde: restart (Spasi/ketuk di layar Game Over, atau tombol R) mereset seluruh `analytics`. Ekspor sebelum restart bila data ronde itu dibutuhkan.
  * Tombol "Ekspor Analitik (JSON)" di layar Game Over mengirim `aisys:export` berisi `gameId`, `title`, `score`, `distance`, `analytics`, `objectives`, `misconceptions`. Hanya berfungsi di dalam iframe Studio; di berkas `.html` yang dibuka langsung, tombol ini tidak melakukan apa pun.
* **Ketahanan Penyimpanan:**
  * Akses status `mute` dan skor terbaik (*high score*) dibungkus dalam blok `try/catch` dengan *in-memory fallback* agar tidak melempar `SecurityError` di sandbox iframe.

---

## 4. Antarmuka Objek Game untuk Hooks (Maksimal ~40 Baris)

Seluruh hook bersifat opsional dan otomatis dieksekusi dalam blok `try/catch`. `g` adalah objek engine itu sendiri; batasan baca/panggil di bawah adalah **aturan kontrak**, bukan dipaksakan runtime.
* **Boleh dibaca:**
  * `g.state` (`"menu"` | `"play"` | `"over"`), `g.time`, `g.distance`, `g.score`, `g.lives`, `g.combo`, `g.speed`.
  * `g.player`: `{ x, y, vy, onGround }`.
  * `g.targetCategory`: kategori target aktif (`{ id, label, color }`).
  * `g.rng()`: fungsi acak ter-seed (*seeded deterministic random*).
* **Boleh dipanggil:** `g.showToast(teks, detik)` (teks dipotong 200 karakter; toast dihapus saat Game Over) dan `g.audio.play(sfx)`.
* **Dilarang:** mengubah `g.score`, `g.lives`, atau `g.speed` secara langsung. Tidak ada `g.addScore`, `g.loseLife`, `g.say`, `g.fx.*`, `drawPlayer`, atau `drawEntity` (keputusan v0.1).
* **Daftar Hook yang Tersedia (6):**
  * `onStart(g)`
  * `onJump(g)`
  * `onTick(g, dt)`
  * `onCollect(g, ent, isCorrect)`: `ent.data` berisi item belajar (`id`, `label`, `category`, `explain`)
  * `onHit(g, ent)`: `ent` adalah rintangan yang ditabrak
  * `onGameOver(g, analytics)`
* *Catatan:* Hook yang melempar exception dihitung dan menggagalkan pemeriksaan `hooks` pada selfTest.

---

## 5. Spesifikasi `AISYS.selfTest()` (Deterministic Headless Smoke Test)

Runtime menyediakan metode `step(dt)` simulasi tanpa render, sehingga pengujian berjalan dalam hitungan milidetik secara deterministik berdasar seed:

1. **`validate`:** Manifest lolos validator skema tanpa error fatal.
2. **`render`:** Sampel piksel kanvas luar layar berisi cukup banyak warna berbeda (kanvas tidak blank). Di Node pemeriksaan ini berstatus `skipped`, bukan lulus.
3. **`jump`:** Input lompat tiruan berhasil mengubah posisi $y$, kecepatan $v_y$ berbalik arah, dan mendarat kembali di tanah dalam waktu $\le T + \text{toleransi}$.
4. **`progress`:** Nilai jarak (`distance`) dan skor bertambah setelah disimulasikan selama 10 detik.
5. **`spawn`:** Setiap tipe entitas pada `spawner.table` muncul minimal 1 kali dalam 30 detik simulasi.
6. **`numerik`:** Tidak ada nilai `NaN` atau `Infinity` pada variabel state pemain, dunia, dan skor.
7. **`bot adil`:** Bot yang memusatkan lompatan pada tengah rintangan (takeoff ±50 ms), 3 seed, pada `world.speed` dan `maxSpeed`, harus mencapai **nol tabrakan**.
8. **`hooks`:** Jumlah error eksepsi pada hook adalah 0.
9. **`belajar`:** Minimal satu item benar dan satu item salah berhasil dipungut dan tercatat pada tracker.

Hasil self-test dikirimkan ke Studio via:
```javascript
window.parent.postMessage({
  type: 'aisys:selftest',
  ok: boolean,
  checks: [{ id: string, pass: boolean, detail: string, status: 'pass' | 'fail' | 'skipped' }],
  metrics: { distance: number, score: number } // {} bila validate gagal
}, '*');
```

Mesin simulasi selfTest berjalan `headless` dan `silent` (tanpa audio dan tanpa `aisys:track`). Di preview Studio, selfTest dijalankan otomatis setelah engine terpasang; di luar Studio jalankan `AISYS.selfTest(manifest)` atau tambahkan `?selftest=1` ke URL.

---

## 6. Ruang Lingkup v0.1 vs Masa Depan

* **Didukung di v0.1:**
  * Modus klasifikasi edukasi (`learning.mode: "category"`).
  * Single jump, obstacle avoidance, item collection.
  * Ikon vektor terkurasi: Heart, Coin, Sound/Mute, Gamepad.
  * Automated Smoke Test deterministik & Fair-Gap math.
* **Dicadangkan untuk v0.2+ (YAGNI):**
  * Modus sekuensial (`learning.mode: "sequence"` ala Syntax Surfer).
  * Double jump, sliding/menunduk, hazard udara melayang, multi-lane switching.
  * Modul fisika eksternal (Verlet physics, Grid matrix, Waypoint pathfinding).
