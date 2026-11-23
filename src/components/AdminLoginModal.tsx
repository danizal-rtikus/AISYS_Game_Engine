import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { setAdminAuthenticated } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. Try server verification endpoint first
      let success = false;
      try {
        const res = await fetch('/api/verify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            success = true;
          }
        }
      } catch {
        // Fallback for static hosting without Node server
        if (passcode === 'aisys2026') {
          success = true;
        }
      }

      if (success) {
        setAdminAuthenticated('aisys-admin-authenticated');
        setIsLoading(false);
        setPasscode('');
        onSuccess();
      } else {
        setIsLoading(false);
        setErrorMsg('Passcode / PIN Admin salah. Silakan coba lagi.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Gagal memverifikasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm max-h-[92vh] flex flex-col rounded-lg border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#0B0C0E]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#F6821F]/10 text-[#F6821F]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Akses Dosen & Admin</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Verifikasi untuk mengelola instruksi skill AI
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 dark:text-slate-300 block">
              Passcode / PIN Rahasia
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Masukkan passcode admin..."
                autoFocus
                className="w-full px-3 py-2 pr-10 rounded-md border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] focus:outline-none focus:ring-1 focus:ring-[#F6821F] font-mono text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              *Bawaan: <code className="font-mono text-slate-500">aisys2026</code>
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-[#282B33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
