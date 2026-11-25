#!/usr/bin/env node
/**
 * AISYS model evaluation harness (handoff Lampiran B).
 *
 * Runs the real Sesi 1-7 conversation against the gateway for each trial in trials.json,
 * with scripted user answers, then measures the Sesi 7 manifest: extraction, validator,
 * selfTest (Node), fields outside the cheat-sheet, hooks, trap handling, and one automatic
 * repair turn when the first manifest fails.
 *
 * API key: read from env VITE_DEFAULT_API_KEY (or SUMOPOD_API_KEY), or from .env.local / .env
 * at the repo root. The key is never printed or written to the results.
 *
 * Usage:
 *   node scripts/eval/run-eval.mjs [--only id1,id2] [--concurrency 2] [--model deepseek-flash] [--out dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSync } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);

// ---------------------------------------------------------------- config
const MODEL = args.model || 'deepseek-flash';
const BASE_URL = 'https://ai.sumopod.com/v1/chat/completions';
// Same generation params as src/utils/deepseekStream.ts (what Studio users get)
const GEN = { temperature: 0.4, max_tokens: 32768, reasoning_effort: 'none' };
const CONCURRENCY = Number(args.concurrency || 2);
const MAX_EXTRA_NUDGES = 2;

function readKey() {
  const fromEnv = (process.env.VITE_DEFAULT_API_KEY || process.env.SUMOPOD_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  for (const f of ['.env.local', '.env']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(VITE_DEFAULT_API_KEY|SUMOPOD_API_KEY)\s*=\s*"?([^"\s]+)"?\s*$/);
      if (m) return m[2];
    }
  }
  return '';
}
const DRY = 'dry' in args; // --dry 1 : offline check of the measuring code, no API calls
const API_KEY = DRY ? '' : readKey();
if (!DRY && !API_KEY) {
  console.error('No API key. Set VITE_DEFAULT_API_KEY in the environment or in .env.local (gitignored).');
  process.exit(2);
}

const skill = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/skill-config.json'), 'utf8'));
const SYSTEM_PROMPT = skill.systemPrompt;
const { trials } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/eval/trials.json'), 'utf8'));
const runtimeSrc = fs.readFileSync(path.join(ROOT, 'src/runtime/aisys-runtime.js'), 'utf8');

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.resolve(ROOT, args.out || `scripts/eval/results/${stamp}`);
fs.mkdirSync(path.join(OUT, 'transcripts'), { recursive: true });

// ---------------------------------------------------------------- extractor (the app's own code)
const extractorJs = buildSync({
  entryPoints: [path.join(ROOT, 'src/utils/htmlExtractor.ts')],
  bundle: true, format: 'esm', platform: 'node', write: false,
}).outputFiles[0].text;
const extractorPath = path.join(OUT, '.htmlExtractor.mjs');
fs.writeFileSync(extractorPath, extractorJs);
const { extractHtmlFromStream } = await import(pathToFileURL(extractorPath).href);

// ---------------------------------------------------------------- runtime in Node (mock canvas)
function loadRuntime() {
  const ctx2d = new Proxy({}, {
    get: (t, k) => {
      if (k === 'measureText') return (s) => ({ width: String(s || '').length * 8 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'getImageData') return undefined; // render check is not meaningful in Node
      return () => {};
    },
    set: () => true,
  });
  const win = {
    location: { search: '' }, addEventListener() {}, removeEventListener() {},
    document: {
      readyState: 'complete', hidden: false, addEventListener() {},
      createElement: () => ({ width: 320, height: 180, style: {}, getContext: () => ctx2d }),
    },
  };
  const storage = { getItem: () => null, setItem() {} };
  new Function('window', 'document', 'localStorage', 'performance', 'requestAnimationFrame', 'globalThis', runtimeSrc)(
    win, win.document, storage, { now: () => Date.now() }, () => 1, win
  );
  return win.AISYS;
}
const AISYS = loadRuntime();

/** Execute manifest code with a stub AISYS.defineGame and return the object passed to it. */
function captureManifest(code) {
  let captured = null;
  const sandbox = { AISYS: { defineGame: (m) => { captured = m; return m; } } };
  vm.runInNewContext(code, sandbox, { timeout: 1000 });
  return captured;
}

