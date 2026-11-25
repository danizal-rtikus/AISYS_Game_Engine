/**
 * AISYS Story Shell v0.1
 * Wraps any AISYS game (engine manifest or full-HTML Beta game) with a prolog before play and an
 * ending (win / lose) after play. The AI only writes story DATA; this file renders it, so every
 * genre gets the same, consistent story screens. Works offline (no assets, emoji + CSS only).
 *
 * Story sources (first found wins):
 *   1. Engine manifest: AISYS.defineGame({ ..., story: { ... } })   -> window.__AISYS_GAME__.rawManifest.story
 *   2. Full-HTML game:  <script type="application/json" id="aisys-story">{ ... }</script>
 *
 * Ending triggers:
 *   - Engine games: the runtime dispatches `aisys:gameover`; win if correct items >= story.goal.correct
 *   - Full-HTML games call AISYS.end("menang") or AISYS.end("kalah")
 *
 * Story shape (all text is clamped and rendered with textContent, never as HTML):
 *   { title, hero: { name, emoji, desc }, world: { name, emoji }, mood: { from, to },
 *     prolog: [ { text, emoji } x 1..4 ], goal: { text, correct },
 *     ending: { menang: { text, emoji }, kalah: { text, emoji } } }
 */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;

  var AISYS = (root.AISYS = root.AISYS || {});
  var story = null;
  var overlay = null;
  var pendingEnd = null;

  // ------------------------------------------------------------ data
  function str(v, max) {
    return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function emoji(v, fallback) {
    var s = str(v, 8);
    return s || fallback;
  }
  function color(v, fallback) {
    return /^#[0-9a-f]{3,8}$/i.test(String(v || '')) ? v : fallback;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var prolog = Array.isArray(raw.prolog) ? raw.prolog : [];
    prolog = prolog
      .slice(0, 4)
      .map(function (p) {
        return typeof p === 'string' ? { text: str(p, 240), emoji: '' } : { text: str(p && p.text, 240), emoji: emoji(p && p.emoji, '') };
      })
      .filter(function (p) { return p.text; });
    if (!prolog.length) return null;
    var hero = raw.hero || {};
    var world = raw.world || {};
    var mood = raw.mood || {};
    var ending = raw.ending || {};
    var goal = raw.goal || {};
    var n = Number(goal.correct);
    return {
      title: str(raw.title, 60),
      hero: { name: str(hero.name, 40), emoji: emoji(hero.emoji, '🦸'), desc: str(hero.desc, 120) },
      world: { name: str(world.name, 40), emoji: emoji(world.emoji, '🌍') },
      mood: { from: color(mood.from, '#1e1b4b'), to: color(mood.to, '#0f766e') },
      prolog: prolog,
      goal: { text: str(goal.text, 120), correct: isFinite(n) && n > 0 ? Math.min(Math.round(n), 50) : 10 },
      ending: {
        menang: { text: str(ending.menang && ending.menang.text, 240) || 'Misi berhasil!', emoji: emoji(ending.menang && ending.menang.emoji, '🏆') },
        kalah: { text: str(ending.kalah && ending.kalah.text, 240) || 'Belum berhasil. Coba lagi!', emoji: emoji(ending.kalah && ending.kalah.emoji, '💫') }
      }
    };
  }

  function findStory() {
    try {
      var g = root.__AISYS_GAME__;
      if (g && g.rawManifest && g.rawManifest.story) return normalize(g.rawManifest.story);
    } catch (e) {}
    var el = document.getElementById('aisys-story');
    if (el) {
      try { return normalize(JSON.parse(el.textContent || '')); } catch (e) {}
    }
    return null;
  }

  // ------------------------------------------------------------ UI
  var CSS =
    '#aisys-story-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;' +
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;box-sizing:border-box;animation:aisysFade .25s ease}' +
    '#aisys-story-overlay *{box-sizing:border-box}' +
    '.aisys-card{width:100%;max-width:620px;max-height:100%;overflow:auto;background:rgba(10,12,20,.55);border:1px solid rgba(255,255,255,.18);' +
    'border-radius:20px;padding:20px 22px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.aisys-kicker{font:600 11px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.75}' +
    '.aisys-title{margin:6px 0 14px;font-size:22px;font-weight:800;letter-spacing:-.01em;line-height:1.2}' +
    '.aisys-stage{position:relative;height:120px;border-radius:14px;margin-bottom:14px;overflow:hidden;' +
    'background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.04));display:flex;align-items:flex-end;justify-content:center;gap:18px;padding-bottom:10px}' +
    '.aisys-stage .w{position:absolute;right:14px;top:8px;font-size:36px;opacity:.9}' +
    '.aisys-stage .h{font-size:64px;line-height:1;animation:aisysBob 1.6s ease-in-out infinite}' +
    '.aisys-stage .e{font-size:44px;line-height:1}' +
    '.aisys-stage .ground{position:absolute;left:0;right:0;bottom:0;height:10px;background:rgba(0,0,0,.25)}' +
    '.aisys-text{font-size:17px;line-height:1.55;min-height:3em}' +
    '.aisys-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;flex-wrap:wrap}' +
    '.aisys-dots{display:flex;gap:6px}.aisys-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3)}.aisys-dots i.on{background:#fff}' +
    '.aisys-btns{display:flex;gap:8px;margin-left:auto}' +
    '.aisys-btn{font:700 15px/1 system-ui,sans-serif;border-radius:12px;padding:12px 18px;border:0;cursor:pointer}' +
    '.aisys-btn.p{background:#F6821F;color:#111}.aisys-btn.g{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35)}' +
    '.aisys-goal{margin-top:12px;font-size:14px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.12)}' +
    '@keyframes aisysFade{from{opacity:0}to{opacity:1}}@keyframes aisysBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
    '@media (max-width:480px){.aisys-title{font-size:19px}.aisys-text{font-size:15px}.aisys-stage{height:96px}.aisys-stage .h{font-size:52px}}';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function ensureStyle() {
    if (document.getElementById('aisys-story-style')) return;
    var s = el('style');
    s.id = 'aisys-story-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // While the overlay is open, keep keys away from the game (Space would otherwise jump/start it)
  function keyGuard(e) {
    if (!overlay) return;
    e.stopImmediatePropagation();
    if (e.type !== 'keydown') return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      var primary = overlay.querySelector('.aisys-btn.p');
      if (primary) primary.click();
    } else if (e.key === 'Escape') {
      close();
    }
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    try { root.focus(); } catch (e) {}
  }

  function open(build) {
    close();
    ensureStyle();
    overlay = el('div');
    overlay.id = 'aisys-story-overlay';
    overlay.style.background = 'linear-gradient(160deg,' + story.mood.from + ',' + story.mood.to + ')';
    overlay.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    var card = el('div', 'aisys-card');
    overlay.appendChild(card);
    build(card);
    (document.body || document.documentElement).appendChild(overlay);
  }

  function stage(heroEmoji, extraEmoji) {
    var s = el('div', 'aisys-stage');
    s.appendChild(el('div', 'w', story.world.emoji));
    s.appendChild(el('div', 'h', heroEmoji || story.hero.emoji));
    if (extraEmoji) s.appendChild(el('div', 'e', extraEmoji));
    s.appendChild(el('div', 'ground'));
    return s;
  }

  function showProlog(i) {
    open(function (card) {
      var p = story.prolog[i];
      var last = i === story.prolog.length - 1;
      card.appendChild(el('div', 'aisys-kicker', 'Prolog · ' + (i + 1) + '/' + story.prolog.length));
      card.appendChild(el('div', 'aisys-title', story.title || story.hero.name));
      card.appendChild(stage(story.hero.emoji, p.emoji));
      card.appendChild(el('div', 'aisys-text', p.text));
      if (last && story.goal.text) card.appendChild(el('div', 'aisys-goal', '🎯 ' + story.goal.text));
      var row = el('div', 'aisys-row');
      var dots = el('div', 'aisys-dots');
      story.prolog.forEach(function (_, k) { dots.appendChild(el('i', k === i ? 'on' : '')); });
      row.appendChild(dots);
      var btns = el('div', 'aisys-btns');
      if (!last) {
        var skip = el('button', 'aisys-btn g', 'Lewati');
        skip.onclick = close;
        btns.appendChild(skip);
      }
      var next = el('button', 'aisys-btn p', last ? 'Mulai main! ▶' : 'Lanjut ▶');
      next.onclick = function () { last ? close() : showProlog(i + 1); };
      btns.appendChild(next);
      row.appendChild(btns);
      card.appendChild(row);
    });
  }

  function showEnding(result) {
    var win = result === 'menang';
    var end = win ? story.ending.menang : story.ending.kalah;
    open(function (card) {
      card.appendChild(el('div', 'aisys-kicker', win ? 'Ending · Misi berhasil' : 'Ending · Misi gagal'));
      card.appendChild(el('div', 'aisys-title', story.title || story.hero.name));
      card.appendChild(stage(story.hero.emoji, end.emoji));
      card.appendChild(el('div', 'aisys-text', end.text));
      var row = el('div', 'aisys-row');
      var btns = el('div', 'aisys-btns');
      var see = el('button', 'aisys-btn g', 'Lihat hasil');
      see.onclick = close;
      var again = el('button', 'aisys-btn p', 'Main lagi ↻');
      again.onclick = function () {
        close();
        try {
          var g = root.__AISYS_GAME__;
          if (g && typeof g.restartGame === 'function') { g.restartGame(); return; }
        } catch (e) {}
        try { root.location.reload(); } catch (e) {}
      };
      btns.appendChild(see);
      btns.appendChild(again);
      row.appendChild(btns);
      card.appendChild(row);
    });
  }

  // ------------------------------------------------------------ public API
  /** Called by full-HTML games when the round is over: AISYS.end("menang") or AISYS.end("kalah"). */
  AISYS.end = function (result) {
    var r = String(result || '').toLowerCase();
    r = r === 'menang' || r === 'win' || r === 'true' ? 'menang' : 'kalah';
    if (!story) { pendingEnd = r; return; }
    setTimeout(function () { showEnding(r); }, 600);
  };

  root.addEventListener('aisys:gameover', function (e) {
    if (!story) return;
    var a = (e && e.detail && e.detail.analytics) || {};
    var win = (a.correctCount || 0) >= story.goal.correct;
    setTimeout(function () { showEnding(win ? 'menang' : 'kalah'); }, 900);
  });

  root.addEventListener('keydown', keyGuard, true);
  root.addEventListener('keyup', keyGuard, true);
  root.addEventListener('keypress', keyGuard, true);

  function init() {
    story = findStory();
    if (!story) return;
    AISYS.story = story;
    if (pendingEnd) { showEnding(pendingEnd); pendingEnd = null; return; }
    showProlog(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== 'undefined' ? window : globalThis);
