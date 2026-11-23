# Product Requirements Document (PRD)
**Nama Produk:** AISYS Game Studio (HTML5 AI Game Builder)  
**Versi:** 1.0  
**Target Tech Stack:** Vite + React (TypeScript), Tailwind CSS, Lucide Icons, DeepSeek API (`deepseek-flash` / `deepseek-v4-flash`)  

---

## 1. Tujuan & Gambaran Produk
Membangun antarmuka web interaktif berbasis AI (*split-screen workspace* ala Claude Artifacts / Gemini Canvas) yang memandu pengguna merancang, menghasilkan (*generate*), menguji coba secara langsung (*live preview*), dan mengunduh game berbasis web **HTML5/CSS3/Vanilla JS dalam satu file mandiri (`single-file`)** yang dapat dijalankan tanpa server (`file://`).

Aplikasi ini bertindak sebagai *wrapper* cerdas di atas API DeepSeek, di mana instruksi khusus (*Skill / System Prompt*) ditanamkan secara persisten di lapisan sistem.

---

## 2. Pengguna & Mode Operasional
* **Target Pengguna:** Dosen, mahasiswa (DKV / Informatika STIKOM Yos Sudarso), maupun kreator umum yang ingin membuat prototipe game HTML5 dengan cepat.
* **Model Autentikasi & API (BYOK - Bring Your Own Key):**
  * Pengguna memasukkan **DeepSeek API Key** mereka sendiri pada modal *Settings* (disimpan secara lokal di `localStorage` browser).
  * Tersedia opsi *Default / Institutional Key* (opsional via `.env` jika dijalankan melalui proxy backend Node.js untuk demo kelas/workshop).

---

## 3. Spesifikasi Fungsional (Core Features)

### 3.1. Manajemen Skill & System Prompt (`Skill Engine`)
* **Persistent System Injection:** Setiap sesi percakapan otomatis menyisipkan `system_prompt` khusus pembuat game HTML5 di indeks pertama array `messages`.
* **Skill Editor Drawer (Admin/Power User):** Panel tersembunyi/modal agar pengguna dapat menempelkan (*paste*), menyunting, atau memperbarui teks instruksi *skill* (`aisys-html5-game-builder`) kapan saja tanpa perlu *rebuild* kode aplikasi.

### 3.2. Panel Kiri: Interactive Chat & Discovery (`Chat Workspace`)
* **First-Turn Sapaan Otomatis:** Saat pengguna pertama kali membuka Studio, AI langsung menyapa secara hangat sebagai *Senior Technical Game Designer & Mentor* dengan opsi pembuatan game hiburan/arcade maupun game edukasi materi kuliah/sekolah.
* **Jalur Khusus Game Edukasi (Alur Topik & Pilihan Arah Mekanik):** Pengguna dapat memasukkan materi pembelajaran, lalu AI merumuskan 2–3 opsi arah pengembangan mekanik game yang kreatif (Action/Arcade, Puzzle/Logika, atau Simulasi/Skenario) sebelum menyusun kode.
* **Percakapan Natural (Human-Like):** Mengeliminasi kuesioner kaku bertahap; diskusi mengalir santai 1 pertanyaan terarah per giliran.
* **Streaming Response (SSE):** Menampilkan respons teks secara *real-time* per token.
* **Smart Code Suppression di Chat:** Saat AI sedang menulis blok kode ` ```html ... ``` `, tampilan di gelembung chat diringkas menjadi indikator status progres yang rapi (misal: *"Sedang menulis kode game HTML5... (1.420 baris)"*) agar layar chat tidak penuh dengan *raw code*, sementara kode dialirkan ke panel kanan.
* **Quick Prompt Starters:** Kartu contoh ide cepat di layar awal (termasuk *Game Edukasi & Materi*, *Platformer Retro*, *Space Shooter*, *Puzzle Grid*) untuk memicu fase eksplorasi instan.
* **Iterative Refinement:** Pengguna dapat mengirim perintah revisi lanjutan, dan AI memperbarui kode game secara kontekstual.

