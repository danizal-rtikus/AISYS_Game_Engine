#!/usr/bin/env node
/**
 * Summarize an eval run (results.jsonl) against the Lampiran B thresholds.
 * Usage: node scripts/eval/summarize.mjs scripts/eval/results/<run> > report.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) { console.error('usage: summarize.mjs <run dir>'); process.exit(2); }
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
const rows = fs.readFileSync(path.join(dir, 'results.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const trialDefs = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'trials.json'), 'utf8')).trials;
const order = trialDefs.map((t) => t.id);
rows.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

const PRESET = { A: 'clean-modern', B: 'neon', C: 'cartoon', D: 'retro-pixel' };
const DIFF = {
  Santai: { speed: 300, maxSpeed: 600, accel: 4, lives: 5, everySec: 20, dspeed: 20 },
  Normal: { speed: 360, maxSpeed: 720, accel: 6, lives: 3, everySec: 15, dspeed: 25 },
  Menantang: { speed: 420, maxSpeed: 720, accel: 10, lives: 3, everySec: 12, dspeed: 30 },
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const pct = (num, den) => (den ? `${num}/${den} (${Math.round((num / den) * 100)}%)` : 'n/a');
const ok = (b) => (b ? '✅' : '❌');

const main = rows.filter((r) => r.variant !== 'jebakan');
const traps = rows.filter((r) => r.variant === 'jebakan');
const withSesi7 = rows.filter((r) => r.sesi7);
const stop = withSesi7.filter((r) => r.sesi7.finishReason === 'stop').length;
const playable = rows.filter((r) => r.sesi7?.isPlayable).length;
const validFirst = rows.filter((r) => r.first?.valid).length;
const selfFirst = rows.filter((r) => r.first?.selfTestOk).length;
const passFirst = rows.filter((r) => r.firstPass).length;
const passAfterRepair = rows.filter((r) => r.firstPass || r.repairPass).length;
const durs = withSesi7.map((r) => r.sesi7.ms / 1000);
const toks = withSesi7.map((r) => r.sesi7.completionTokens).filter((x) => x != null);
const measured = rows.filter((r) => r.first?.unknownFields);
const withUnknown = measured.filter((r) => r.first.unknownFields.length > 0).length;
// Trap handled correctly = the game passes, uses no field outside the cheat-sheet, and the user was told
// the feature is unavailable: either a `// CATATAN` line in the manifest, or a statement in the chat
// before the manifest (the prompt only requires CATATAN when the PRD itself still asks for the feature).
const UNAVAILABLE = /belum\s+(tersedia|didukung|bisa)|tidak\s+(tersedia|didukung)/i;
function trapAcknowledgedInChat(id) {
  const p = path.join(dir, 'transcripts', `${id}.json`);
  if (!fs.existsSync(p)) return false;
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keywords = (trialDefs.find((d) => d.id === id)?.trapKeywords || []).map((k) => k.toLowerCase());
  // A chat message counts only if it says "not available" AND names the trap feature itself
  return t.messages.some((m) => {
    if (m.role !== 'assistant' || m.content.includes('AISYS.defineGame')) return false;
    const c = m.content.toLowerCase();
    return UNAVAILABLE.test(c) && keywords.some((k) => c.includes(k));
  });
}
for (const r of traps) r.trapInChat = trapAcknowledgedInChat(r.id);
const trapOk = traps.filter((r) => {
  const m = r.repairPass && !r.firstPass ? r.repair.measure : r.first;
  return m && m.unknownFields.length === 0 && (r.firstPass || r.repairPass) && (m.hasCatatan || r.trapInChat);
}).length;

const N = rows.length;
const out = [];
out.push(`# Hasil evaluasi model: ${path.basename(dir)}`);
out.push('');
out.push(`- Model: \`${meta.model}\`; parameter: \`${JSON.stringify(meta.gen)}\``);
out.push(`- Prompt v${meta.promptVersion}, runtime v${meta.runtimeVersion}; ${N} percobaan (${main.length} utama + ${traps.length} jebakan)`);
out.push(`- Mulai ${meta.startedAt}, selesai ${meta.finishedAt || '(belum selesai)'}`);
out.push('- selfTest dijalankan di Node: pemeriksaan `render` dilewati dan tidak dihitung (8 pemeriksaan lain dinilai).');
out.push('- "Perbaikan otomatis" di sini = satu giliran tambahan yang mengirim pesan error ke model dan meminta manifest lengkap (bukan patch SEARCH/REPLACE).');
out.push('');
out.push('## Metrik vs ambang (Lampiran B)');
out.push('');
out.push('| Metrik | Hasil | Ambang | Lulus |');
out.push('|---|---|---|---|');
out.push(`| \`finish_reason: "stop"\` (giliran manifest) | ${pct(stop, withSesi7.length)} | ≥ 90% | ${ok(stop / withSesi7.length >= 0.9)} |`);
out.push(`| Manifest terekstrak dan \`isPlayable\` | ${pct(playable, N)} | ≥ 95% | ${ok(playable / N >= 0.95)} |`);
out.push(`| Lolos validator, percobaan pertama | ${pct(validFirst, N)} | ≥ 85% | ${ok(validFirst / N >= 0.85)} |`);
out.push(`| selfTest lolos, percobaan pertama | ${pct(selfFirst, N)} | ≥ 90% | ${ok(selfFirst / N >= 0.9)} |`);
out.push(`| Lolos setelah ≤ 1 perbaikan otomatis | ${pct(passAfterRepair, N)} | ≥ 98% | ${ok(passAfterRepair / N >= 0.98)} |`);
out.push(`| Durasi median giliran manifest | ${median(durs).toFixed(1)} dtk | < 20 dtk | ${ok(median(durs) < 20)} |`);
out.push(`| \`completion_tokens\` median giliran manifest | ${median(toks)} | < 4.000 | ${ok(median(toks) < 4000)} |`);
out.push(`| Manifest dengan field di luar cheat-sheet | ${pct(withUnknown, measured.length)} | < 5% | ${ok(withUnknown / Math.max(1, measured.length) < 0.05)} |`);
out.push(`| PRD jebakan ditangani benar (lolos, tanpa field asing, pengguna diberi tahu lewat \`// CATATAN\` atau chat) | ${trapOk}/${traps.length}${traps.length ? ` (${traps.map((r) => `${r.id}: ${r.first?.hasCatatan ? 'CATATAN' : r.trapInChat ? 'chat' : 'tidak'}`).join(', ')})` : ''} | 2/2 | ${ok(trapOk === traps.length && traps.length === 2)} |`);
out.push('');
out.push(`Total token seluruh percakapan: input ${rows.reduce((s, r) => s + (r.totalPromptTokens || 0), 0).toLocaleString('id-ID')}, output ${rows.reduce((s, r) => s + (r.totalCompletionTokens || 0), 0).toLocaleString('id-ID')}.`);
out.push('');
out.push('## Per percobaan');
out.push('');
out.push('| id | giliran | finish | tok | dtk | playable | valid | selfTest | perbaikan | preset | kesulitan | item (kat, min/kat) | peringatan | field asing | CATATAN |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  if (r.error) { out.push(`| ${r.id} | ERROR: ${r.error} |||||||||||||| |`); continue; }
  const s = r.sesi7, m = r.first || {};
  const expPreset = PRESET[r.expected.preset];
  const d = DIFF[r.expected.difficulty];
  const diffOk = m.world && d && m.world.speed === d.speed && m.world.maxSpeed === d.maxSpeed && m.world.accel === d.accel && m.lives === d.lives && m.difficulty?.everySec === d.everySec && m.difficulty?.speed === d.dspeed;
  const repair = r.firstPass ? '–' : r.repairPass ? '✅' : r.repair ? `❌ ${r.repair.failure?.slice(0, 60)}` : '–';
  out.push(`| ${r.id} | ${r.turns}${s?.earlyManifest ? ' (awal)' : ''} | ${s?.finishReason ?? '–'} | ${s?.completionTokens ?? '–'} | ${s ? (s.ms / 1000).toFixed(1) : '–'} | ${ok(s?.isPlayable)} | ${m.valid === undefined ? '–' : ok(m.valid)} | ${m.selfTestOk === undefined ? '–' : ok(m.selfTestOk)} | ${repair} | ${m.preset ?? '–'}${m.preset && m.preset !== expPreset ? ` ⚠️ (minta ${expPreset})` : ''} | ${r.expected.difficulty} ${m.world ? ok(diffOk) : '–'} | ${m.hasLearning ? `${m.items} (${m.categories}, ${m.minItemsPerCategory})` : (r.variant === 'arcade' ? 'arcade ✅' : 'tanpa learning ⚠️')} | ${m.validatorWarnings?.length ?? '–'} | ${m.unknownFields?.length ? m.unknownFields.join(', ') : '–'} | ${m.hasCatatan ? 'ya' : '–'} |`);
}
out.push('');
const fails = rows.filter((r) => r.firstFailure || r.error);
if (fails.length) {
  out.push('## Kegagalan percobaan pertama');
  out.push('');
  for (const r of fails) out.push(`- **${r.id}**: ${r.error || r.firstFailure}${r.repair ? ` → setelah perbaikan: ${r.repair.failure || 'lolos'}` : ''}`);
  out.push('');
}
const warn = rows.filter((r) => r.first?.validatorWarnings?.length);
if (warn.length) {
  out.push('## Peringatan validator (lolos, tetapi ada nilai yang di-clamp)');
  out.push('');
  for (const r of warn) out.push(`- **${r.id}**: ${r.first.validatorWarnings.join('; ')}`);
  out.push('');
}
out.push('## Konten belajar untuk ditinjau dosen');
out.push('');
out.push('Klasifikasi dan `explain` di bawah ini **belum diperiksa kebenarannya**. Tandai item yang salah sebelum game dibagikan.');
out.push('');
for (const r of rows.filter((x) => x.first?.content)) {
  const m = r.first;
  out.push(`### ${r.id}`);
  out.push('');
  out.push(`Kategori: ${m.categoryLabels.join(', ')}. Miskonsepsi: ${m.misconceptions.join('; ') || '–'}. ${m.duplicateIds ? `⚠️ ${m.duplicateIds} id ganda. ` : ''}${m.maxExplainLen > 120 ? `⚠️ explain terpanjang ${m.maxExplainLen} karakter. ` : ''}`);
  out.push('');
  out.push('| Item | Kategori | explain |');
  out.push('|---|---|---|');
  for (const it of m.content) out.push(`| ${it.label} | ${it.category} | ${String(it.explain).replace(/\|/g, '/')} |`);
  out.push('');
}
console.log(out.join('\n'));
