import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, FileCode2, Download, CloudUpload } from 'lucide-react';
import { DEFAULT_SKILL_PROMPT, DEFAULT_SKILL_NAME } from '../config/defaultSkill';
import { saveSharedSkill } from '../utils/storage';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSavePrompt: (prompt: string) => void;
  isAdmin: boolean;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSavePrompt,
  isAdmin,
}) => {
  const [prompt, setPrompt] = useState(systemPrompt);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [serverNotice, setServerNotice] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('Kembalikan instruksi skill ke setelan bawaan AISYS?')) {
      setPrompt(DEFAULT_SKILL_PROMPT);
    }
  };

  const handleSave = async () => {
    setIsSavingServer(true);
    setServerNotice('');

    // 1. Save locally to parent state and localStorage
    onSavePrompt(prompt);

    // 2. Save to shared server file public/skill-config.json
    const synced = await saveSharedSkill(prompt);
    setIsSavingServer(false);
    setIsSaved(true);

    if (synced) {
      setServerNotice('Tersimpan di server! Mahasiswa cukup Hard Refresh (Ctrl+F5) untuk memuat pembaruan ini.');
    } else {
      setServerNotice('Tersimpan di sesi lokal ini.');
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleExportFile = () => {
    const fileContent = `/**\n * AISYS HTML5 Game Studio - Exported Skill\n * Exported At: ${new Date().toISOString()}\n */\n\nexport const DEFAULT_SKILL_PROMPT = ${JSON.stringify(prompt)};\n`;
    const blob = new Blob([fileContent], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'defaultSkill.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lineCount = prompt.split('\n').length;
  const charCount = prompt.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#0B0C0E]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#F6821F]/10 text-[#F6821F]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>Skill Engine Editor</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#1C1E24] text-slate-700 dark:text-slate-300">
                  {DEFAULT_SKILL_NAME}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Akses Admin Aktif
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instruksi sistem yang mengatur alur discovery, aturan zero-server, Web Audio, dan kode game.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info bar */}
        <div className="px-5 py-2 bg-slate-100 dark:bg-[#1C1E24] border-b border-slate-200 dark:border-[#282B33] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-[#F6821F]" />
              {lineCount} baris
            </span>
            <span>•</span>
            <span>{charCount.toLocaleString()} karakter</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportFile}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#F6821F] transition-colors"
              title="Unduh berkas defaultSkill.ts"
            >
              <Download className="w-3 h-3" />
              <span>Ekspor defaultSkill.ts</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Bawaan</span>
            </button>
          </div>
        </div>

        {/* Textarea Editor */}
        <div className="flex-1 p-4 bg-slate-50 dark:bg-[#0B0C0E] overflow-hidden">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-full p-4 rounded-md border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#F6821F] resize-none"
            spellCheck={false}
          />
        </div>

        {/* Server Notice Banner */}
        {serverNotice && (
          <div className="px-5 py-2 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{serverNotice}</span>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#0B0C0E] flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Perubahan langsung aktif dan disinkronkan ke seluruh pengguna.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-[#282B33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={isSavingServer}
              className="px-4 py-1.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <CloudUpload className="w-3.5 h-3.5" />}
              <span>{isSavingServer ? 'Menyimpan...' : isSaved ? 'Tersimpan & Terpublikasi!' : 'Simpan & Publikasikan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
