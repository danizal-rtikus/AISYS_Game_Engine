import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCode2,
  GraduationCap,
  Key,
  Loader2,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import aisysRuntimeRaw from '../runtime/aisys-runtime.js?raw';
import { DEMO_MANIFEST } from '../config/demoManifest';

interface LandingPageProps {
  onEnterStudio: (presetPrompt?: string) => void;
  onOpenAdminLogin: () => void;
  isAdmin: boolean;
  onOpenSkillModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

// ---------------------------------------------------------------- content

const RUNNER_PROMPT = 'Saya ingin membuat game Endless Runner.';

// Beta genres: the AI writes the full HTML game (prompt SESI 7B); no validator or automatic test yet
const BETA_GENRES = [
  { name: '2D Platformer', desc: 'Lompat presisi, platform, rintangan' },
  { name: 'Top-Down Shooter', desc: 'Gerak 8 arah, bidik, gelombang musuh' },
  { name: 'Puzzle Grid', desc: 'Papan ubin, cocokkan, reaksi berantai' },
  { name: 'Rhythm / Music', desc: 'Ketukan tempo, not jatuh, akurasi' },
  { name: 'Physics / Slingshot', desc: 'Ketapel, lintasan parabola, balok' },
  { name: 'Tower Defense', desc: 'Menara, jalur musuh, upgrade' },
  { name: 'Idle / Tycoon', desc: 'Sumber daya, generator, otomatisasi' },
  { name: 'Dungeon Crawler', desc: 'Labirin, kunci, musuh berpatroli' },
];

const FEATURES = [
  {
    icon: FileCode2,
    title: 'Satu berkas .html',
    body: 'Hasil unduhan memuat engine dan game sekaligus. Buka langsung di browser lewat file://, tanpa server dan tanpa instalasi.',
  },
  {
    icon: ShieldCheck,
    title: 'Rintangan dihitung agar bisa dilompati',
    body: 'Validator menghitung tinggi dan lama lompatan untuk setiap rintangan. Bot uji memainkan game dengan 3 seed sebelum Anda memainkannya.',
  },
  {
    icon: GraduationCap,
    title: 'Konsep menjadi mekanik',
    body: 'Pemain mengambil item yang cocok dengan kategori target. Item salah memunculkan penjelasan singkat, dan hasil belajar bisa diekspor ke JSON.',
  },
  {
    icon: Palette,
    title: 'Empat gaya visual',
    body: 'Clean Modern, Neon, Cartoon, dan Retro Pixel. Dipilih saat merancang, tanpa perlu menggambar aset.',
  },
];

const STEPS = [
  {
    title: 'Rancang ceritamu',
    body: 'Sebelas langkah santai, satu pertanyaan per langkah: genre, pahlawan, dunia, misi, lawan, materi pelajaran, twist, gaya visual, dan ending. Bingung? Tekan 🎲 Acak.',
  },
  {
    title: 'Tinjau blueprint dan prolog',
    body: 'Sebelum game dibangun, kamu membaca blueprint lengkap: prolog cerita, cara menang, materi, dan ending. Ubah yang belum pas.',
  },
  {
    title: 'AI membuat game',
    body: 'Endless Runner: sekitar 50 baris data yang dijalankan AISYS Engine, biasanya selesai dalam belasan detik. Genre Beta: AI menulis seluruh kode game.',
  },
  {
    title: 'Mainkan dan unduh',
    body: 'Game dibuka dengan prolog dan ditutup dengan ending menang atau kalah. Unduh satu berkas .html untuk dimainkan di mana saja.',
  },
];

const FAQS = [
  {
    q: 'Apakah saya perlu bisa coding?',
    a: 'Tidak. Anda cukup menjawab pertanyaan dan meninjau rancangan. Manifest yang ditulis AI tetap bisa dibaca di tab Code bila ingin mempelajari strukturnya.',
  },
  {
    q: 'Apakah game bisa dimainkan tanpa internet?',
    a: 'Bisa. Berkas .html hasil unduhan memuat engine dan game sekaligus dan berjalan dengan dibuka langsung di browser. Game mendukung kontrol keyboard dan sentuh.',
  },
  {
    q: 'Apakah materi pelajaran di dalam game pasti benar?',
    a: 'Belum tentu. Materi disusun oleh AI dan bisa keliru. Periksa daftar item dan penjelasannya di rancangan sebelum game dibagikan. Setiap game edukasi sebaiknya ditinjau dosen atau pengajar.',
  },
  {
    q: 'Apa bedanya genre Stabil dan Beta?',
    a: 'Endless Runner (Stabil) dijalankan oleh AISYS Engine: AI hanya menulis data, lalu engine memvalidasi dan menguji game secara otomatis. Di genre Beta, AI menulis seluruh kode game; hasilnya bisa bervariasi dan belum diuji otomatis, jadi coba mainkan dulu sebelum dibagikan. Genre Beta naik menjadi Stabil setelah engine-nya selesai dan lulus pengujian yang sama.',
  },
  {
    q: 'Data apa yang tercatat saat game dimainkan?',
    a: 'Item yang diambil, benar atau salah, dan daftar kesalahan beserta penjelasannya. Saat dimainkan di Studio, data ini bisa diekspor ke JSON dari layar akhir. Data permainan tidak dikirim ke server.',
  },
];

// Lines of the real demo manifest shown in the hero window
const SNIPPET = [
  'AISYS.defineGame({',
  '  kit: "endless-runner",',
  '  title: "EcoSort Run",',
  '  theme: { preset: "cartoon" },',
  '  learning: {',
  '    categories: [',
  '      { id: "organik", label: "Organik" },',
  '      { id: "anorganik", label: "Anorganik" },',
  '      { id: "b3", label: "B3" }',
  '    ],',
  '    items: [',
  '      { label: "Baterai bekas", category: "b3",',
  '        explain: "Mengandung logam berbahaya…" },',
  '      …',
  '    ]',
  '  },',
  '  world: { speed: 360, maxSpeed: 720 }',
  '});',
];

const CHECK_LABELS: Record<string, string> = {
  validate: 'validasi',
  render: 'render',
  jump: 'lompat',
  progress: 'progres',
  spawn: 'spawn',
  numerik: 'numerik',
  'bot adil': 'bot adil',
  hooks: 'hooks',
  belajar: 'belajar',
};

// ---------------------------------------------------------------- helpers

const escapeInline = (s: string) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

function buildDemoDoc(): string {
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;width:100%;height:100%;background:#60a5fa;overflow:hidden}</style>
<script>${escapeInline(aisysRuntimeRaw)}</script>
</head><body><canvas id="aisys-canvas"></canvas>
<script>${escapeInline(DEMO_MANIFEST)}</script>
<script>
addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    try { if (window.__AISYS_GAME__) AISYS.selfTest(window.__AISYS_GAME__.rawManifest); } catch (e) {}
  }, 0);
});
</script>
</body></html>`;
}

/** Minimal JS highlighting for the static snippet: strings and object keys. */
function highlight(line: string, i: number) {
  const parts: React.ReactNode[] = [];
  const re = /("[^"]*")|(\b[a-zA-Z_]+)(?=:)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    parts.push(
      m[1] ? (
        <span key={m.index} className="text-emerald-700 dark:text-emerald-400">{m[1]}</span>
      ) : (
        <span key={m.index} className="text-sky-700 dark:text-sky-300">{m[2]}</span>
      )
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return <div key={i}>{parts.length ? parts : ' '}</div>;
}

type SelfTest = { ok: boolean; checks: { id: string; pass: boolean; status?: string }[] } | null;

// ---------------------------------------------------------------- small pieces

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-orange-700 dark:text-[#F6821F]">
    {children}
  </div>
);

const Section: React.FC<{ id?: string; band?: boolean; children: React.ReactNode }> = ({ id, band, children }) => (
  <section
    id={id}
    className={`scroll-mt-16 px-5 sm:px-8 py-16 sm:py-24 ${
      band ? 'bg-slate-50 dark:bg-[#101216] border-y border-slate-200/70 dark:border-[#1F2229]' : ''
    }`}
  >
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

type StepState = 'done' | 'running' | 'fail' | 'idle';

const PipelineStep: React.FC<{ label: string; sub: string; state: StepState; last?: boolean }> = ({ label, sub, state, last }) => {
  const tone =
    state === 'done'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : state === 'running'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : state === 'fail'
      ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
      : 'border-slate-200 dark:border-[#2A2E37] bg-slate-50 dark:bg-[#171A20] text-slate-400';
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center ${tone}`}>
        {state === 'done' ? (
          <Check className="w-4 h-4" />
        ) : state === 'running' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === 'fail' ? (
          <X className="w-4 h-4" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">{label}</div>
        <div className="font-mono text-[10px] text-slate-400 truncate">{sub}</div>
      </div>
      {!last && <div className="hidden md:block h-px flex-1 bg-slate-200 dark:bg-[#2A2E37]" />}
    </div>
  );
};

