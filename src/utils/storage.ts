import { AppSettings, Message, GameVersion } from '../types';
import { DEFAULT_SKILL_PROMPT } from '../config/defaultSkill';

const SETTINGS_KEY = 'aisys_settings_v1';
const MESSAGES_KEY = 'aisys_messages_v1';
const VERSIONS_KEY = 'aisys_versions_v1';
const ADMIN_TOKEN_KEY = 'aisys_admin_token';

export const getCampusDefaultApiKey = (): string => {
  return ((import.meta.env.VITE_DEFAULT_API_KEY as string) || '').trim();
};

export const getEffectiveApiKey = (customKey?: string): string => {
  const custom = customKey?.trim() || '';
  if (custom) return custom;
  return getCampusDefaultApiKey();
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: getCampusDefaultApiKey(),
  model: 'deepseek-v4-flash',
  baseUrl: 'https://ai.sumopod.com/v1',
  systemPrompt: DEFAULT_SKILL_PROMPT,
  theme: 'dark',
  migrationVersion: 2,
};

export const getStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Auto-fix if user has old invalid domain api.sumopod.com
    let baseUrl = parsed.baseUrl || DEFAULT_SETTINGS.baseUrl;
    if (baseUrl.includes('api.sumopod.com')) {
      baseUrl = baseUrl.replace('api.sumopod.com', 'ai.sumopod.com');
    }

    const customKey = (parsed.apiKey || '').trim();
    const effectiveKey = customKey || getCampusDefaultApiKey();

    // Migration 2 (one time): default model is deepseek-v4-flash, the model evaluated in docs/eval.
    // The old code forced every stored setting to deepseek-flash on each load (a workaround for
    // truncation caused by thinking mode, now disabled via reasoning_effort: 'none'), so stored
    // 'deepseek-flash' values were not a user choice. After this runs once, the user's pick is kept.
    let model = parsed.model || DEFAULT_SETTINGS.model;
    const migrationVersion = typeof parsed.migrationVersion === 'number' ? parsed.migrationVersion : 0;
    if (migrationVersion < 2) {
      model = 'deepseek-v4-flash';
    }

    // Auto-update system prompt if it predates the PRD blueprint review or the manifest flow
    // (prompt v2.0: the model writes an AISYS.defineGame manifest ending in END_OF_MANIFEST, not HTML)
    let systemPrompt = parsed.systemPrompt || DEFAULT_SKILL_PROMPT;
    if (
      systemPrompt.includes('AISYS menyiapkan 4 genre') ||
      !systemPrompt.includes('Sesi 6: Presentasi PRD') ||
      !systemPrompt.includes('END_OF_MANIFEST')
    ) {
      systemPrompt = DEFAULT_SKILL_PROMPT;
    }

    const migratedSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      apiKey: effectiveKey,
      baseUrl,
      model: model as any,
      systemPrompt,
      migrationVersion: Math.max(migrationVersion, 2),
    };

    // Resave if migrated
    if (migrationVersion < 2 || parsed.model !== model || parsed.systemPrompt !== systemPrompt) {
      saveStoredSettings(migratedSettings);
    }

    return migratedSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const getStoredMessages = (): Message[] => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredMessages = (messages: Message[]): void => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save messages:', e);
  }
};

export const getStoredVersions = (): GameVersion[] => {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredVersions = (versions: GameVersion[]): void => {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  } catch (e) {
    console.error('Failed to save versions:', e);
  }
};

export const clearSessionStorage = (): void => {
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(VERSIONS_KEY);
};

// Admin Session Management
export const isAdminAuthenticated = (): boolean => {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) === 'aisys-admin-authenticated';
};

export const setAdminAuthenticated = (token: string): void => {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminSession = (): void => {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

// Zero-DB Skill Synchronization across all users
export async function fetchSharedSkill(): Promise<string | null> {
  try {
    const res = await fetch(`/skill-config.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.systemPrompt) {
        return data.systemPrompt;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch shared skill, falling back to local:', e);
  }
  return null;
}

export async function saveSharedSkill(systemPrompt: string): Promise<boolean> {
  try {
    const res = await fetch('/api/save-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt }),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to save shared skill to server:', e);
    return false;
  }
}
