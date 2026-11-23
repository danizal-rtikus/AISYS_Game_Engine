import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { SettingsModal } from './components/SettingsModal';
import { SkillModal } from './components/SkillModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LandingPage } from './components/LandingPage';
import {
  AppSettings,
  Message,
  GameVersion,
  ActiveTab,
  ConsoleLogItem,
  ModelOption,
} from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredMessages,
  saveStoredMessages,
  getStoredVersions,
  saveStoredVersions,
  clearSessionStorage,
  fetchSharedSkill,
  isAdminAuthenticated,
} from './utils/storage';
import { extractHtmlFromStream, extractGameTitle } from './utils/htmlExtractor';
import { sendDeepSeekMessage } from './utils/deepseekStream';

export const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome-init',
  role: 'assistant',
  content: `Halo! Selamat datang di **AISYS Game Studio** 🎮

Saya Technical Game Designer & Mentor Anda di laboratorium ini. Di sini kita bisa merancang dan merekayasa game HTML5 siap main tanpa perlu server lokal.

Pilih salah satu **genre dasar game** yang disiapkan:
- **2D Scrolling Platformer** (Aksi lompat rintangan, gravitasi presisi, dan koleksi item)
- **Top-Down Space Shooter** (Navigasi 8 arah, tembakan laser, dan gelombang tantangan)
- **Neon Puzzle Grid** (Matriks ubin logika, kombo warna, dan reaksi berantai)
- **Endless Runner / Dodger** (Refleks cepat menghindari rintangan berkecepatan dinamis)

Setiap genre di atas dapat Anda kembangkan untuk **game arcade seru** maupun **bertema misi edukasi / pembelajaran interaktif**.

Ceritakan ide game Anda atau klik salah satu kartu di bawah untuk langsung mulai!`,
  timestamp: Date.now(),
};

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = getStoredMessages();
    // Auto-clean any empty or corrupted assistant messages
    const cleaned = stored.filter(
      (m) => m.id === 'welcome-init' || m.role === 'user' || (m.content && m.content.trim() !== '') || m.extractedCode
    );
    if (cleaned.length === 1 && cleaned[0].id === 'welcome-init') {
      return [INITIAL_WELCOME_MESSAGE];
    }
    return cleaned.length > 0 ? cleaned : [INITIAL_WELCOME_MESSAGE];
  });
  const [versions, setVersions] = useState<GameVersion[]>(() => getStoredVersions());
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [activeCode, setActiveCode] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState<string>('AISYS Game');

  // Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  // Split-screen Resizable Divider (percentage of left panel)
  const [splitWidth, setSplitWidth] = useState<number>(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply Theme to DOM
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Sync latest shared skill from server on load (Zero-DB hard-refresh sync)
  useEffect(() => {
    fetchSharedSkill().then((sharedPrompt) => {
      if (sharedPrompt && sharedPrompt.trim()) {
        setSettings((prev) => {
          const updated = { ...prev, systemPrompt: sharedPrompt };
          saveStoredSettings(updated);
          return updated;
        });
      }
    });
  }, []);

  // Sync versions to active code
  useEffect(() => {
    if (versions.length > 0) {
      const idx = Math.min(currentVersionIndex, versions.length - 1);
      setActiveCode(versions[idx].code);
      setActiveTitle(versions[idx].title);
    }
  }, [versions, currentVersionIndex]);

  // In-Game Iframe Console Bridge Listener
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'AISYS_CONSOLE') {
        const item: ConsoleLogItem = {
          id: Math.random().toString(36).substring(2),
          type: e.data.level || 'log',
          message: e.data.text,
          timestamp: Date.now(),
        };
        setLogs((prev) => [...prev.slice(-200), item]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Divider Resizing Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 20 && newWidth <= 75) {
        setSplitWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Model change from header or settings
  const handleModelChange = (newModel: ModelOption) => {
    const updated = { ...settings, model: newModel };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // New Chat / Reset Session
  const handleNewChat = () => {
    if (messages.length > 1) {
      if (!window.confirm('Mulai game baru? Percakapan saat ini akan di-reset.')) {
        return;
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setVersions([]);
    setActiveCode('');
    setActiveTitle('AISYS Game');
    setLogs([]);
    clearSessionStorage();
  };

  // Save Settings Modal
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Save Skill Prompt Modal
  const handleSaveSkill = (newPrompt: string) => {
    const updated = { ...settings, systemPrompt: newPrompt };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || currentInput;
    if (!text.trim() || isStreaming) return;

    if (!settings.apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const assistantId = Math.random().toString(36).substring(2);
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMessage, assistantMessage];
    setMessages(updatedMessages);
    setCurrentInput('');
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    // Prepare History for API: Exclude initial greeting and purge any empty assistant messages
    const apiHistory = updatedMessages
      .slice(0, -1) // Exclude the newly added empty in-flight assistant placeholder
      .filter((m) => m.id !== 'welcome-init')
      .map((m) => ({
        role: m.role,
        content: m.role === 'assistant' && m.extractedCode
          ? `${m.content ? m.content.trim() + '\n\n' : ''}\`\`\`html\n${m.extractedCode}\n\`\`\``
          : m.content.trim(),
      }))
      .filter((m) => m.content.length > 0); // Strictly ensure no empty content reaches API

    await sendDeepSeekMessage({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      history: apiHistory,
      signal: abortControllerRef.current.signal,
      onChunk: (_delta, fullText, isThinking) => {
        const parsed = extractHtmlFromStream(fullText);

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantId) {
              return {
                ...m,
                content: parsed.displayText,
                extractedCode: parsed.code || undefined,
                codeLineCount: parsed.lineCount,
                isStreaming: true,
                isThinking: Boolean(isThinking && !fullText),
              };
            }
            return m;
          })
        );

        if (parsed.code) {
          setActiveCode(parsed.code);
          const detectedTitle = extractGameTitle(parsed.code, text.slice(0, 30));
          setActiveTitle(detectedTitle);
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = prev.map((m) => {
            if (m.id === assistantId) {
              return {
                ...m,
                content: m.content
                  ? `${m.content}\n\n⚠️ **Error:** ${err.message}`
                  : `⚠️ **Gagal memproses permintaan:**\n${err.message}`,
                isStreaming: false,
              };
            }
            return m;
          });
          saveStoredMessages(updated);
          return updated;
        });
      },
      onFinish: (fullText) => {
        setIsStreaming(false);
        const parsed = extractHtmlFromStream(fullText);

        setMessages((prev) => {
          const updated = prev.map((m) => {
            if (m.id === assistantId) {
              return {
                ...m,
                content: parsed.displayText || fullText || m.content,
                extractedCode: parsed.code || undefined,
                codeLineCount: parsed.lineCount,
                isStreaming: false,
                timestamp: Date.now(),
              };
            }
            return m;
          });
          saveStoredMessages(updated);
          return updated;
        });

        if (parsed.code && parsed.code.length > 50) {
          const title = extractGameTitle(parsed.code, text.slice(0, 30));
          setVersions((prevVersions) => {
            const newVersion: GameVersion = {
              id: Math.random().toString(36).substring(2),
              version: prevVersions.length + 1,
              code: parsed.code!,
              title,
              timestamp: Date.now(),
              prompt: text.slice(0, 50),
            };
            const newVersions = [...prevVersions, newVersion];
            setCurrentVersionIndex(newVersions.length - 1);
            saveStoredVersions(newVersions);
            return newVersions;
          });
          setActiveCode(parsed.code);
          setActiveTitle(title);
        }
      },
    });
  };

  // Fix Error with AI
  const handleFixWithAI = (errorMsg: string) => {
    setActiveTab('preview');
    handleSendMessage(`Terdapat bug/error pada game saat dimainkan: "${errorMsg}". Tolong perbaiki kode game tersebut.`);
  };

  // Navigations
  const handleEnterStudio = (presetPrompt?: string) => {
    setCurrentView('studio');
    if (presetPrompt) {
      setTimeout(() => {
        handleSendMessage(presetPrompt);
      }, 100);
    }
  };

  const handleOpenSkillClick = () => {
    if (isAdmin) {
      setIsSkillOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    setIsAdminLoginOpen(false);
    setIsSkillOpen(true);
  };

  return (
    <div
      className={
        currentView === 'landing'
          ? 'min-h-screen w-full bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 overflow-y-auto font-sans'
          : 'h-screen w-screen bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 overflow-hidden font-sans'
      }
    >
      {currentView === 'landing' ? (
        <LandingPage
          onEnterStudio={handleEnterStudio}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          isAdmin={isAdmin}
          onOpenSkillModal={() => setIsSkillOpen(true)}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        <div className="h-full w-full flex flex-col overflow-hidden">
          {/* Top Header */}
          <Header
            currentModel={settings.model}
            onModelChange={handleModelChange}
            isStreaming={isStreaming}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            onNewChat={handleNewChat}
            onOpenSkillModal={handleOpenSkillClick}
            onOpenSettingsModal={() => setIsSettingsOpen(true)}
            onGoHome={() => setCurrentView('landing')}
            isAdmin={isAdmin}
          />

          {/* Main Workspace (Split Screen) */}
          <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
            {/* Left Panel: Chat Workspace */}
            <div
              style={{ width: `${splitWidth}%` }}
              className="h-full flex flex-col min-w-[280px]"
            >
              <ChatPanel
                messages={messages}
                isStreaming={isStreaming}
                currentInput={currentInput}
                onInputChange={setCurrentInput}
                onSendMessage={handleSendMessage}
                onStopStreaming={handleStopStreaming}
                hasApiKey={Boolean(settings.apiKey)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSelectTab={setActiveTab}
              />
            </div>

            {/* Resizable Divider */}
            <div
              onMouseDown={() => setIsDragging(true)}
              className={`w-1 cursor-col-resize relative z-10 transition-colors select-none ${
                isDragging
                  ? 'bg-[#F6821F]'
                  : 'bg-slate-200 dark:bg-[#282B33] hover:bg-[#F6821F]/60'
              }`}
            />

            {/* Right Panel: Artifact Workspace */}
            <div
              style={{ width: `${100 - splitWidth}%` }}
              className="h-full flex flex-col min-w-[360px]"
            >
              <PreviewPanel
                gameCode={activeCode}
                gameTitle={activeTitle}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                versions={versions}
                currentVersionIndex={currentVersionIndex}
                onSelectVersion={setCurrentVersionIndex}
                logs={logs}
                onClearLogs={() => setLogs([])}
                onFixWithAI={handleFixWithAI}
                isStreaming={isStreaming}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <SkillModal
        isOpen={isSkillOpen}
        onClose={() => setIsSkillOpen(false)}
        systemPrompt={settings.systemPrompt}
        onSavePrompt={handleSaveSkill}
        isAdmin={isAdmin}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}

export default App;