// ---------------------------------------------------------------- cheat-sheet field whitelist
const ALLOWED = {
  '': ['schema', 'kit', 'id', 'title', 'seed', 'theme', 'player', 'world', 'spawner', 'rules', 'learning', 'hud', 'hooks', 'story'],
  theme: ['preset'],
  player: ['x', 'w', 'h', 'gravity', 'jumpVelocity', 'lives', 'invulnerableSec'],
  world: ['groundY', 'speed', 'maxSpeed', 'accel', 'layers'],
  spawner: ['interval', 'table'],
  'spawner.table[hazard]': ['type', 'id', 'w', 'h', 'weight'],
  'spawner.table[item]': ['type', 'weight', 'heights'],
  rules: ['perSecond', 'correct', 'wrong', 'hazard', 'combo', 'difficulty'],
  'rules.correct': ['score', 'sfx'],
  'rules.wrong': ['score', 'sfx', 'showExplain'],
  'rules.hazard': ['lives', 'sfx', 'shake'],
  'rules.combo': ['step', 'max'],
  'rules.difficulty': ['everySec', 'speed'],
  learning: ['subject', 'concept', 'objectives', 'misconceptions', 'mode', 'categories', 'items', 'target'],
  'learning.categories[]': ['id', 'label', 'color'],
  'learning.items[]': ['id', 'label', 'category', 'explain'],
  'learning.target': ['rotateAfterCorrect', 'bias'],
  hooks: ['onStart', 'onJump', 'onTick', 'onCollect', 'onHit', 'onGameOver'],
};
function unknownFields(m) {
  const out = [];
  const check = (obj, key, label) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const k of Object.keys(obj)) if (!ALLOWED[key].includes(k)) out.push(`${label ? label + '.' : ''}${k}`);
  };
  check(m, '', '');
  for (const k of ['theme', 'player', 'world', 'spawner', 'rules', 'learning', 'hooks']) check(m[k], k, k);
  for (const k of ['correct', 'wrong', 'hazard', 'combo', 'difficulty']) check(m.rules?.[k], `rules.${k}`, `rules.${k}`);
  for (const e of m.spawner?.table || []) {
    if (e?.type === 'hazard' || e?.type === 'item') check(e, `spawner.table[${e.type}]`, `spawner.table[${e.type}]`);
    else out.push(`spawner.table[type=${e?.type}]`);
  }
  for (const c of m.learning?.categories || []) check(c, 'learning.categories[]', 'learning.categories[]');
  for (const it of m.learning?.items || []) check(it, 'learning.items[]', 'learning.items[]');
  check(m.learning?.target, 'learning.target', 'learning.target');
  return [...new Set(out)];
}

// ---------------------------------------------------------------- gateway
async function chat(messages) {
  const t0 = Date.now();
  for (let attempt = 1; attempt <= 3; attempt++) {
    let res;
    try {
      res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], stream: false, ...GEN }),
        signal: AbortSignal.timeout(300_000),
      });
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 5000 * attempt;
      if (attempt === 3) throw new Error(`HTTP ${res.status}`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = await res.json();
    const choice = j.choices?.[0] || {};
    return {
      content: choice.message?.content || '',
      reasoningChars: (choice.message?.reasoning_content || '').length,
      finishReason: choice.finish_reason || null,
      usage: j.usage || {},
      ms: Date.now() - t0,
    };
  }
}

// ---------------------------------------------------------------- one trial
// Prompt v3.0 flow: Sesi 1 genre, 2 tipe & topik, 3 inti mekanik, 4 visual, 5 kesulitan / aksi spesial, 6 PRD.
// A misconception (s5) is folded into the topic answer, since v3.0 lets the AI propose it in the PRD.
function userAnswers(t) {
  // Prompt v4 (Studio Cerita): 11 design answers listed in the trial, then the build confirmation
  if (Array.isArray(t.answers)) return ['Halo kak, aku mau bikin game!', ...t.answers, 'Lanjut, bangun game sekarang!'];
  return [
    'Halo, saya ingin membuat game baru.',
    t.genre || 'Endless Runner',
    t.s5 ? `${t.s1} ${t.s5}` : t.s1,
    t.s2 || 'A',
    t.s3,
    t.s4,
    'Lanjut',
  ];
}

const isHtmlGame = (code) => /^\s*(<!DOCTYPE\s+html|<html)/i.test(code || '');

