/**
 * Studio Cerita UI markers (prompt v4.0). At the end of each design step the model writes:
 *   [[LANGKAH: 3/11 | Dunia]]
 *   [[PILIHAN: Hutan ajaib | Kota masa depan | Dalam tubuh manusia]]
 *   [[CERITA: Pahlawan = Miko, kucing ninja]]
 * The chat hides these lines and turns them into option buttons, a progress bar and a story card.
 */
import type { Message } from '../types';

export interface StepInfo {
  n: number;
  total: number;
  name: string;
}

export interface StoryFact {
  key: string;
  value: string;
}

export interface ParsedMarkers {
  clean: string;
  step: StepInfo | null;
  options: string[];
  facts: StoryFact[];
}

const MARKER = /\[\[\s*(LANGKAH|PILIHAN|CERITA)\s*:\s*([^\]]*?)\s*\]\]/gi;

/** Order used by the story card. */
export const STORY_KEYS = ['Genre', 'Pahlawan', 'Dunia', 'Misi', 'Lawan', 'Materi', 'Mekanik', 'Twist', 'Visual', 'Ending'];

export function parseMarkers(text: string): ParsedMarkers {
  let step: StepInfo | null = null;
  const options: string[] = [];
  const facts: StoryFact[] = [];
  let m: RegExpExecArray | null;
  MARKER.lastIndex = 0;
  while ((m = MARKER.exec(text))) {
    const kind = m[1].toUpperCase();
    const body = m[2];
    if (kind === 'LANGKAH') {
      const sm = body.match(/(\d+)\s*\/\s*(\d+)\s*(?:\|\s*(.*))?/);
      if (sm) step = { n: Number(sm[1]), total: Number(sm[2]) || 11, name: (sm[3] || '').trim().slice(0, 40) };
    } else if (kind === 'PILIHAN') {
      for (const o of body.split('|')) {
        const t = o.trim().slice(0, 60);
        if (t && options.length < 4) options.push(t);
      }
    } else if (kind === 'CERITA') {
      const i = body.indexOf('=');
      if (i > 0) {
        const key = body.slice(0, i).trim().slice(0, 20);
        const value = body.slice(i + 1).trim().slice(0, 80);
        if (key && value) facts.push({ key, value });
      }
    }
  }
  // Remove complete markers, then any half-written marker at the end of a streaming message
  let clean = text.replace(MARKER, '');
  const open = clean.lastIndexOf('[[');
  if (open >= 0 && clean.indexOf(']]', open) < 0) clean = clean.slice(0, open);
  clean = clean.replace(/\n{3,}/g, '\n\n').trimEnd();
  return { clean, step, options, facts };
}

/** Story facts collected over the whole conversation (a later answer for the same key wins). */
export function collectStory(messages: Message[]): StoryFact[] {
  const map = new Map<string, string>();
  for (const msg of messages) {
    if (msg.role !== 'assistant' || !msg.content) continue;
    for (const f of parseMarkers(msg.content).facts) map.set(f.key, f.value);
  }
  const ordered = STORY_KEYS.filter((k) => map.has(k)).map((k) => ({ key: k, value: map.get(k)! }));
  const extra = [...map.keys()].filter((k) => !STORY_KEYS.includes(k)).map((k) => ({ key: k, value: map.get(k)! }));
  return [...ordered, ...extra];
}

/** Latest step marker in the conversation, for the progress bar. */
export function latestStep(messages: Message[]): StepInfo | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !msg.content) continue;
    const s = parseMarkers(msg.content).step;
    if (s) return s;
  }
  return null;
}
