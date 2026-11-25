#!/usr/bin/env node
/**
 * Regenerate public/skill-config.json from DEFAULT_SKILL_PROMPT in src/config/defaultSkill.ts.
 * The app loads skill-config.json at startup and it overrides the TS constant, so the two must
 * hold the same string. Edit the TS file, then run:
 *
 *   node scripts/build-skill-config.mjs <version>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSync } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];
if (!version) { console.error('usage: build-skill-config.mjs <version>'); process.exit(2); }

const js = buildSync({ entryPoints: [path.join(ROOT, 'src/config/defaultSkill.ts')], bundle: true, format: 'esm', platform: 'node', write: false }).outputFiles[0].text;
const tmp = path.join(ROOT, 'scripts/.defaultSkill.tmp.mjs');
fs.writeFileSync(tmp, js);
try {
  const { DEFAULT_SKILL_PROMPT, DEFAULT_SKILL_NAME } = await import(pathToFileURL(tmp).href);
  const cfg = { skillName: DEFAULT_SKILL_NAME, version, updatedAt: Date.now(), systemPrompt: DEFAULT_SKILL_PROMPT };
  fs.writeFileSync(path.join(ROOT, 'public/skill-config.json'), JSON.stringify(cfg, null, 2) + '\n');
  const bt = String.fromCharCode(96), bs = String.fromCharCode(92);
  console.log(`skill-config.json v${version}: ${DEFAULT_SKILL_PROMPT.length} chars, starts with "${DEFAULT_SKILL_PROMPT[0]}", escaped backticks: ${DEFAULT_SKILL_PROMPT.split(bs + bt).length - 1}`);
} finally {
  fs.rmSync(tmp, { force: true });
}
