# AISYS Contract: Endless-Runner Kit (Schema 1)

## 0. Prinsip Kontrak
1. **Model Hanya Menulis Data:** Fisika, spawner, tabrakan (AABB), penghitungan skor, HUD, menu utama, game over, dan analitik pembelajaran adalah tanggung jawab runtime engine. Hook kode bersifat opsional, dengan batasan ketat maksimal sekitar 40 baris.
2. **Ruang Koordinat Logis:** Sistem kanvas menggunakan resolusi logis tetap **1280×720 (rasio 16:9)**. Runtime engine yang menangani penskalaan resolusi layar, *letterboxing*, dan *Device Pixel Ratio* (DPR).
3. **Validator di Runtime:**
   - Field yang tidak dikenal akan memicu peringatan (*warning*) dan diabaikan.
   - Nilai di luar rentang akan di-*clamp* secara aman disertai peringatan di log.
   - Field wajib yang hilang akan memicu error fatal: menampilkan layar diagnostik error dan mengirimkan pesan `postMessage({ type: 'aisys:error' })`.
   - Seluruh peringatan dan status validator ditampilkan di tab Log Studio.
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
    correct: { score: 50, combo: 1, sfx: "coin" },
    wrong:   { score: -20, combo: "reset", lives: 0, sfx: "hit", showExplain: true },
    hazard:  { lives: -1, sfx: "hit", shake: 8 },
    combo:   { step: 5, max: 4 }, // Pengali skor naik setiap 5 benar beruntun
    difficulty: { everySec: 15, speed: 25 }
  },

  hud: ["score", "lives", "combo", "target"],
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
   * `maxSpeed`: $\ge$ speed (default: `720`).
   * `accel`: 0–30 (default: `6`).
   * `layers`: array layer latar belakang (`clouds` | `hills` | `stars` | `buildings`).
3. **`spawner.table`:**
   * `hazard`: `id`, `w` (20–140), `h` (16–110), `weight`. Runtime membatasi `h` agar selalu dapat dilompati.
   * `item`: `weight`, `heights` (`ground` | `mid` | `high`). Item mengambil data dari `learning.items`, atau otomatis menjadi koin generik bila `learning` tidak didefinisikan.
4. **`rules`:**
   * Nilai `lives` negatif akan mengurangi nyawa.
   * `combo: "reset"` menolkan akumulasi kombo.
   * `sfx`: synthesizer audio internal (`coin`, `hit`, `jump`, `laser`, `boom`).
   * `shake`: intensitas guncangan layar (0–20).
   * `difficulty`: menambah kecepatan sebesar `speed` setiap `everySec` detik.
5. **`learning.target`:**
   * `rotateAfterCorrect`: 2–15 (ganti kategori target setelah N item benar terkumpul).
   * `bias`: 0.3–0.8 (probabilitas item target muncul di jalur spawner).
   * Pergantian target dilakukan secara seeded, ditampilkan di HUD, dan diumumkan lewat toast notifikasi.
6. **`theme.preset`:**
   * Mengatur otomatis palet warna, gaya outline, dan font sistem. Override palet dimungkinkan via `theme.palette`.

---

## 3. Jaminan Matematis & Fair-Play Runtime Engine

Runtime menjamin game selalu adil (*fair*) dan dapat dimainkan tanpa perlu dihitung manual oleh model:
* **Tinggi Lompatan Maksimal:**
  $$H = \frac{v^2}{2g}$$
  *(Contoh: $900^2 / (2 \times 2400) \approx 168.75\text{ px}$)*.
  * Validator otomatis menolak tinggi rintangan (*hazard*) di atas $0.6 \times H$ (~100 px).
  * Validator membatasi ketinggian item `high` maksimum $0.9 \times H$ (~150 px).
* **Waktu di Udara (*Hang Time*):**
  $$T = \frac{2v}{g}$$
  *(Contoh: $(2 \times 900) / 2400 = 0.75\text{ detik}$)*.
* **Jarak Aman Antar Hazard (*Fair Gap*):**
  $$\text{Gap Minimum} \ge \text{speed} \times T \times 1.15 + \text{hazard.w}$$
  Interval spawner dari manifest tidak dapat melanggar batas jarak aman ini.
