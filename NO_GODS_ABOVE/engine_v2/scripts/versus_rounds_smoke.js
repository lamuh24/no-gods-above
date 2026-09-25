// Headless browser smoke for the Rounds mode: real menus, real keyboard input, a full CPU match.
// Usage: start the dev server (npm run dev -- --port 4180 --strictPort), then
//   node scripts/versus_rounds_smoke.js [baseUrl]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4180/versus-playtest.html';
const OUT = path.resolve(__dirname, '../docs/versus-rounds-v1');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const checks = [], errors = [];
  const check = (value, label) => { assert.ok(value, label); checks.push(label); console.log('ok -', label); };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.setDefaultTimeout(240000);
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    // The smoke steps the simulation while paused; hide only the pause banner in evidence captures.
    const capture = async (name) => {
      await page.addStyleTag({ content: '#pauseBanner { visibility: hidden !important; }' }).catch(() => {});
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    };
    const waitForMatch = () => page.waitForFunction(() => window.__versus?.arena?.stageLoaded === true && !!window.__versus.director);

    // --- menus ---
    await page.goto(`${BASE}?screen=modes`);
    await page.locator('#modeRounds').waitFor();
    check(await page.locator('#modeRounds').isEnabled(), 'Rounds mode card is playable');
    check(await page.locator('button:disabled').count() >= 1, 'Stocks stays truthfully gated');
    await page.locator('#modeRounds').click();
    await page.locator('#watchCpu').waitFor();
    check((await page.locator('.nga-chapter').textContent()).includes('ROUNDS'), 'Select screen is in Rounds mode');
    await page.locator('[data-controller-side="p1"][data-controller="cpu"]').click();
    check((await page.locator('[data-controller-side="p1"][data-controller="cpu"]').getAttribute('aria-pressed')) === 'true', 'P1 can be switched to CPU');
    await page.locator('[data-controller-side="p1"][data-controller="human"]').click();
    await page.locator('#roundSeconds').selectOption('60');
    check((await page.locator('.nga-battle-note').textContent()).includes('60 SEC'), 'Round timer option applies');
    await page.locator('#roundSeconds').selectOption('99');
    await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode().catch(() => {}))));
    await capture('select-rounds');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Rounds select has no horizontal overflow');

    // --- player vs CPU: intro lock, then real keyboard input ---
    await page.locator('#fight').click();
    await waitForMatch();
    check((await page.locator('.player-tag').allTextContents()).join('|') === 'P1|P2 · CPU', 'HUD tags the CPU side');
    // The match starts running while the stage loads; restart so the intro is observed from tick 0.
    // Note: the inspection hook's pause(value) sets playing = value, so pause(false) stops the loop.
    await page.evaluate(() => { window.__versus.restartMatch(); window.__versus.pause(false); });
    await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__versus.step(); });
    check(await page.evaluate(() => window.__versus.director.phase === 'intro' && window.__versus.director.inputsLocked), 'Round opens on a locked intro');
    await capture('round-intro');
    const introX = await page.evaluate(() => window.__versus.state.fighters.p1.x);
    await page.keyboard.down('KeyD');
    const locked = await page.evaluate((x) => {
      const v = window.__versus, moved = [];
      for (let i = 0; i < 10; i++) { v.step(); if (v.state.fighters.p1.x !== x || Object.keys(v.state.inputLog.at(-1).p1 ?? {}).length) moved.push(`${v.director.phase}/${v.director.phaseTicks} x=${v.state.fighters.p1.x} in=${JSON.stringify(v.state.inputLog.at(-1).p1)}`); }
      return moved;
    }, introX);
    await page.keyboard.up('KeyD');
    check(locked.length === 0, `Round intro locks player input ${locked.join(' ; ')}`);
    // Control unlocks as FIGHT is called; test movement before the CPU has time to engage.
    await page.evaluate(() => { const v = window.__versus; while (v.director.inputsLocked) v.step(); });
    const fightX = await page.evaluate(() => window.__versus.state.fighters.p1.x);
    await page.keyboard.down('KeyD');
    await page.evaluate(() => { for (let i = 0; i < 8; i++) window.__versus.step(); });
    await page.keyboard.up('KeyD');
    check(await page.evaluate((x) => window.__versus.state.fighters.p1.x > x + 20 && window.__versus.state.inputLog.at(-1).p1.right === true, fightX), 'Player walks with the keyboard once FIGHT is called');
    await page.evaluate(() => { const v = window.__versus; for (let i = 0; i < 3; i++) v.step(); });
    await page.keyboard.down('KeyJ');
    await page.evaluate(() => window.__versus.step());
    await page.keyboard.up('KeyJ');
    check(await page.evaluate(() => window.__versus.state.inputLog.at(-1).p1.light === true && ['standing_light', null].includes(window.__versus.state.fighters.p1.currentAttack) && (window.__versus.state.fighters.p1.currentAttack === 'standing_light' || window.__versus.state.fighters.p1.hitstun > 0)), 'Player attack input reaches the simulation');
    const cpuActed = await page.evaluate(() => { const v = window.__versus; let acted = false; for (let i = 0; i < 600 && !acted; i++) { v.step(); const f = v.state.fighters.p2; acted = f.phase === 'attack' || f.phase === 'dash' || f.phase.startsWith('walk') || f.phase === 'jump'; } return acted; });
    check(cpuActed, 'CPU opponent acts on its own');

    // --- CPU vs CPU from the menu, played to the result screen ---
    await page.goto(`${BASE}?screen=select&mode=rounds&seed=2718`);
    await page.locator('#watchCpu').click();
    await waitForMatch();
    check((await page.locator('.player-tag').allTextContents()).join('|') === 'P1 · CPU|P2 · CPU', 'Watch CPU vs CPU starts a CPU match');
    const action = await page.evaluate(() => {
      const v = window.__versus; v.pause(false);
      for (let i = 0; i < 4000; i++) {
        v.step();
        const { p1, p2 } = v.state.fighters;
        const gap = Math.abs(p1.x - p2.x);
        for (const [a, d] of [[p1, p2], [p2, p1]]) {
          if (v.director.phase === 'fight' && a.phase === 'attack' && a.attackConnected && d.phase === 'hit_reaction' && gap < 130 && a.phaseTick > 5) {
            return { tick: v.state.tick, attacker: a.id, move: a.currentAttack, gap: Math.round(gap), minGap: Math.round((v.state.fighters.p1.bodyEnvelope.pushbox.w + v.state.fighters.p2.bodyEnvelope.pushbox.w) / 2) };
          }
        }
      }
      return null;
    });
    check(!!action, 'CPUs trade real hits at close range');
    await capture('cpu-close-range-hit');
    const rounds = await page.evaluate(() => {
      const v = window.__versus, log = [];
      let lastPhase = '';
      for (let i = 0; i < 60 * 60 * 6 && v.director.phase !== 'match_end'; i++) {
        v.step();
        const d = v.director;
        if (d.phase !== lastPhase) { lastPhase = d.phase; log.push(`${d.round}:${d.phase}:${document.querySelector('#announcer').hidden ? '' : document.querySelector('#announcerText').textContent}`); }
      }
      return { log, phase: v.director.phase, wins: v.director.wins, history: v.director.history };
    });
    check(rounds.phase === 'match_end', `CPU match reaches a result (${JSON.stringify(rounds.wins)})`);
    check(rounds.log.some((entry) => entry.includes(':ko:K.O.') || entry.includes(':ko:DOUBLE K.O.') || entry.includes(':time:TIME')), 'Rounds resolve by knockout or time with an announcement');
    check(rounds.history.length >= 2, 'A best-of-three plays at least two rounds');
    await capture('match-results');
    check(await page.locator('#matchResults').isVisible(), 'Match results panel is shown');
    check(!(await page.locator('#announcer').isVisible()), 'Announcer is hidden behind results');
    await page.locator('#resultsRematch').click();
    check(await page.evaluate(() => window.__versus.director.round === 1 && window.__versus.director.phase === 'intro'), 'Rematch restarts the match');

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify({ checks, errors, closeRangeHit: action, rounds }, null, 2));
    console.log('PASS versus rounds smoke');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