### 3.3. Panel Kanan: Live Game Sandbox & Inspector (`Artifact Workspace`)
* **Real-Time HTML Extractor:** Parser otomatis yang menangkap konten di dalam tag ` ```html ` hingga ` ``` ` dari respons AI.
* **Zero-Server Live Preview (`<iframe>`):**
  * Merender kode game menggunakan atribut `srcdoc` dengan `sandbox="allow-scripts allow-pointer-lock allow-modals"` (tanpa `allow-same-origin` demi keamanan isolasi `localStorage` tempat API Key tersimpan).
  * Game langsung dapat dimainkan menggunakan keyboard maupun klik/sentuhan mouse di dalam panel kanan.
* **Viewport Switcher:** Tombol toggle untuk menguji tampilan dalam mode **Desktop (16:9 / Full)** dan **Mobile Portrait (375x667px)** guna memverifikasi responsivitas *touch controls*.
* **Code Viewer & Editor:** Tab untuk melihat/menyalin kode sumber HTML5 lengkap dengan *syntax highlighting*.
* **Version History (Session Undo/Redo):** Menyimpan riwayat setiap versi game yang dihasilkan dalam satu sesi percakapan (misal: `v1`, `v2`, `v3`) sehingga pengguna bisa kembali ke versi sebelumnya jika revisi AI merusak mekanik game.
* **One-Click Export:**
  * **Download `.html`:** Mengunduh file dengan nama otomatis sesuai judul game (misal: `tukang-bakso-adventure.html`), siap dibuka langsung di browser via protokol `file://`.
  * **Open in New Tab:** Membuka game menggunakan `Blob URL` di tab browser baru untuk pengujian layar penuh (*fullscreen*).

---

## 4. Arsitektur Integrasi API (SumoPod / DeepSeek)

### 4.1. Konfigurasi Endpoint & Model
* **Provider:** SumoPod AI Gateway (OpenAI-compatible format)
* **Base URL:** `https://ai.sumopod.com/v1/chat/completions` (dapat dikonfigurasi via menu Settings)
* **Pilihan Model (Hanya 2 Model):**
  1. **`deepseek-v4-flash` (Default):** Model utama untuk generasi kode game berkecepatan tinggi dengan kepatuhan instruksi optimal.
  2. **`deepseek-flash`:** Opsi alternatif/cadangan berbiaya ekonomis dan latensi rendah.
* **Parameter Payload:**
  ```json
  {
    "model": "deepseek-v4-flash",
    "messages": [
      { "role": "system", "content": "<ISI_INSTRUKSI_SKILL_DISINI>" },
      { "role": "user", "content": "..." }
    ],
    "stream": true,
    "temperature": 0.7,
    "max_tokens": 16384
  }
  ```

### 4.2. Alur Parsing Stream (Frontend Logic)
1. Baca `response.body.getReader()` menggunakan `TextDecoder`.
2. Akumulasi string `fullResponse`.
3. Deteksi pembuka blok kode ` ```html `.
   * Teks **sebelum** ` ```html ` dirender sebagai Markdown biasa di **Panel Kiri**.
   * Teks **di dalam** ` ```html ` dialirkan ke state `currentGameCode` di **Panel Kanan**.
4. Segera setelah tag penutup ` ``` ` terdeteksi (atau `stream` selesai), perbarui `iframe.srcdoc = currentGameCode` untuk merender game secara otomatis.

---

## 5. Panduan Desain UI/UX (Cloudflare Design System & Anti-AI-Slop Standard)

### 5.1. Filosofi Desain: Cloudflare Developer Experience
Mengadopsi estetika antarmuka **Cloudflare Dashboard (Workers/Pages Playground)** yang berorientasi *developer-first*, presisi, fungsional, dan bebas dari ornamen artifisial ("Anti-AI-Slop"):
* **Zero AI-Slop Manifesto:**
  * DILARANG menggunakan gradasi ungu-ke-pink mengambang (*blurry neon blobs/glow*), kartu melengkung berlebihan (*oversized rounded-3xl*), dan *drop shadow* tebal yang tidak fungsional.
  * Gunakan batas hairline `1px solid` yang tegas, sudut mikro fungsional (`rounded-md` / 6px), dan hierarki data yang padat (*compact information density*).
  * Aksen warna berkarakter: **Cloudflare Orange (`#F6821F` / `#FA8B28`)** digunakan secara disiplin untuk tombol aksi utama (*primary action*), status fokus, indikator aktif, dan aksen *badge*.

