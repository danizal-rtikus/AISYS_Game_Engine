import React from 'react';
import { Terminal, Trash2, AlertTriangle, Bug } from 'lucide-react';
import { ConsoleLogItem } from '../types';

interface ConsoleViewerProps {
  logs: ConsoleLogItem[];
  onClearLogs: () => void;
  onFixWithAI: (errorMsg: string) => void;
}

export const ConsoleViewer: React.FC<ConsoleViewerProps> = ({
  logs,
  onClearLogs,
  onFixWithAI,
}) => {
  const latestError = logs.filter((l) => l.type === 'error').pop();

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0D0E11] text-xs font-mono">
      {/* Top Bar */}
      <div className="h-9 px-4 border-b border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-[#F6821F]" />
          <span>In-Game Console ({logs.length} entri)</span>
        </div>

        <div className="flex items-center gap-2">
          {latestError && (
            <button
              onClick={() => onFixWithAI(latestError.message)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-sans bg-rose-600 hover:bg-rose-700 text-white transition-colors animate-pulse"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Perbaiki Bug dengan AI</span>
            </button>
          )}

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans border border-slate-200 dark:border-[#282B33] hover:bg-slate-100 dark:hover:bg-[#1C1E24] text-slate-600 dark:text-slate-400 transition-colors"
            title="Bersihkan Log"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto p-4 space-y-1">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-center py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-40" />
            <p>Belum ada output log dari game.</p>
            <p className="text-[11px] mt-0.5">console.log dan pesan runtime error dari iframe akan tampil di sini.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isError = log.type === 'error';
            const isWarn = log.type === 'warn';
            return (
              <div
                key={log.id}
                className={`py-1 px-2 rounded flex items-start gap-2 ${
                  isError
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : isWarn
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {isError && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />}
                <span className="break-all whitespace-pre-wrap">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
