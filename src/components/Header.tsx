import React from 'react';
import { Sun, Moon, Plus, Sliders, Key, Check, Home, ShieldCheck } from 'lucide-react';
import { ModelOption } from '../types';

interface HeaderProps {
  currentModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  isStreaming: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onOpenSkillModal: () => void;
  onOpenSettingsModal: () => void;
  onGoHome: () => void;
  isAdmin: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onModelChange,
  isStreaming,
  theme,
  onToggleTheme,
  onNewChat,
  onOpenSkillModal,
  onOpenSettingsModal,
  onGoHome,
  isAdmin,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);

  return (
    <header className="h-12 border-b border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] px-3 sm:px-4 flex items-center justify-between select-none z-20 flex-shrink-0">
      {/* Left: Brand Identity & Home Link */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
          title="Kembali ke Landing Page"
        >
          <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#F6821F] text-white font-bold text-xs tracking-wider shadow-sm flex-shrink-0">
            AI
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100">
              AISYS
            </span>
            <span className="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 hidden xs:inline">
              Studio
            </span>
          </div>
        </button>

        <div className="h-3.5 w-px bg-slate-200 dark:bg-[#282B33] hidden sm:block" />

        <button
          onClick={onGoHome}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 dark:hover:border-[#282B33] transition-colors"
          title="Ke Beranda"
        >
          <Home className="w-3.5 h-3.5 text-[#F6821F]" />
          <span className="hidden md:inline">Beranda</span>
        </button>
      </div>

      {/* Center: Engine Status (Protected from leaking secrets) */}
      <div className="relative mx-1">
        {isAdmin ? (
          /* Admin View: Shows exact model & dropdown switcher */
          <>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono transition-colors border border-emerald-500/40 bg-emerald-500/5 hover:border-[#F6821F]/60 text-slate-700 dark:text-slate-300"
              title="Ganti model AI (Mode Admin)"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isStreaming
                    ? 'bg-[#F6821F] animate-ping'
                    : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                }`}
              />
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-none">
                {currentModel}
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Admin
              </span>
            </button>

            {modelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setModelDropdownOpen(false)}
                />
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-52 sm:w-56 rounded-md bg-white dark:bg-[#13151A] border border-slate-200 dark:border-[#282B33] shadow-lg py-1 z-40 text-xs">
                  <div className="px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Pilih Model Engine
                  </div>
                  <button
                    onClick={() => {
                      onModelChange('deepseek-v4-flash');
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1C1E24] transition-colors ${
                      currentModel === 'deepseek-v4-flash'
                        ? 'text-[#F6821F] font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs">deepseek-v4-flash</div>
                      <div className="text-[10px] text-slate-400">Default • Generasi Mutakhir</div>
                    </div>
                    {currentModel === 'deepseek-v4-flash' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                  <button
                    onClick={() => {
                      onModelChange('deepseek-flash');
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1C1E24] transition-colors ${
                      currentModel === 'deepseek-flash'
                        ? 'text-[#F6821F] font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs">deepseek-flash</div>
                      <div className="text-[10px] text-slate-400">Alternatif • Ultra Cepat</div>
                    </div>
                    {currentModel === 'deepseek-flash' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Public / Student View: Proprietary branding, zero leak */
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#13151A] text-slate-700 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isStreaming
                  ? 'bg-[#F6821F] animate-ping'
                  : 'bg-emerald-500 ring-2 ring-emerald-500/20'
              }`}
            />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              AISYS Engine Core
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
              • Ready
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions (Responsive Icons & Labels) */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
          )}
        </button>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C1E24] border border-slate-200 dark:border-[#282B33] transition-colors"
          title="Percakapan Baru"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">New Game</span>
        </button>

        {/* Skill Editor */}
        <button
          onClick={onOpenSkillModal}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isAdmin
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-200 dark:border-[#282B33] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C1E24]'
          }`}
          title={isAdmin ? 'Skill Editor (Admin Aktif)' : 'Kelola Skill (Akses Dosen)'}
        >
          {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">Skill</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F6821F] hover:bg-[#E66E0A] text-white transition-colors shadow-sm"
          title="Pengaturan API Key"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};
