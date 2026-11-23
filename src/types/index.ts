export type ModelOption = 'deepseek-v4-flash' | 'deepseek-flash';

export type ViewportMode = 'desktop' | 'mobile';

export type ActiveTab = 'preview' | 'code' | 'console';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  extractedCode?: string;
  codeLineCount?: number;
  isStreaming?: boolean;
  isThinking?: boolean;
  isCodeComplete?: boolean;
}

export interface GameVersion {
  id: string;
  version: number;
  code: string;
  title: string;
  timestamp: number;
  prompt: string;
}

export interface AppSettings {
  apiKey: string;
  model: ModelOption;
  baseUrl: string;
  systemPrompt: string;
  theme: 'dark' | 'light';
}

export interface ConsoleLogItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}
