import React, { useState } from 'react';
import { X, Eye, EyeOff, Key, Server, Cpu, Check, AlertCircle } from 'lucide-react';
import { AppSettings, ModelOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const campusKey = ((import.meta.env.VITE_DEFAULT_API_KEY as string) || '').trim();
  const hasCampusKey = Boolean(campusKey);

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState<ModelOption>(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] shadow-xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#0B0C0E] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#F6821F]/10 text-[#F6821F]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm">Pengaturan API & Engine</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Konfigurasi SumoPod / DeepSeek API (BYOK - Disimpan Lokal)
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

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 text-xs overflow-y-auto flex-1">
          {/* API Key */}
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>SumoPod API Key {hasCampusKey ? '(Opsional)' : '*'}</span>
              <span className="text-[10px] text-slate-400">Disimpan di localStorage</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasCampusKey
                    ? 'Kunci Default Kampus aktif (isi untuk kunci sendiri)'
                    : 'sk-...'
                }
                className="w-full px-3 py-2 pr-10 rounded-md border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] focus:outline-none focus:ring-1 focus:ring-[#F6821F] font-mono text-xs placeholder:text-slate-400"
                required={!hasCampusKey}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {hasCampusKey && !apiKey && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kunci Kampus Terpasang • Mahasiswa dapat langsung membuat game tanpa mengisi API Key.</span>
              </p>
            )}
            {!hasCampusKey && !apiKey && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Masukkan API Key SumoPod Anda untuk mulai membuat game.
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#F6821F]" />
              <span>Pilihan Model AI</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModel('deepseek-v4-flash')}
                className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${
                  model === 'deepseek-v4-flash'
                    ? 'border-[#F6821F] bg-[#F6821F]/5 ring-1 ring-[#F6821F]'
                    : 'border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs">deepseek-v4-flash</span>
                    {model === 'deepseek-v4-flash' && <Check className="w-3.5 h-3.5 text-[#F6821F]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Direkomendasikan • Kepatuhan instruksi optimal untuk game kompleks.
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-mono text-[#F6821F]">
                  1.0M Context • Default
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModel('deepseek-flash')}
                className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${
                  model === 'deepseek-flash'
                    ? 'border-[#F6821F] bg-[#F6821F]/5 ring-1 ring-[#F6821F]'
                    : 'border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs">deepseek-flash</span>
                    {model === 'deepseek-flash' && <Check className="w-3.5 h-3.5 text-[#F6821F]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Alternatif cepat • Latensi sangat rendah untuk eksperimen ringan.
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400">
                  1.0M Context • Cadangan
                </div>
              </button>
            </div>
          </div>

          {/* Endpoint Base URL */}
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Base API Endpoint</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://ai.sumopod.com/v1"
              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] focus:outline-none focus:ring-1 focus:ring-[#F6821F] font-mono text-xs placeholder:text-slate-400"
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Format standar OpenAI-compatible endpoint SumoPod.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#282B33] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-[#282B33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              {isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