// ---------------------------------------------------------------- page

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStudio,
  onOpenAdminLogin,
  isAdmin,
  onOpenSkillModal,
  theme,
  onToggleTheme,
}) => {
  const demoDoc = useMemo(buildDemoDoc, []);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [selfTest, setSelfTest] = useState<SelfTest>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Real selfTest result reported by the runtime running the demo game
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      if (e.data && e.data.type === 'aisys:selftest') {
        setSelfTest({ ok: Boolean(e.data.ok), checks: Array.isArray(e.data.checks) ? e.data.checks : [] });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const passed = selfTest ? selfTest.checks.filter((c) => c.pass).length : 0;
  const testState: StepState = !selfTest ? 'running' : selfTest.ok ? 'done' : 'fail';
  const testSub = !selfTest ? 'berjalan…' : `${passed}/${selfTest.checks.length} lolos`;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* ------------------------------------------------ header */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-slate-200/80 dark:border-[#1F2229] bg-white/85 dark:bg-[#0B0C0E]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#F6821F] text-slate-950 flex items-center justify-center font-bold text-[11px] tracking-wider">
                AI
              </div>
              <span className="font-mono text-[13px] font-semibold tracking-[0.12em]">AISYS</span>
            </div>
            <span className="hidden md:block h-4 w-px bg-slate-200 dark:bg-[#2A2E37]" />
            <span className="hidden md:block font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
              STIKOM Yos Sudarso
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-7 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            <a href="#fitur" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Cara kerja</a>
            <a href="#genre" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Genre</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#171A20] transition-colors"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAdmin ? (
              <button
                onClick={onOpenSkillModal}
                className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]"
                aria-label="Kelola Skill"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kelola Skill</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md border border-slate-200 dark:border-[#2A2E37] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#3A3F4A] font-mono text-[11px] transition-colors"
                title="Akses dosen / pengelola skill"
                aria-label="Akses Dosen"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Akses Dosen</span>
              </button>
            )}
            <button
              onClick={() => onEnterStudio()}
              className="h-8 px-3.5 rounded-md bg-[#F6821F] hover:bg-[#FA8B28] text-slate-950 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors"
            >
              Buka Studio
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden px-5 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] w-[720px] h-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(246,130,31,0.10),transparent)] dark:bg-[radial-gradient(closest-side,rgba(246,130,31,0.08),transparent)]"
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-orange-600/25 dark:border-[#F6821F]/30 font-mono text-[11px] uppercase tracking-[0.14em] text-orange-700 dark:text-[#F6821F]">
            9 genre · Endless Runner stabil
          </div>

          <h1 className="mt-6 max-w-3xl text-[40px] leading-[1.05] sm:text-[56px] font-bold tracking-[-0.035em]">
            Rancang game edukasi.{' '}
            <span className="text-orange-600 dark:text-[#F6821F]">Bagikan satu file.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-600 dark:text-slate-400">
            Ciptakan pahlawan, dunia, misi, dan ending-mu sendiri bersama AI, lalu selipkan materi pelajaran di
            dalamnya. Sekitar 15 menit kemudian, game-mu jalan di browser, lengkap dengan prolog dan ending cerita.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onEnterStudio()}
              className="h-12 px-6 rounded-xl bg-[#F6821F] hover:bg-[#FA8B28] text-slate-950 text-[15px] font-semibold flex items-center gap-2 transition-colors"
            >
              Mulai merancang
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#cara-kerja"
              className="h-12 px-6 rounded-xl border border-slate-200 dark:border-[#2A2E37] hover:border-slate-300 dark:hover:border-[#3A3F4A] text-[15px] font-semibold flex items-center transition-colors"
            >
              Lihat cara kerja
            </a>
          </div>

          {/* Product window: real manifest + the same game running live */}
          <div className="mt-14 rounded-2xl border border-slate-200 dark:border-[#1F2229] bg-white dark:bg-[#111318] shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
            <div className="h-11 px-4 border-b border-slate-200 dark:border-[#1F2229] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-[#2A2E37]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-[#2A2E37]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-[#2A2E37]" />
                </div>
                <span className="font-mono text-[11px] text-slate-500">ecosort-run.html</span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-[#1F2229] p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-3">
                  Manifest · ditulis AI
                </div>
                <pre className="font-mono text-[12px] leading-[1.7] text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {SNIPPET.map(highlight)}
                </pre>
              </div>
              <div className="min-w-0 p-5 flex flex-col gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Game · dijalankan AISYS Engine
                </div>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-[#1F2229] bg-[#60a5fa]">
                  <iframe
                    ref={frameRef}
                    srcDoc={demoDoc}
                    title="Demo game EcoSort Run"
                    sandbox="allow-scripts"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <p className="font-mono text-[11px] text-slate-500">
                  Klik atau sentuh game untuk mulai. Spasi atau ketuk untuk melompat. Ambil item sesuai target.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-[#1F2229] px-5 py-4 grid grid-cols-2 md:flex md:items-center gap-4">
              <PipelineStep label="Diskusi" sub="Sesi 1-5" state="done" />
              <PipelineStep label="Rancangan" sub="PRD ditinjau" state="done" />
              <PipelineStep label="Manifest" sub={`${DEMO_MANIFEST.split('\n').length} baris`} state="done" />
              <PipelineStep label="Uji otomatis" sub={testSub} state={testState} />
              <PipelineStep label="Unduh" sub="1 berkas .html" state={selfTest?.ok ? 'done' : 'idle'} last />
            </div>

            {selfTest && (
              <div className="border-t border-slate-200 dark:border-[#1F2229] px-5 py-3 flex flex-wrap gap-1.5">
                {selfTest.checks.map((c) => (
                  <span
                    key={c.id}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      c.pass
                        ? 'border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                        : 'border-red-500/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {c.pass ? '✓' : '✕'} {CHECK_LABELS[c.id] || c.id}
                  </span>
                ))}
                <span className="font-mono text-[10px] px-1 py-0.5 text-slate-400">
                  hasil selfTest sungguhan dari game di atas
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ features */}
      <Section id="fitur" band>
        <Eyebrow>Yang Anda dapatkan</Eyebrow>
        <h2 className="mt-3 text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] leading-tight max-w-2xl">
          Game yang benar-benar bisa dimainkan
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 dark:border-[#1F2229] bg-white dark:bg-[#111318] p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-700 dark:text-[#F6821F] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{f.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ how it works */}
      <Section id="cara-kerja">
        <Eyebrow>Cara kerja</Eyebrow>
        <h2 className="mt-3 text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] leading-tight max-w-2xl">
          Dari ide ke berkas .html dalam satu percakapan
        </h2>
        <ol className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-slate-200 dark:border-[#2A2E37] pt-5">
              <div className="font-mono text-[12px] text-orange-700 dark:text-[#F6821F]">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------ genres */}
      <Section id="genre" band>
        <Eyebrow>Genre</Eyebrow>
        <h2 className="mt-3 text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] leading-tight max-w-2xl">
          Sembilan genre, satu alur rancang
        </h2>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-600 dark:text-slate-400">
          Endless Runner berjalan di AISYS Engine dan diuji otomatis. Delapan genre lain berstatus Beta: AI menulis
          seluruh kode game, jadi coba mainkan dulu sebelum dibagikan.
        </p>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
          <button
            onClick={() => onEnterStudio(RUNNER_PROMPT)}
            className="group text-left rounded-2xl border border-orange-500/40 dark:border-[#F6821F]/40 bg-white dark:bg-[#111318] p-6 hover:border-orange-500 dark:hover:border-[#F6821F] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                Stabil · diuji otomatis
              </span>
              <ArrowRight className="w-4 h-4 text-orange-700 dark:text-[#F6821F] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">Endless Runner</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Pemain berlari otomatis, melompati rintangan, dan mengambil item yang cocok dengan kategori target.
              Cocok untuk materi klasifikasi: jenis sampah, kelas hewan, perangkat komputer, jenis pajak.
            </p>
            <div className="mt-6 font-mono text-[12px] font-semibold text-orange-700 dark:text-[#F6821F]">
              Mulai rancang
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 dark:border-[#1F2229] bg-white dark:bg-[#111318] p-3 sm:p-4">
            <div className="px-3 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              Beta · kode ditulis AI
            </div>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2">
              {BETA_GENRES.map((g) => (
                <li key={g.name}>
                  <button
                    onClick={() => onEnterStudio(`Saya ingin membuat game ${g.name}.`)}
                    className="group w-full text-left rounded-lg px-3 py-3 hover:bg-slate-50 dark:hover:bg-[#171A20] transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-slate-800 dark:text-slate-200">{g.name}</span>
                      <span className="block text-[13px] text-slate-500 dark:text-slate-400 truncate">{g.desc}</span>
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-700 dark:text-amber-400">
                        Beta
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-700 dark:group-hover:text-[#F6821F] group-hover:translate-x-0.5 transition-all" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ FAQ */}
      <Section id="faq">
        <div className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] leading-tight">
            Pertanyaan yang sering diajukan
          </h2>
        </div>
        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-[#1F2229] bg-white dark:bg-[#111318] divide-y divide-slate-200 dark:divide-[#1F2229]">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[16px] font-medium"
                >
                  {f.q}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p className="px-6 pb-5 -mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ CTA */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto rounded-2xl bg-slate-950 dark:bg-[#111318] dark:border dark:border-[#1F2229] px-6 sm:px-12 py-12 sm:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight text-white">
              Siap merancang game pertama?
            </h2>
            <p className="mt-3 text-[16px] text-slate-400">Satu percakapan, satu berkas .html.</p>
          </div>
          <button
            onClick={() => onEnterStudio()}
            className="h-12 px-6 rounded-xl bg-[#F6821F] hover:bg-[#FA8B28] text-slate-950 text-[15px] font-semibold flex items-center gap-2 self-start md:self-auto transition-colors"
          >
            Buka Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------ footer */}
      <footer className="border-t border-slate-200 dark:border-[#1F2229] px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co.com/kgV7WDhF/Logo-SYS.png"
              alt="STIKOM Yos Sudarso"
              className="h-5 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span>AISYS Game Studio · STIKOM Yos Sudarso</span>
          </div>
          <span>Built with AISYS HTML5 Engine</span>
        </div>
      </footer>
    </div>
  );
};
