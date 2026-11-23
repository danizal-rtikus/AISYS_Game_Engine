import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Layers,
  Sun,
  Moon,
  Play,
  Key,
  Code2,
  Volume2,
  Smartphone,
  GraduationCap,
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: (presetPrompt?: string) => void;
  onOpenAdminLogin: () => void;
  isAdmin: boolean;
  onOpenSkillModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const PRESET_GENRES = [
  {
    id: 'platformer',
    title: '2D Scrolling Platformer',
    specs: 'Gravitasi Presisi • Rintangan • Koin',
    controls: 'WASD / Panah + Spasi • Touch',
    prompt: 'Saya ingin membuat game 2D Scrolling Platformer. Mari kita rancang mekanik dan temanya (bisa arcade atau bertema edukasi).',
    icon: Gamepad2,
  },
  {
    id: 'shooter',
    title: 'Top-Down Space Shooter',
    specs: 'Navigasi 8-Arah • Wave Survival',
    controls: 'WASD + Bidik Mouse / Sentuhan',
    prompt: 'Saya ingin membuat game Top-Down Space Shooter dengan kontrol WASD/Mouse dan laser blaster.',
    icon: Compass,
  },
  {
    id: 'puzzle',
    title: 'Neon Puzzle Grid',
    specs: 'Matriks Ubin 2D • Logika Giliran',
    controls: 'Klik / Sentuh untuk Memilih',
    prompt: 'Saya ingin membuat game Neon Puzzle Grid berbasis logika ubin dan kalkulasi combo.',
    icon: Layers,
  },
  {
    id: 'runner',
    title: 'Endless Runner / Dodger',
    specs: 'Refleks Cepat • Rintangan Eskalatif',
    controls: 'Lompat / Menghindar • Sentuh / Spasi',
    prompt: 'Saya ingin membuat game Endless Runner dengan refleks cepat dan rintangan dinamis.',
    icon: Sparkles,
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStudio,
  onOpenAdminLogin,
  isAdmin,
  onOpenSkillModal,
  theme,
  onToggleTheme,
}) => {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(59 + Math.floor(Math.random() * 2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150 pt-13 sm:pt-14">
      {/* 1. Fixed Header (Menempel di Atas, Proporsional 800px hingga 1920px) */}
      <header className="fixed top-0 left-0 right-0 h-13 sm:h-14 border-b border-slate-200 dark:border-[#282B33] px-3 sm:px-6 lg:px-8 flex items-center justify-between bg-white/90 dark:bg-[#0B0C0E]/90 backdrop-blur-md z-50 transition-colors">
        {/* Brand & Institution */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#F6821F] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm flex-shrink-0">
              AI
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100">
                AISYS
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal">
                Game Studio
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-[#282B33]" />

          <div className="hidden sm:flex items-center gap-1.5">
            <img
              src="https://i.ibb.co.com/kgV7WDhF/Logo-SYS.png"
              alt="STIKOM Yos Sudarso"
              className="h-4 sm:h-5 w-auto object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
              STIKOM Yos Sudarso
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          {/* Admin / Dosen Button */}
          {isAdmin ? (
            <button
              onClick={onOpenSkillModal}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kelola Skill</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#282B33] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-mono text-[11px] transition-colors"
              title="Akses Dosen / Pengelola Skill"
            >
              <Key className="w-3.5 h-3.5 text-[#F6821F]" />
              <span className="hidden sm:inline">Akses Dosen</span>
            </button>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => onEnterStudio()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white font-medium transition-colors shadow-sm text-xs"
          >
            <span>Mulai Praktik</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Responsive Asymmetric Grid (800x600 -> 1920x1080) */}
      <section className="border-b border-slate-200 dark:border-[#282B33] px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14 bg-slate-50/50 dark:bg-[#0B0C0E]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column (7 cols on lg, full on <= 1024px) */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-[#13151A] border border-slate-200 dark:border-[#282B33] text-[10px] sm:text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <span className="text-[#F6821F] font-semibold">AISYS Engine Core</span>
              <span>•</span>
              <span>Single-File HTML5 (file://)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Studio Pembuat Game Web <br />
              <span className="text-[#F6821F]">HTML5 Mandiri</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Rancang game web lengkap dalam satu berkas tunggal yang langsung dapat dimainkan secara offline.
              Mengintegrasikan rendering prosedural Canvas 2D, sintesis Web Audio API, dan kontrol sentuh smartphone tanpa instalasi server.
            </p>

            {/* Action Bar */}
            <div className="pt-1.5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => onEnterStudio()}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Buka Game Studio</span>
              </button>

              <a
                href="#genre-list"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] hover:bg-slate-100 dark:hover:bg-[#1C1E24] text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
              >
                Pilihan Genre Praktik ↓
              </a>
            </div>

            {/* Compact Technical Specs */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#282B33] grid grid-cols-3 gap-2 sm:gap-3 text-left">
              <div>
                <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Format Output</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate">
                  Single-File .html
                </div>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Driver Grafis</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate">
                  Canvas 2D
                </div>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Driver Audio</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate">
                  Web Audio Synth
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Responsive Frame Simulator */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] shadow-lg overflow-hidden text-left font-mono text-xs">
              <div className="h-8 sm:h-9 px-3 border-b border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#0B0C0E] flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="ml-2 text-[10px] sm:text-[11px] text-slate-400">preview-sandbox.html</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-mono">{fps} FPS</span>
              </div>

              <div className="p-4 sm:p-5 bg-black text-slate-100 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between relative overflow-hidden">
                <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-emerald-400 font-mono">CANVAS 2D LOOP</span>
                  <span className="text-[#F6821F] font-mono">DELTA-TIME</span>
                </div>

                <div className="py-4 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-7 h-7 border border-[#F6821F] rounded flex items-center justify-center text-[#F6821F] animate-pulse text-xs">
                    ▲
                  </div>
                  <div className="text-xs font-bold text-white tracking-wider">
                    ARCADE DEMO
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Web Audio Oscillator • Active
                  </div>
                </div>

                <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
                  <span>STIKOM Yos Sudarso</span>
                  <span className="text-slate-400">Built with AISYS HTML5 Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: 3 Langkah Alur Kerja Terarah */}
      <section className="border-b border-slate-200 dark:border-[#282B33] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 pb-2 border-b border-slate-200 dark:border-[#282B33] flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Alur Perancangan Game
            </h2>
            <span className="text-xs text-[#F6821F] font-mono">3 Tahap Terarah</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-[#282B33] border border-slate-200 dark:border-[#282B33] rounded-lg bg-white dark:bg-[#13151A] overflow-hidden">
            <div className="p-4 sm:p-5 space-y-1.5">
              <div className="text-xs font-mono font-bold text-[#F6821F]">01. KONSEP</div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Discovery Bertahap
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Panduan santai layaknya mentor studio untuk menentukan genre game, tema (arcade atau misi edukasi), dan variasi mekanik unik.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1.5">
              <div className="text-xs font-mono font-bold text-[#F6821F]">02. SINTESIS</div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Generasi Kode Mandiri
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mesin menyusun loop animasi, sistem partikel, deteksi benturan, dan audio synthesizer secara utuh tanpa ada potongan kode yang hilang.
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-1.5">
              <div className="text-xs font-mono font-bold text-[#F6821F]">03. EKSPOR</div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Uji Coba & Unduh
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mainkan langsung di panel sandbox, uji kontrol sentuh mobile, lalu unduh berkas <code className="text-xs font-mono">.html</code> siap jalan via <code className="text-xs font-mono">file://</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Fitur Arsitektur Grid */}
      <section className="border-b border-slate-200 dark:border-[#282B33] px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-slate-50/50 dark:bg-[#0B0C0E]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 pb-2 border-b border-slate-200 dark:border-[#282B33]">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pilar Teknis Mesin
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                <Code2 className="w-4 h-4 text-[#F6821F]" />
                <span>Canvas 2D Prosedural</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bebas aset gambar lokal. Grafis dirender melalui Canvas API murni sehingga kebal terhadap masalah CORS saat dibuka tanpa server.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                <Volume2 className="w-4 h-4 text-[#F6821F]" />
                <span>Web Audio API Sintetis</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Efek suara lompat, tembakan, ledakan, dan koin dihasilkan secara prosedural via osilator gelombang tanpa file audio eksternal.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-xs">
                <Smartphone className="w-4 h-4 text-[#F6821F]" />
                <span>Desktop & Sentuh HP</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Mendukung navigasi keyboard WASD/Panah serta tombol sentuh virtual responsif saat dimainkan di layar smartphone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Template Genre Praktik (2 columns on sm/md, 4 on lg) */}
      <section id="genre-list" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 flex items-baseline justify-between pb-2 border-b border-slate-200 dark:border-[#282B33]">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Template Genre Praktik
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Pilih untuk membuka Studio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_GENRES.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => onEnterStudio(g.prompt)}
                  className="p-3.5 sm:p-4 rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] hover:border-[#F6821F]/70 transition-all text-left flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 text-[#F6821F]" />
                      <span className="text-[10px] font-mono text-slate-400">Ready</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#F6821F] transition-colors">
                      {g.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {g.specs}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1C1E24] flex items-center justify-between text-[11px] font-medium text-[#F6821F]">
                    <span>Buka Template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Footer Minimalis */}
      <footer className="border-t border-slate-200 dark:border-[#282B33] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-white dark:bg-[#0B0C0E] text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">AISYS HTML5 Game Studio</span>
          <span>•</span>
          <span>STIKOM Yos Sudarso</span>
        </div>

        <div className="text-[10px] sm:text-[11px] font-mono text-slate-400">
          Laboratorium Rekayasa Game Web • Single-File HTML5
        </div>
      </footer>
    </div>
  );
};