* **Aksesibilitas Item:** Item selalu terjangkau dan hazard tidak pernah menutup item `high` tanpa celah reaksi lompat.
* **Analitik Pembelajaran Otomatis:**
  * Setiap pungutan dicatat via `AISYS.track('collect', item.id, isCorrect)`.
  * Layar Game Over menampilkan akurasi per kategori dan daftar item yang keliru beserta penjelasannya (`explain`).
  * Tersedia tombol ekspor analitik dalam format JSON yang dikirimkan via `postMessage` ke Studio.
* **Ketahanan Penyimpanan:**
  * Akses status `mute` dan skor terbaik (*high score*) dibungkus dalam blok `try/catch` dengan *in-memory fallback* agar tidak melempar `SecurityError` di sandbox iframe.

---

## 4. Antarmuka Objek Game untuk Hooks (Maksimal ~40 Baris)

Seluruh hook bersifat opsional dan otomatis dieksekusi dalam blok `try/catch`:
* **State Baca (`g`):**
  * `g.state` (`"menu"` | `"play"` | `"over"`), `g.time`, `g.distance`, `g.score`, `g.lives`, `g.combo`, `g.speed`.
  * `g.player`: `{ x, y, vy, onGround }`.
  * `g.target`: kategori edukasi yang sedang aktif ditargetkan.
  * `g.rng()`: fungsi acak ter-seed (*seeded deterministic random*).
* **Aksi Bawaan:**
  * `g.addScore(n)`, `g.loseLife()`, `g.say(text)`.
  * `g.fx.shake(intensity, duration)`, `g.fx.burst(x, y, color, count)`.
  * `g.audio.play(type)`.
* **Daftar Hook yang Tersedia:**
  * `onStart(g)`
  * `onJump(g)`
  * `onCollect(g, item, isCorrect)`
  * `onHit(g, hazard)`
  * `onTick(g, dt)`
  * `onGameOver(g, summary)`
  * `drawPlayer(g, ctx, player)`
  * `drawEntity(g, ctx, entity)`
* *Catatan:* Hook yang melempar exception akan dicatat dan otomatis menggagalkan *Smoke Test*.

---

## 5. Spesifikasi `AISYS.selfTest()` (Deterministic Headless Smoke Test)

Runtime menyediakan metode `step(dt)` simulasi tanpa render, sehingga pengujian berjalan dalam hitungan milidetik secara deterministik berdasar seed:

1. **`validate`:** Manifest lolos validator skema tanpa error fatal.
2. **`render`:** Minimal $N$ frame tergambar dan sampel piksel kanvas berisi $\ge k$ warna berbeda (memastikan kanvas tidak blank/hitam pekat).
3. **`jump`:** Input lompat tiruan berhasil mengubah posisi $y$, kecepatan $v_y$ berbalik arah, dan mendarat kembali di tanah dalam waktu $\le T + \text{toleransi}$.
4. **`progress`:** Nilai jarak (`distance`) dan skor bertambah setelah disimulasikan selama 10 detik.
5. **`spawn`:** Setiap tipe entitas pada `spawner.table` muncul minimal 1 kali dalam 30 detik simulasi.
6. **`numerik`:** Tidak ada nilai `NaN` atau `Infinity` pada variabel state pemain, dunia, dan skor.
7. **`bot adil`:** Bot otomatis sederhana (melompat saat ada hazard di depannya) mampu bertahan $\ge 60$ detik simulasi dengan sisa nyawa $\ge 1$.
8. **`hooks`:** Jumlah error eksepsi pada hook adalah 0.
9. **`belajar`:** Minimal satu item benar dan satu item salah berhasil dipungut dan tercatat pada tracker.

Hasil self-test dikirimkan ke Studio via:
```javascript
window.parent.postMessage({
  type: 'aisys:selftest',
  ok: boolean,
  checks: [{ id: string, pass: boolean, detail: string }],
  metrics: { fps: number, simulatedSeconds: number }
}, '*');
```

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
