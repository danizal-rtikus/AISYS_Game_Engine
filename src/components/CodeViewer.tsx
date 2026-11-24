import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  gameTitle: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, gameTitle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${gameTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'game'}.html`;
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = code.split('\n');

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0D0E11] text-xs font-mono">
      {/* Top Bar */}
      <div className="h-9 px-4 border-b border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>HTML5 Single-File</span>
          <span>•</span>
          <span>{lines.length} baris</span>
          <span>•</span>
          <span>{(new Blob([code]).size / 1024).toFixed(1)} KB</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans border border-slate-200 dark:border-[#282B33] hover:bg-slate-100 dark:hover:bg-[#1C1E24] text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans bg-[#F6821F] hover:bg-[#E66E0A] text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .html</span>
          </button>
        </div>
      </div>

      {/* Code Text Body with Responsive Line Numbers & Wrapping */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 leading-relaxed font-mono text-[11px] sm:text-xs">
        <div className="w-full inline-block min-w-full">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="flex items-start hover:bg-slate-100/60 dark:hover:bg-[#1C1E24]/60 rounded px-1 py-0.5 transition-colors group"
            >
              <span className="w-9 sm:w-12 pr-3 text-right select-none text-slate-400 dark:text-slate-600 text-[10px] sm:text-[11px] flex-shrink-0 font-mono group-hover:text-slate-500">
                {idx + 1}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-all sm:break-normal font-mono text-slate-800 dark:text-slate-200 selection:bg-[#F6821F]/20">
                {line || ' '}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
