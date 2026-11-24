import React, { useRef, useState, useMemo } from 'react';
import {
  Play,
  Code2,
  Terminal,
  RotateCcw,
  Monitor,
  Smartphone,
  ExternalLink,
  Download,
  History,
  Layers,
  Sparkles,
  Gamepad2,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { ViewportMode, ActiveTab, GameVersion, ConsoleLogItem } from '../types';
import { isGameCodePlayable } from '../utils/htmlExtractor';
import { CodeViewer } from './CodeViewer';
import { ConsoleViewer } from './ConsoleViewer';

interface PreviewPanelProps {
  gameCode: string;
  gameTitle: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  versions: GameVersion[];
  currentVersionIndex: number;
  onSelectVersion: (index: number) => void;
  logs: ConsoleLogItem[];
  onClearLogs: () => void;
  onFixWithAI: (errorMsg: string) => void;
  isStreaming: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  gameCode,
  gameTitle,
  activeTab,
  onTabChange,
  versions,
  currentVersionIndex,
  onSelectVersion,
  logs,
  onClearLogs,
  onFixWithAI,
  isStreaming,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const errorCount = useMemo(() => logs.filter((l) => l.type === 'error').length, [logs]);

  const codeLineCount = useMemo(() => {
    if (!gameCode) return 0;
    return gameCode.split('\n').length;
  }, [gameCode]);

  const isPlayable = useMemo(() => {
    return isGameCodePlayable(gameCode);
  }, [gameCode]);

  // Inject console bridge into the game code so iframe logs and errors can be captured safely
  const preparedSrcDoc = useMemo(() => {
    if (!gameCode || !gameCode.trim()) return '';

    const bridgeScript = `
      <script>
        (function() {
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ type: 'AISYS_CONSOLE', level: 'error', text: String(msg) + ' (line ' + line + ')' }, '*');
            return false;
          };
          var _origLog = console.log;
          console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            _origLog.apply(console, args);
            try {
              window.parent.postMessage({
                type: 'AISYS_CONSOLE',
                level: 'log',
                text: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ')
              }, '*');
            } catch(e) {}
          };
          var _origWarn = console.warn;
          console.warn = function() {
            var args = Array.prototype.slice.call(arguments);
            _origWarn.apply(console, args);
            try {
              window.parent.postMessage({
                type: 'AISYS_CONSOLE',
                level: 'warn',
                text: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ')
              }, '*');
            } catch(e) {}
          };
        })();
      </script>
    `;

    if (gameCode.includes('<head>')) {
      return gameCode.replace('<head>', `<head>${bridgeScript}`);
    } else if (gameCode.includes('<html>')) {
      return gameCode.replace('<html>', `<html><head>${bridgeScript}</head>`);
    } else {
      return `${bridgeScript}${gameCode}`;
    }
  }, [gameCode]);

  const handleRestart = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    if (!gameCode) return;
    const blob = new Blob([gameCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    if (!gameCode) return;
    const safeTitle = (gameTitle || 'aisys-game')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${safeTitle || 'aisys-game'}.html`;
    const blob = new Blob([gameCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-[#0B0C0E]">
      {/* Top Toolbar */}
      <div className="h-10 sm:h-11 border-b border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#13151A] px-2 sm:px-3 flex items-center justify-between text-xs select-none z-10 flex-shrink-0 gap-1.5 overflow-x-auto">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-[#0B0C0E] p-0.5 rounded-md border border-slate-200 dark:border-[#282B33] flex-shrink-0">
          <button
            onClick={() => onTabChange('preview')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3 text-[#F6821F]" />
            <span>Play</span>
          </button>

          <button
            onClick={() => onTabChange('code')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
            {isStreaming && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] animate-ping ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onTabChange('console')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-medium transition-colors ${
              activeTab === 'console'
                ? 'bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Log</span>
            {errorCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold leading-tight">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Controls (Restart & Viewport) */}
        {activeTab === 'preview' && gameCode && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded border border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#1C1E24] hover:bg-slate-50 dark:hover:bg-[#282B33] text-slate-700 dark:text-slate-300 transition-colors"
              title="Restart Game (Muat Ulang)"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden xl:inline text-[11px]">Restart</span>
            </button>

            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#0B0C0E] p-0.5 rounded border border-slate-200 dark:border-[#282B33]">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1 rounded transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-white dark:bg-[#1C1E24] text-[#F6821F] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Tampilan Desktop (16:9 / Responsive)"
              >
                <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1 rounded transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-white dark:bg-[#1C1E24] text-[#F6821F] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Tampilan Mobile Portrait (375x667px)"
              >
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Right: Versions & Export Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Version Switcher */}
          {versions.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <History className="w-3 h-3 hidden sm:inline" />
              <select
                value={currentVersionIndex}
                onChange={(e) => onSelectVersion(Number(e.target.value))}
                className="bg-slate-50 dark:bg-[#0B0C0E] border border-slate-200 dark:border-[#282B33] rounded px-1 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {versions.map((ver, idx) => (
                  <option key={ver.id} value={idx}>
                    v{ver.version}
                  </option>
                ))}
              </select>
            </div>
          )}

          {gameCode && (
            <>
              <button
                onClick={handleOpenNewTab}
                className="p-1 sm:p-1.5 rounded border border-slate-200 dark:border-[#282B33] hover:bg-slate-100 dark:hover:bg-[#1C1E24] text-slate-700 dark:text-slate-300 transition-colors"
                title="Buka di Tab Baru (Layar Penuh)"
              >
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded bg-[#F6821F] hover:bg-[#E66E0A] text-white font-medium transition-colors shadow-sm text-[11px] sm:text-xs"
                title="Unduh single-file HTML5"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline">Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
        {activeTab === 'code' ? (
          <CodeViewer code={gameCode} gameTitle={gameTitle} />
        ) : activeTab === 'console' ? (
          <ConsoleViewer logs={logs} onClearLogs={onClearLogs} onFixWithAI={onFixWithAI} />
        ) : (
          /* Preview Tab */
          isStreaming && gameCode ? (
            /* Live Compiling HUD State */
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md animate-in fade-in select-none">
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#F6821F]/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-[#F6821F]/50 animate-pulse" />
                <div className="w-12 h-12 rounded-xl bg-[#F6821F]/10 border border-[#F6821F]/30 text-[#F6821F] flex items-center justify-center shadow-lg shadow-[#F6821F]/10">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6821F]/10 text-[#F6821F] text-[11px] font-mono font-medium mb-2 border border-[#F6821F]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] animate-ping" />
                <span>SINTESIS ENGINE BERJALAN</span>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Menyusun Game HTML5 Prosedural
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed font-mono">
                {codeLineCount < 60 && 'Fase 1/4: Inisialisasi Canvas 2D & Viewport Virtual...'}
                {codeLineCount >= 60 && codeLineCount < 140 && 'Fase 2/4: Logika Fisika, Player & Rintangan...'}
                {codeLineCount >= 140 && codeLineCount < 240 && 'Fase 3/4: Web Audio Synth & Efek Partikel...'}
                {codeLineCount >= 240 && 'Fase 4/4: Game Loop 60 FPS, Kontrol Sentuh & Game Over...'}
              </p>

              <div className="w-full bg-slate-200/60 dark:bg-[#13151A] p-3 rounded-lg border border-slate-300 dark:border-[#282B33] mb-4">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Kode terkumpul:</span>
                  <span className="text-[#F6821F] font-bold">{codeLineCount} baris</span>
                </div>
                <div className="w-full h-1.5 bg-slate-300 dark:bg-[#1C1E24] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F6821F] transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(12, (codeLineCount / 350) * 100))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => onTabChange('code')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-[#282B33] bg-white dark:bg-[#1C1E24] hover:border-[#F6821F]/50 text-slate-700 dark:text-slate-300 hover:text-[#F6821F] text-xs font-medium transition-all shadow-sm"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Intip Aliran Kode Realtime</span>
              </button>
            </div>
          ) : !isStreaming && gameCode && !isPlayable ? (
            /* Incomplete Code State */
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm animate-in fade-in">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Kode Game Terpotong ({codeLineCount} baris)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                Pembuatan kode terhenti di baris {codeLineCount} sebelum mencapai penutup &lt;/html&gt;. Klik tombol di bawah untuk meminta AI melanjutkan kode sampai selesai.
              </p>
              <button
                onClick={() =>
                  onFixWithAI(
                    `Tolong buatkan ulang seluruh kode game HTML5 Canvas 2D yang utuh, padat (400-650 baris), dan lengkap dari <!DOCTYPE html> sampai penutup </html>\n<!-- END_OF_GAME --> dalam satu blok \`\`\`html tanpa monolog berpikir dan tanpa draf kode.`
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buat Ulang Kode Utuh</span>
              </button>
            </div>
          ) : isPlayable ? (
            /* Fully Playable Game */
            <div
              className={`h-full w-full flex items-center justify-center p-2 sm:p-4 transition-all ${
                viewport === 'mobile' ? 'bg-slate-200/50 dark:bg-[#050607]' : ''
              }`}
            >
              <div
                className={`transition-all duration-200 overflow-hidden bg-black flex items-center justify-center shadow-lg ${
                  viewport === 'mobile'
                    ? 'w-[375px] max-w-full h-full max-h-[667px] aspect-[375/667] rounded-2xl border-4 border-slate-800 dark:border-slate-700'
                    : 'w-full h-full rounded-md border border-slate-200 dark:border-[#282B33]'
                }`}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={preparedSrcDoc}
                  title="AISYS Live Game Sandbox"
                  sandbox="allow-scripts allow-pointer-lock allow-modals"
                  className="w-full h-full border-0 bg-black"
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-200/80 dark:bg-[#1C1E24] text-slate-400 flex items-center justify-center mb-3">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Live Game Sandbox Ready
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Mulai percakapan di panel kiri. Saat AI menghasilkan kode game, game HTML5 akan langsung otomatis dijalankan di sini.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1C1E24] border border-slate-300 dark:border-[#282B33]">
                  file:// zero-server
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1C1E24] border border-slate-300 dark:border-[#282B33]">
                  100% Offline-ready
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
