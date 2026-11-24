import React, { useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Gamepad2,
  Compass,
  Layers,
  AlertCircle,
  Code,
  ArrowRight,
  Music,
  Target,
  Shield,
  Crosshair,
} from 'lucide-react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  currentInput: string;
  onInputChange: (val: string) => void;
  onSendMessage: (text?: string) => void;
  onStopStreaming: () => void;
  onSelectTab: (tab: 'preview' | 'code') => void;
}

const QUICK_STARTERS = [
  {
    title: '2D Platformer',
    desc: 'Lompat rintangan, gravitasi presisi & koin (Arcade / Edukasi).',
    prompt: 'Saya ingin membuat game 2D Platformer. Mari kita diskusikan konsep dan temanya.',
    icon: Gamepad2,
  },
  {
    title: 'Top-Down Shooter',
    desc: 'Navigasi 8 arah, tembak laser & wave survival (Aksi / Edukasi).',
    prompt: 'Saya ingin membuat game Top-Down Shooter dengan kontrol WASD/Mouse dan gelombang musuh.',
    icon: Crosshair,
  },
  {
    title: 'Physics / Slingshot',
    desc: 'Ketapel tarik-lepas ala Angry Birds & fisika penghancuran balok.',
    prompt: 'Saya ingin membuat game Physics / Slingshot dengan trayektori parabola dan rintangan balok.',
    icon: Target,
  },
  {
    title: 'Tower Defense',
    desc: 'Strategi penempatan menara penjaga & gelombang creeps.',
    prompt: 'Saya ingin membuat game Tower Defense strategi penempatan menara dan rute musuh.',
    icon: Shield,
  },
  {
    title: 'Rhythm / Music',
    desc: 'Sinkronisasi ketukan beat, not musik jatuh & tempo audio.',
    prompt: 'Saya ingin membuat game Rhythm / Music berbasis ketukan ritme audio sintetis.',
    icon: Music,
  },
  {
    title: 'Puzzle Grid',
    desc: 'Papan ubin logika warna, match-3 & kalkulasi reaksi berantai.',
    prompt: 'Saya ingin membuat game Puzzle Grid berbasis giliran dengan reaksi berantai.',
    icon: Layers,
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isStreaming,
  currentInput,
  onInputChange,
  onSendMessage,
  onStopStreaming,
  onSelectTab,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [currentInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && currentInput.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0B0C0E] border-r border-slate-200 dark:border-[#282B33]">
      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center max-w-md mx-auto text-center py-8">
            <div className="w-10 h-10 mx-auto rounded-lg bg-[#F6821F]/10 text-[#F6821F] flex items-center justify-center mb-3">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Mulai Rancang Game HTML5 Anda
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
              Didukung AISYS Engine dengan alur perancangan kreatif bertahap, Web Audio prosedural, dan ekspor instan tanpa server.
            </p>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {QUICK_STARTERS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3 rounded-md border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#13151A] hover:border-[#F6821F]/50 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-all group"
                  >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium text-xs group-hover:text-[#F6821F] transition-colors">
                      <Icon className="w-3.5 h-3.5 text-[#F6821F]" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
              >
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1 px-1">
                  {isUser ? 'Anda' : 'AISYS Engine'}
                </div>

                <div
                  className={`max-w-[92%] rounded-md px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-100 dark:bg-[#1C1E24] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#282B33]'
                      : 'bg-white dark:bg-[#13151A] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#282B33]'
                  }`}
                >
                  {/* Message Content (Formatted Markdown) */}
                  <div>
                    {msg.content ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : msg.isThinking ? (
                      <span className="inline-flex items-center gap-1.5 text-[#F6821F] font-mono text-[11px] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] animate-ping" />
                        Sedang merancang arsitektur & mekanisme game...
                      </span>
                    ) : msg.isStreaming && !msg.extractedCode ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] animate-ping" />
                        Sedang berpikir...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-500 font-mono text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Respon kosong dari AI. Silakan kirim ulang pesan Anda atau periksa kuota API.</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Blueprint / PRD Review Decision Bar */}
                  {!msg.isStreaming &&
                    !msg.extractedCode &&
                    msg.role === 'assistant' &&
                    (msg.content.includes('GAME BLUEPRINT') ||
                      msg.content.includes('PRD') ||
                      msg.content.toLowerCase().includes('blueprint')) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-[#282B33] flex flex-wrap gap-1.5 items-center">
                        <button
                          onClick={() => onSendMessage('Lanjut, buatkan kode game sekarang!')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] text-white text-[11px] font-medium transition-colors shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>🚀 Lanjut & Buat Game Sekarang</span>
                        </button>
                        <button
                          onClick={() => {
                            onInputChange('Tolong sesuaikan gaya visualnya menjadi: ');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#1C1E24] hover:bg-slate-100 dark:hover:bg-[#282B33] text-slate-700 dark:text-slate-300 text-[11px] transition-colors"
                        >
                          <span>🎨 Ubah Visual</span>
                        </button>
                        <button
                          onClick={() => {
                            onInputChange('Tolong ubah mekanik atau objektifnya menjadi: ');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#1C1E24] hover:bg-slate-100 dark:hover:bg-[#282B33] text-slate-700 dark:text-slate-300 text-[11px] transition-colors"
                        >
                          <span>⚙️ Ubah Mekanik</span>
                        </button>
                      </div>
                    )}

                  {/* Smart Code Status Card (Streaming / Complete / Incomplete) */}
                  {(msg.extractedCode || (msg.isStreaming && msg.codeLineCount && msg.codeLineCount > 0)) && (
                    <div
                      className={`mt-3 p-2.5 rounded border transition-all ${
                        msg.isStreaming
                          ? 'border-[#F6821F]/30 bg-[#F6821F]/5 text-slate-700 dark:text-slate-300'
                          : msg.isCodeComplete
                          ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300'
                          : 'border-amber-500/30 bg-amber-500/5 text-slate-700 dark:text-slate-300'
                      } flex flex-col gap-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                              msg.isStreaming
                                ? 'bg-[#F6821F]/10 text-[#F6821F]'
                                : msg.isCodeComplete
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <Code className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] flex items-center gap-1.5">
                              {msg.isStreaming ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F6821F] animate-ping" />
                                  <span className="text-[#F6821F]">
                                    Menyusun kode HTML5... ({msg.codeLineCount || 0} baris)
                                  </span>
                                </>
                              ) : msg.isCodeComplete ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Kode game HTML5 siap ({msg.codeLineCount || 0} baris)
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">
                                  ⚠️ Kode game terpotong ({msg.codeLineCount || 0} baris)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {msg.isStreaming
                                ? 'Dialirkan langsung ke Panel Preview kanan'
                                : msg.isCodeComplete
                                ? 'Siap dimainkan via Canvas 2D & Web Audio'
                                : 'Terhenti sebelum penutup </html>. Klik lanjutkan di samping.'}
                            </div>
                          </div>
                        </div>

                        {msg.isCodeComplete ? (
                          <button
                            onClick={() => onSelectTab('preview')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex-shrink-0 shadow-sm"
                          >
                            <span>Mainkan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : msg.isStreaming ? (
                          <button
                            onClick={() => onSelectTab('code')}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-slate-300 dark:border-[#282B33] bg-white dark:bg-[#1C1E24] hover:bg-slate-100 dark:hover:bg-[#282B33] text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0"
                          >
                            <span>Lihat Alur</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onSendMessage(
                                `Tolong buatkan ulang seluruh kode game HTML5 Canvas 2D yang utuh, padat (400-650 baris), dan lengkap dari <!DOCTYPE html> sampai penutup </html>\n<!-- END_OF_GAME --> dalam satu blok \`\`\`html tanpa monolog berpikir dan tanpa draf kode.`
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#F6821F] hover:bg-[#E66E0A] text-white transition-colors flex-shrink-0 shadow-sm"
                          >
                            <span>Buat Ulang Kode Utuh</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Diagnostic Telemetry Bar */}
                      {msg.diagnostic && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#282B33]/60 font-mono text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>
                            finish_reason:{' '}
                            <strong
                              className={
                                msg.diagnostic.finishReason === 'length'
                                  ? 'text-rose-500 dark:text-rose-400'
                                  : msg.diagnostic.finishReason === 'stop'
                                  ? 'text-emerald-500 dark:text-emerald-400'
                                  : 'text-amber-500'
                              }
                            >
                              {msg.diagnostic.finishReason ? `"${msg.diagnostic.finishReason}"` : 'null (koneksi putus)'}
                            </strong>
                          </span>
                          {msg.diagnostic.completionTokens !== undefined && (
                            <span>
                              tokens: <strong>{msg.diagnostic.completionTokens}</strong>
                            </span>
                          )}
                          <span>
                            content: <strong>{msg.diagnostic.contentChars ?? 0} char</strong>
                          </span>
                          <span>
                            reasoning: <strong>{msg.diagnostic.reasoningChars ?? 0} char</strong>
                          </span>
                          {msg.diagnostic.thinkingParam && (
                            <span>
                              thinking:{' '}
                              <strong
                                className={
                                  msg.diagnostic.thinkingParam.includes('rejected')
                                    ? 'text-amber-500'
                                    : 'text-slate-700 dark:text-slate-300'
                                }
                              >
                                {msg.diagnostic.thinkingParam}
                              </strong>
                            </span>
                          )}
                          <span>
                            durasi: <strong>{(msg.diagnostic.durationMs / 1000).toFixed(1)}s</strong>
                          </span>
                          <span>
                            baris: <strong>{msg.extractedCode ? (msg.codeLineCount || 0) : 0}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Quick Starters under welcome message */}
        {messages.length === 1 && messages[0].id === 'welcome-init' && (
          <div className="pt-2 space-y-2 animate-in fade-in duration-200">
            <div className="text-[11px] font-mono text-slate-400">Pilih ide awal atau ketik topik Anda di bawah:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {QUICK_STARTERS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3 rounded-md border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#13151A] hover:border-[#F6821F]/50 hover:bg-slate-100 dark:hover:bg-[#1C1E24] transition-all group"
                  >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium text-xs group-hover:text-[#F6821F] transition-colors">
                      <Icon className="w-3.5 h-3.5 text-[#F6821F] flex-shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-3 border-t border-slate-200 dark:border-[#282B33] bg-white dark:bg-[#0B0C0E] flex-shrink-0">
        <div className="relative rounded-md border border-slate-200 dark:border-[#282B33] bg-slate-50 dark:bg-[#13151A] focus-within:border-[#F6821F] focus-within:ring-1 focus-within:ring-[#F6821F] transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'Sedang menghasilkan respon...'
                : 'Ketik ide game, jawaban tahap discovery, atau instruksi revisi...'
            }
            disabled={isStreaming}
            className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 pr-10 sm:pr-12 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none max-h-28 sm:max-h-36"
          />

          <div className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 flex items-center">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-1 sm:p-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
                title="Hentikan Stream"
              >
                <Square className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSendMessage()}
                disabled={!currentInput.trim()}
                className="p-1 sm:p-1.5 rounded-md bg-[#F6821F] hover:bg-[#E66E0A] disabled:opacity-40 disabled:hover:bg-[#F6821F] text-white transition-colors shadow-sm"
                title="Kirim (Enter)"
              >
                <Send className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 sm:mt-1.5 px-1 text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>Enter kirim • Shift+Enter baris baru</span>
          <span className="hidden sm:inline">Single-File file://</span>
        </div>
      </div>
    </div>
  );
};