/** Story data required by prompt v4 (rendered by src/runtime/aisys-story.js). */
function storyCheck(s) {
  const problems = [];
  if (!s || typeof s !== 'object') return { ok: false, problem: 'story bukan objek' };
  if (!s.title) problems.push('title kosong');
  if (!s.hero || !s.hero.name) problems.push('hero.name kosong');
  if (!Array.isArray(s.prolog) || s.prolog.length !== 3) problems.push(`prolog ${Array.isArray(s.prolog) ? s.prolog.length : 0} panel (harus 3)`);
  if (!s.ending || !s.ending.menang || !s.ending.kalah) problems.push('ending menang/kalah tidak lengkap');
  return { ok: problems.length === 0, problem: problems.join('; ') || undefined, title: s.title, hero: s.hero?.name, goalCorrect: s.goal?.correct ?? null, prolog: (s.prolog || []).map((p) => (typeof p === 'string' ? p : p?.text)) };
}

/** UI markers required at the end of every design step (prompt v4). */
function markerCheck(text) {
  const step = text.match(/\[\[\s*LANGKAH\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  const opts = text.match(/\[\[\s*PILIHAN\s*:\s*([^\]]*)\]\]/i);
  const facts = [...text.matchAll(/\[\[\s*CERITA\s*:\s*([^=\]]+)=/gi)].map((m) => m[1].trim());
  return { step: step ? Number(step[1]) : null, options: opts ? opts[1].split('|').filter((o) => o.trim()).length : 0, facts, words: text.replace(/\[\[[^\]]*\]\]/g, '').split(/\s+/).filter(Boolean).length };
}

function measure(code) {
  const r = { extracted: Boolean(code) };
  if (!code) return r;
  r.lines = code.split('\n').length;
  if (isHtmlGame(code)) {
    // Beta genres (SESI 7B): no validator/selfTest; runtime behaviour is checked in a real browser separately
    r.mode = 'html';
    r.hasEndMarker = /<!--\s*END_OF_GAME\s*-->/i.test(code);
    r.mentionsWatermark = /AISYS HTML5 Engine/.test(code);
    r.unknownFields = [];
    const sm = code.match(/<script[^>]*id=["']aisys-story["'][^>]*>([\s\S]*?)<\/script>/i);
    if (sm) {
      try { r.story = storyCheck(JSON.parse(sm[1])); } catch (e) { r.story = { ok: false, problem: 'JSON tidak valid: ' + String(e).slice(0, 80) }; }
    } else {
      r.story = { ok: false, problem: 'tidak ada <script id="aisys-story">' };
    }
    // AISYS.end may be called with literals or a ternary (AISYS.end(win ? "menang" : "kalah"))
    const endCalls = [...code.matchAll(/AISYS\.end\(([^)]*)\)/g)].map((m) => m[1]).join(' ');
    r.callsEnd = /["']menang["']/.test(endCalls) && /["']kalah["']/.test(endCalls);
    return r;
  }
  r.mode = 'manifest';
  r.hasCatatan = /^\s*\/\/\s*CATATAN/m.test(code);
  let m;
  try { m = captureManifest(code); } catch (e) { r.execError = String(e).slice(0, 200); return r; }
  if (!m) { r.execError = 'defineGame not called'; return r; }
  r.unknownFields = unknownFields(m);
  r.story = m.story ? storyCheck(m.story) : { ok: false, problem: 'tidak ada field story' };
  r.preset = m.theme?.preset || null;
  r.world = m.world ? { speed: m.world.speed, maxSpeed: m.world.maxSpeed, accel: m.world.accel } : null;
  r.lives = m.player?.lives ?? null;
  r.difficulty = m.rules?.difficulty || null;
  r.hasLearning = Boolean(m.learning);
  r.hookNames = Object.keys(m.hooks || {});
  r.hookLines = r.hookNames.length ? (code.match(/hooks\s*:\s*\{[\s\S]*$/)?.[0].split('\n').length || 0) : 0;
  if (m.learning) {
    const cats = m.learning.categories || [];
    const items = m.learning.items || [];
    r.categories = cats.length;
    r.items = items.length;
    r.minItemsPerCategory = cats.length ? Math.min(...cats.map((c) => items.filter((i) => i.category === c.id).length)) : 0;
    r.maxExplainLen = Math.max(0, ...items.map((i) => String(i.explain || '').length));
    r.duplicateIds = items.length - new Set(items.map((i) => i.id)).size;
    r.misconceptions = m.learning.misconceptions || [];
    r.content = items.map((i) => ({ id: i.id, label: i.label, category: i.category, explain: i.explain }));
    r.categoryLabels = cats.map((c) => `${c.id}=${c.label}`);
  }
  const v = AISYS.validate(captureManifest(code));
  r.valid = v.valid;
  r.validatorErrors = v.errors;
  r.validatorWarnings = v.warnings;
  if (v.valid) {
    const st = AISYS.selfTest(captureManifest(code));
    // render is not meaningful in Node; judge selfTest on the other 8 checks
    const checks = st.checks.map((c) => ({ id: c.id, pass: c.pass, status: c.status, detail: c.pass ? undefined : c.detail }));
    r.selfTestChecks = checks;
    r.selfTestOk = checks.filter((c) => c.id !== 'render').every((c) => c.pass);
  }
  return r;
}

function failureSummary(ex, ms) {
  if (!ex.code) return 'Tidak ada blok manifest ```js yang terdeteksi.';
  if (!ex.isComplete) return isHtmlGame(ex.code)
    ? 'Dokumen HTML tidak lengkap: </html> atau <script> belum tertutup, atau kode terlalu pendek.'
    : 'Manifest tidak lengkap: penanda // END_OF_MANIFEST tidak ada atau sintaks JavaScript belum tertutup.';
  if (ms.mode === 'html') return null;
  if (ms.execError) return `Manifest melempar error saat dijalankan: ${ms.execError}`;
  if (!ms.valid) return `Validator menolak manifest: ${ms.validatorErrors.join('; ')}`;
  if (!ms.selfTestOk) return `selfTest gagal: ${ms.selfTestChecks.filter((c) => !c.pass && c.id !== 'render').map((c) => `${c.id}: ${c.detail}`).join('; ')}`;
  return null;
}

async function runTrial(t) {
  const msgs = [];
  const turns = [];
  const answers = userAnswers(t);
  let sesi7 = null;

  for (let i = 0; i < answers.length + MAX_EXTRA_NUDGES; i++) {
    const userText = i < answers.length ? answers[i] : 'Lanjut, buat game sekarang.';
    msgs.push({ role: 'user', content: userText });
    const r = await chat(msgs);
    msgs.push({ role: 'assistant', content: r.content });
    turns.push({ user: userText, finishReason: r.finishReason, usage: r.usage, ms: r.ms, reasoningChars: r.reasoningChars, markers: markerCheck(r.content) });
    const ex = extractHtmlFromStream(r.content);
    if (ex.code) { sesi7 = { turnIndex: i, r, ex, early: i < answers.length - 1 }; break; }
    if (i >= answers.length - 1 && i >= answers.length + MAX_EXTRA_NUDGES - 1) break;
  }

  const result = { id: t.id, topic: t.topic, variant: t.variant, trap: t.trap || null, expected: { preset: t.s3, difficulty: t.s4 } };
  result.turns = turns.length;
  result.totalPromptTokens = turns.reduce((s, x) => s + (x.usage.prompt_tokens || 0), 0);
  result.totalCompletionTokens = turns.reduce((s, x) => s + (x.usage.completion_tokens || 0), 0);
  result.maxReasoningChars = Math.max(0, ...turns.map((x) => x.reasoningChars));

  if (!sesi7) {
    result.sesi7 = null;
    result.firstPass = false;
  } else {
    result.sesi7 = {
      turnIndex: sesi7.turnIndex, earlyManifest: sesi7.early,
      finishReason: sesi7.r.finishReason, completionTokens: sesi7.r.usage.completion_tokens ?? null,
      ms: sesi7.r.ms, isPlayable: sesi7.ex.isComplete, outsideText: sesi7.ex.displayText,
    };
    const ms = measure(sesi7.ex.isComplete ? sesi7.ex.code : null);
    result.first = ms;
    const fail = failureSummary(sesi7.ex, ms);
    result.firstPass = !fail;
    result.firstFailure = fail;

    if (fail) {
      // One automatic repair turn: send the diagnostic back and ask for a corrected full manifest
      const repairMsg = isHtmlGame(sesi7.ex.code)
        ? `Game belum bisa dijalankan. ${fail}\nKirim ulang seluruh game dalam tepat satu blok \`\`\`html dari <!DOCTYPE html> sampai </html> lalu <!-- END_OF_GAME -->, tanpa penjelasan panjang.`
        : `Manifest belum bisa dijalankan. ${fail}\nPerbaiki dan kirim ulang manifest lengkap dalam tepat satu blok \`\`\`js yang diakhiri // END_OF_MANIFEST, tanpa penjelasan panjang.`;
      msgs.push({ role: 'user', content: repairMsg });
      const r2 = await chat(msgs);
      msgs.push({ role: 'assistant', content: r2.content });
      turns.push({ user: repairMsg, finishReason: r2.finishReason, usage: r2.usage, ms: r2.ms, reasoningChars: r2.reasoningChars });
      const ex2 = extractHtmlFromStream(r2.content);
      const ms2 = measure(ex2.isComplete ? ex2.code : null);
      result.repair = { finishReason: r2.finishReason, completionTokens: r2.usage.completion_tokens ?? null, ms: r2.ms, isPlayable: ex2.isComplete, measure: ms2, failure: failureSummary(ex2, ms2) };
      result.repairPass = !result.repair.failure;
    }
  }

  fs.writeFileSync(path.join(OUT, 'transcripts', `${t.id}.json`), JSON.stringify({ id: t.id, model: MODEL, gen: GEN, turns, messages: msgs }, null, 2));
  return result;
}

// ---------------------------------------------------------------- dry run (offline)
if (DRY) {
  const handoff = fs.readFileSync(path.join(ROOT, 'HANDOFF-AISYS-game-engine.md'), 'utf8').replace(/\r\n/g, '\n');
  const example = handoff.split('```js\n')[1].split('\n```')[0];
  const samples = {
    'lampiran-a': '```js\n' + example + '\n```',
    'catatan+unknown-field': '```js\n// CATATAN: lompat ganda dipetakan ke lompat biasa\n' + example.replace('seed: "ecosort-01",', 'seed: "ecosort-01", doubleJump: true,') + '\n```',
    'too-wide-hazard': '```js\n' + example.replace('w: 90, h: 24', 'w: 140, h: 100') + '\n```',
    'truncated': '```js\n' + example.slice(0, 600) + '\n```',
  };
  for (const [name, text] of Object.entries(samples)) {
    const ex = extractHtmlFromStream(text);
    const ms = measure(ex.isComplete ? ex.code : null);
    console.log(name, JSON.stringify({ playable: ex.isComplete, failure: failureSummary(ex, ms), unknown: ms.unknownFields, catatan: ms.hasCatatan, preset: ms.preset, items: ms.items, minPerCat: ms.minItemsPerCategory, warnings: ms.validatorWarnings, selfTest: ms.selfTestChecks?.map((c) => `${c.id}=${c.status}`).join(',') }));
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  process.exit(0);
}

// ---------------------------------------------------------------- run
const selected = args.only ? trials.filter((t) => args.only.split(',').includes(t.id)) : trials;
const meta = { startedAt: new Date().toISOString(), model: MODEL, gen: GEN, promptVersion: skill.version, runtimeVersion: AISYS.version, trials: selected.length };
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(`Eval: ${selected.length} trials, model=${MODEL}, prompt v${skill.version}, runtime v${AISYS.version}, concurrency=${CONCURRENCY}`);
console.log(`Output: ${OUT}`);

const results = [];
let next = 0;
async function worker() {
  while (next < selected.length) {
    const t = selected[next++];
    const t0 = Date.now();
    try {
      const r = await runTrial(t);
      results.push(r);
      fs.appendFileSync(path.join(OUT, 'results.jsonl'), JSON.stringify(r) + '\n');
      console.log(`[${results.length}/${selected.length}] ${t.id}: firstPass=${r.firstPass}${r.firstFailure ? ` (${r.firstFailure.slice(0, 90)})` : ''}${'repairPass' in r ? ` repairPass=${r.repairPass}` : ''} turns=${r.turns} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    } catch (e) {
      const r = { id: t.id, topic: t.topic, variant: t.variant, error: String(e).slice(0, 300) };
      results.push(r);
      fs.appendFileSync(path.join(OUT, 'results.jsonl'), JSON.stringify(r) + '\n');
      console.log(`[${results.length}/${selected.length}] ${t.id}: ERROR ${r.error}`);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, worker));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ ...meta, finishedAt: new Date().toISOString() }, null, 2));
fs.rmSync(extractorPath, { force: true });
console.log('Done.');