### 5.2. Palet Warna Mode Terang & Gelap (Dual-Theme Tokens)
Aplikasi mendukung peralihan instan **Light Mode** dan **Dark Mode** melalui tombol *theme toggle* di header:

| Elemen UI | Mode Terang (Cloudflare Light) | Mode Gelap (Cloudflare Dark) |
| :--- | :--- | :--- |
| **Canvas / Background Utama** | `#FFFFFF` (Pure White) | `#0B0C0E` (Charcoal Void) |
| **Panel & Surface Card** | `#F8FAFC` (Slate 50) / `#F1F5F9` | `#13151A` (Deep Slate) / `#1C1E24` |
| **Borders & Dividers** | `1px solid #E2E8F0` (Slate 200) | `1px solid #282B33` (Muted Zinc) |
| **Teks Primer** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) |
| **Teks Sekunder / Muted** | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) |
| **Brand Accent (Cloudflare)**| `#F6821F` (CF Orange) / hover `#E66E0A` | `#F6821F` / hover `#FA8B28` |
| **Status Ready / Online** | `#16A34A` (Green 600) | `#22C55E` (Green 500) |
| **Code Editor / Inspector** | `#F8FAFC` (Slate light mono) | `#0D0E11` (Jet Black mono) |

### 5.3. Layout & Header
* **Layout:** Split-screen horizontal (`40%` panel chat kiri, `60%` panel preview kanan) dengan *resizable divider* yang halus dan presisi.
* **Tipografi:** `Inter` / `Segoe UI` untuk antarmuka kontrol & chat, dan `JetBrains Mono` / `Fira Code` untuk blok kode, log, dan badge metadata.
* **Header Minimalis (Tinggi 48px):**
  * **Kiri:** Logo Cloudflare-style badge `AISYS` (aksen oranye) + nama aplikasi `Game Studio`.
  * **Tengah:** Pill status model monospaced (`● deepseek-v4-flash • 1.0M Context`).
  * **Kanan:**
    * Tombol **Light / Dark Mode Toggle** (Sun/Moon icon).
    * Tombol **New Chat** (shortcut `Ctrl+K`).
    * Tombol **Skill Editor** (ikon Sliders).
    * Tombol **Settings & API Key** (ikon Key).

---

## 6. Struktur Direktori Proyek (Vite + React)
```text
aisys-game-studio/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Top bar (Model badge, Skill modal trigger, API Key)
│   │   ├── ChatPanel.tsx        # Panel kiri (Message list, Markdown renderer, Input box)
│   │   ├── PreviewPanel.tsx     # Panel kanan (Iframe sandbox, Toolbar, Code viewer)
│   │   ├── SkillModal.tsx       # Modal untuk paste/edit System Prompt (Skill)
│   │   └── SettingsModal.tsx    # Modal konfigurasi DeepSeek API Key & Model ID
│   ├── config/
│   │   └── defaultSkill.ts      # Placeholder konstanta untuk instruksi skill Anda
│   ├── utils/
│   │   ├── deepseekStream.ts    # Handler fetch SSE & token parser
│   │   └── htmlExtractor.ts     # Pemisah teks chat vs blok kode ```html
│   ├── App.tsx                  # State management utama (messages, versions, activeCode)
│   └── main.tsx
├── package.json
└── tailwind.config.js
```

---

## 7. Tahapan Pengembangan (Phased Execution)
1. **Fase 1 (Core UI & Layout):** Setup proyek Vite + React + Tailwind, bangun *split-screen layout* responsif, header, dan modal pengaturan API Key serta *Skill Editor*.
2. **Fase 2 (DeepSeek Streaming & Parser):** Implementasi `deepseekStream.ts` dan `htmlExtractor.ts` agar percakapan mengalir mulus dan kode HTML langsung masuk ke state preview tanpa mengotori ruang chat.
3. **Fase 3 (Sandbox & Export):** Integrasi `<iframe>` dengan `srcdoc`, tombol *Restart Game*, *Viewport Toggle* (Desktop/Mobile), *Version Switcher*, dan fitur *Download `.html`*.
4. **Fase 4 (Inject Skill & Uji Coba):** Memasukkan instruksi skill lengkap milik Mas Dhany ke `defaultSkill.ts` dan menguji generasi berbagai genre game (memastikan Web Audio API, kontrol sentuh, dan aset logo berjalan normal di dalam sandbox `iframe`).