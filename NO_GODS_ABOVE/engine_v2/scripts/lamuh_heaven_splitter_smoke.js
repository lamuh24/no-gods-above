const fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('playwright');
const out = path.resolve(__dirname, '../artifacts/lamuh-heaven-splitter-v1');
const version = 'authored-aura-redraw-v4';
const redrawFolder = '/lamuh-legacy-v2/heaven-heavy-aura-redraw-v4/';
const previousReview = JSON.parse(fs.readFileSync(path.join(out, 'authored-aura-v3-checkpoint/review-data.v3.json'), 'utf8'));
assert.strictEqual(previousReview.heavenSplitterFamily.heavyCinematicRevision.version, 3, 'Preserve the real V3 checkpoint before replacing its evidence');
const selected = (process.argv.find((s) => s.startsWith('--strength='))?.slice(11) || 'light,medium,heavy').split(',');
const noVideo = process.argv.includes('--no-video');
const family = [
  { strength: 'light', title: 'Light', startup: 7, total: 36, apex: 14, landing: 24, damage: 44 },
  { strength: 'medium', title: 'Medium', startup: 10, total: 43, apex: 20, landing: 33, damage: 62 },
  { strength: 'heavy', title: 'Heavy', startup: 14, total: 53, apex: 26, landing: 43, damage: 80 }
].filter((e) => selected.includes(e.strength));
assert(family.length, 'Select at least one authored strength');
fs.mkdirSync(out, { recursive: true });

// Every reused screenshot filename gets matching evidence metadata; stale V3
// sidecars must not mislabel a newer source08 redraw as the old aura-free pose.
function writeScreenshotMetadata(report) {
  for (const entry of report.cases) for (const [phase, capture] of Object.entries(entry.screenshots)) {
    if (!capture.file || !fs.existsSync(path.join(out, capture.file))) continue;
    fs.writeFileSync(path.join(out, capture.file.replace(/\.png$/, '.json')), JSON.stringify({
      version: report.version, capturedAt: fs.statSync(path.join(out, capture.file)).mtime.toISOString(),
      side: entry.side, strength: entry.strength, outcome: entry.outcome, phase, ...capture
    }, null, 2) + '\n');
  }
}
if (process.argv.includes('--refresh-screenshot-metadata')) {
  const previousReport = JSON.parse(fs.readFileSync(path.join(out, 'browser-report.json'), 'utf8'));
  assert.strictEqual(previousReport.version, version);
  writeScreenshotMetadata(previousReport);
  console.log(`Refreshed ${version} screenshot metadata from its completed report`);
  process.exit(0);
}

// The renderer draws each normalized sprite through a prepared .3-size canvas.
// Heavy V4 sprites include redrawn aura, so their bounds are COMPOSITE bounds.
// Observe that actual draw and its actual transform, not an assumed camera path.
function installBodyDrawAudit() {
  const drawImage = CanvasRenderingContext2D.prototype.drawImage;
  const alphaBounds = new WeakMap();
  window.__heavenBodyDraws = [];
  window.__heavenReviewDraws = [];
  window.__heavenEffectPathCalls = { stage: 0, v2: 0 };
  for (const method of ['arc', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo']) {
    const original = CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method] = function (...args) {
      if (this.canvas.id === 'stage' || this.canvas.id === 'v2') window.__heavenEffectPathCalls[this.canvas.id]++;
      return original.apply(this, args);
    };
  }
  CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
    const result = drawImage.call(this, source, ...args);
    if (this.canvas.width === 614 && this.canvas.height === 461 && source instanceof HTMLImageElement) {
      this.canvas.__heavenSourcePath = new URL(source.currentSrc || source.src, location.href).pathname;
    }
    if (this.canvas.id === 'v2' && source instanceof HTMLImageElement) window.__heavenReviewDraws.push({ sourcePath: new URL(source.currentSrc || source.src, location.href).pathname, alpha: this.globalAlpha, effectPathCallsBeforeDraw: window.__heavenEffectPathCalls.v2 });
    if (this.canvas.id !== 'stage' || !(source instanceof HTMLCanvasElement) || source.width !== 614 || source.height !== 461 || args.length !== 2) return result;
    let box = alphaBounds.get(source);
    if (!box) {
      const rgba = source.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, source.width, source.height).data;
      box = { minX: source.width, minY: source.height, maxX: -1, maxY: -1 };
      for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
        if (!rgba[(y * source.width + x) * 4 + 3]) continue;
        box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x);
        box.minY = Math.min(box.minY, y); box.maxY = Math.max(box.maxY, y);
      }
      alphaBounds.set(source, box);
    }
    const matrix = this.getTransform(), [dx, dy] = args;
    const points = [[box.minX, box.minY], [box.maxX + 1, box.minY], [box.minX, box.maxY + 1], [box.maxX + 1, box.maxY + 1]]
      .map(([x, y]) => ({ x: matrix.a * (x + dx) + matrix.c * (y + dy) + matrix.e, y: matrix.b * (x + dx) + matrix.d * (y + dy) + matrix.f }));
    window.__heavenBodyDraws.push({
      alphaBounds: box, width: source.width, height: source.height,
      sourcePath: source.__heavenSourcePath, alpha: this.globalAlpha, effectPathCallsBeforeDraw: window.__heavenEffectPathCalls.stage,
      screenBounds: { minX: Math.min(...points.map((p) => p.x)), minY: Math.min(...points.map((p) => p.y)), maxX: Math.max(...points.map((p) => p.x)), maxY: Math.max(...points.map((p) => p.y)) },
      transform: { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f }
    });
    return result;
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const report = { createdAt: new Date().toISOString(), version, candidateOnly: true, deployable: false, strengths: selected, cases: [], keyboard: [], cornerContainment: [], failures: [], browserErrors: [], ignoredHotReloads: [], historicalCheckpoint: 'authored-aura-v3-checkpoint/', renderedLayerBoundsMethod: 'Actual prepared sprite alpha plus CanvasRenderingContext2D current transform, sampled every simulation tick. Heavy V4 includes redrawn aura: these are composite bounds, not isolated body/anatomy bounds. VFX-off uses previous clean poses, not pixel-identical aura removal. Body/anatomy completeness needs separate visual inspection.', recordings: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    // Freeze each loaded QA page's code while another agent builds the next candidate.
    // Only Vite hot replacement is suppressed; gameplay, assets and rendering stay real.
    await page.routeWebSocket((url) => url.hostname === '127.0.0.1' && url.port === '4177', (socket) => {
      const server = socket.connectToServer();
      server.onMessage((message) => {
        let payload; try { payload = JSON.parse(message.toString()); } catch { /* ordinary message */ }
        if (payload && ['update', 'full-reload'].includes(payload.type)) { report.ignoredHotReloads.push(payload.type); return; }
        socket.send(message);
      });
    });
    page.on('pageerror', (e) => report.browserErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') report.browserErrors.push(m.text()); });
    await page.addInitScript(installBodyDrawAudit);
    async function openSandbox() {
      await page.goto('http://127.0.0.1:4177/lamuh-legacy-sandbox.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.lamuhSandbox, { timeout: 60000 });
      await page.evaluate(() => window.lamuhSandbox.pause());
      await page.click('#cleanView');
    }
    async function snapshotStep() {
      return page.evaluate(async () => {
        const before = window.lamuhSandbox.getState();
        window.__heavenBodyDraws = [];
        window.__heavenEffectPathCalls.stage = 0;
        await window.lamuhSandbox.step();
        return { before, state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent), bodies: window.__heavenBodyDraws };
      });
    }
    function checkBodies(snapshot, name) {
      assert.strictEqual(snapshot.bodies.length, 2, `${name}: both actual sprite/composite draw layers must be observed`);
      for (const [i, body] of snapshot.bodies.entries()) {
        const b = body.screenBounds;
        assert(b.minX >= 0 && b.minY >= 0 && b.maxX <= 1120 && b.maxY <= 620, `${name}: P${i + 1} sprite/composite leaves canvas: ${JSON.stringify(b)}`);
        assert(body.alphaBounds.minX > 0 && body.alphaBounds.minY > 0 && body.alphaBounds.maxX < body.width - 1 && body.alphaBounds.maxY < body.height - 1, `${name}: sprite/composite alpha touches prepared source edge`);
        assert.strictEqual(body.alpha, 1, `${name}: renderer must not fade the character sprite`);
      }
      assert.strictEqual(snapshot.readout.fighterCollision.pushboxesOverlap, false, `${name}: fighter overlap`);
    }
    await openSandbox();
    const currentFamily = await page.evaluate(async () => (await (await fetch('/lamuh-legacy-v2/review-data.json', { cache: 'no-store' })).json()).heavenSplitterFamily);
    const heavy = currentFamily.variants.heavy;
    assert.strictEqual(currentFamily.heavyCinematicRevision.version, 4);
    assert.strictEqual(heavy.v2.cinematicRevision.version, 4);
    assert.strictEqual(heavy.v2.cinematicRevision.pixelExactBodyPreservation, false);
    assert.strictEqual(heavy.v2.cinematicRevision.aura.runtimeOverlay, false);
    assert.match(heavy.v2.cinematicRevision.aura.bodyOnlyComparison, /previous clean poses, not pixel-identical aura removal/);
    const redrawnFrames = heavy.v2.frames.filter((frame) => frame.publicPath.startsWith(redrawFolder));
    assert.deepStrictEqual(redrawnFrames.map((frame) => frame.index), [3, 4, 5, 6, 7, 8], 'Only the six Heavy release poses may be redrawn');
    const originalHeavy = previousReview.heavenSplitterFamily.variants.heavy;
    for (const frame of heavy.v2.frames) {
      const old = originalHeavy.v2.frames[frame.index];
      if (frame.publicPath.startsWith(redrawFolder)) {
        assert(frame.auraBaked && frame.bodyOnlyPublicPath, `Redrawn frame${frame.index} needs old clean fallback`);
        assert.strictEqual(frame.bodyOnlyPublicPath, old.bodyOnlyPublicPath);
        assert.strictEqual(frame.bodyOnlySha256, old.bodyOnlySha256);
      } else {
        assert.strictEqual(frame.publicPath, old.bodyOnlyPublicPath || old.publicPath);
        assert.strictEqual(frame.sha256, old.bodyOnlySha256 || old.sha256);
      }
    }
    for (const strength of ['light', 'medium', 'heavy']) {
      assert.deepStrictEqual(currentFamily.variants[strength].timingCandidates.B, previousReview.heavenSplitterFamily.variants[strength].timingCandidates.B, `${strength}: gameplay-aligned timing must stay frozen`);
      if (strength !== 'heavy') assert.deepStrictEqual(currentFamily.variants[strength].v2.frames, previousReview.heavenSplitterFamily.variants[strength].v2.frames, `${strength}: approved source records must stay frozen`);
    }
    report.frozenContract = { lightMediumSourceRecordsUnchanged: true, allBTimingsUnchanged: true, heavyUnchangedPoseCount: 8, redrawnPoseIndices: redrawnFrames.map((frame) => frame.index), cleanFallbackSemantics: heavy.v2.cinematicRevision.aura.bodyOnlyComparison };
    for (const side of ['p1', 'p2']) for (const e of family) for (const outcome of ['hit', 'stand_block', 'crouch_block', 'whiff', 'anti_air']) {
      const name = `${side}-${e.strength}-${outcome}`, caseReport = { side, strength: e.strength, outcome, screenshots: {}, bodySamples: 0, contacts: [], bounds: { minX: 1120, minY: 620, maxX: 0, maxY: 0 } };
      report.cases.push(caseReport);
      try {
        await page.evaluate(({ side, outcome, title, strength }) => {
          const api = window.lamuhSandbox;
          api.selectSide(side); api.selectSpace('center'); api.selectOutcome(outcome === 'anti_air' ? 'hit' : outcome);
          api.scenario(outcome === 'anti_air' ? `Heaven ${strength} anti-air` : `Heaven Splitter ${title}`);
        }, { side, outcome, ...e });
        const marks = new Set();
        for (let i = 0; i < e.total + 32; i++) {
          const snapshot = await snapshotStep(), actor = snapshot.state.fighters[side], victimId = side === 'p1' ? 'p2' : 'p1';
          checkBodies(snapshot, name); caseReport.bodySamples++;
          if (e.strength === 'heavy' && actor.currentAttack) {
            const record = heavy.v2.frames[snapshot.readout.activeNormalFrame], draw = snapshot.bodies[side === 'p1' ? 0 : 1];
            assert.strictEqual(draw.sourcePath, record.publicPath, `${name}: actual selected image must equal the authored source`);
            if (record.auraBaked) assert.strictEqual(draw.effectPathCallsBeforeDraw, 0, `${name}: procedural aura was drawn underneath the baked composite`);
          }
          for (const body of snapshot.bodies) for (const key of ['minX', 'minY', 'maxX', 'maxY']) caseReport.bounds[key] = key.startsWith('min') ? Math.min(caseReport.bounds[key], body.screenBounds[key]) : Math.max(caseReport.bounds[key], body.screenBounds[key]);
          const event = snapshot.state.lastCombatEvent;
          if (event?.tick === snapshot.state.tick - 1 && event.attackId === `legacy_heaven_splitter_${e.strength}`) {
            const previousVictim = snapshot.before.fighters[victimId];
            const actuallyAirborneAtCollision = !previousVictim.grounded && (previousVictim.hitstop > 0 || previousVictim.y + previousVictim.vy + 1.05 < snapshot.state.stage.groundY);
            caseReport.contacts.push({ ...event, actorPhaseTick: actor.phaseTick, victimWasAirborneBeforeCollision: actuallyAirborneAtCollision });
          }
          const phase = actor.currentAttack && actor.phaseTick === e.startup ? 'contact-pose' : actor.currentAttack && actor.phaseTick === e.apex ? 'apex' : actor.currentAttack && actor.phaseTick === e.landing ? 'landing' : !actor.currentAttack && i >= e.total - 1 ? 'neutral-return' : null;
          if (phase && !marks.has(phase)) {
            marks.add(phase); const filename = `${name}-${phase}.png`;
            await page.locator('#stage').screenshot({ path: path.join(out, filename) });
            caseReport.screenshots[phase] = { file: filename, phaseTick: actor.phaseTick, activeFrame: snapshot.readout.activeNormalFrame, actorPosition: { x: actor.x, y: actor.y }, spriteCompositeBounds: snapshot.bodies[side === 'p1' ? 0 : 1].screenBounds, actualSourcePath: snapshot.bodies[side === 'p1' ? 0 : 1].sourcePath };
          }
          const extraPhase = e.strength === 'heavy' && actor.currentAttack ? snapshot.readout.activeNormalFrame === 3 ? 'aura-coil' : snapshot.readout.activeNormalFrame === 4 ? 'aura-rising-connector' : snapshot.readout.activeNormalFrame === 8 ? 'post-apex-gather' : snapshot.readout.activeNormalFrame === 9 ? 'aura-ended-feet-unfold' : null : null;
          if (extraPhase && !caseReport.screenshots[extraPhase]) {
            const file = `${name}-${extraPhase}.png`; await page.locator('#stage').screenshot({ path: path.join(out, file) });
            caseReport.screenshots[extraPhase] = { file, phaseTick: actor.phaseTick, activeFrame: snapshot.readout.activeNormalFrame, actualSourcePath: snapshot.bodies[side === 'p1' ? 0 : 1].sourcePath };
          }
        }
        const final = await page.evaluate(() => window.lamuhSandbox.getState()), victim = final.fighters[side === 'p1' ? 'p2' : 'p1'], actor = final.fighters[side];
        const expectedHit = outcome === 'hit' || outcome === 'anti_air', expectedContact = expectedHit || outcome === 'stand_block';
        assert.strictEqual(victim.hitCountTaken, expectedHit ? 1 : 0, `${name}: visible one-hit parity`);
        assert.strictEqual(victim.health, 1000 - (expectedHit ? e.damage : 0), `${name}: authored damage`);
        assert.strictEqual(caseReport.contacts.length, expectedContact ? 1 : 0, `${name}: one collision event`);
        if (outcome === 'stand_block') assert.strictEqual(caseReport.contacts[0].outcome, 'block');
        if (outcome === 'anti_air') assert.strictEqual(caseReport.contacts[0].victimWasAirborneBeforeCollision, true, `${name}: anti-air scenario must hit while victim is airborne, not after they land`);
        assert.strictEqual(actor.currentAttack, null); assert.strictEqual(actor.grounded, true); assert.strictEqual(actor.moveInstanceCounter, 1);
        assert.deepStrictEqual([...marks], ['contact-pose', 'apex', 'landing', 'neutral-return']);
        caseReport.damage = 1000 - victim.health; caseReport.passed = true;
        console.log(`PASS ${name}`);
      } catch (error) { caseReport.passed = false; caseReport.error = error.message; report.failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
    }

    report.redrawnAuraSourceAudit = await page.evaluate(async (records) => {
      const results = [];
      const decode = async (path) => { const im = new Image(); im.src = path; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(im, 0, 0); return { canvas: c, image: im, data: ctx.getImageData(0, 0, c.width, c.height).data }; };
      const hash = async (url) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch(url, { cache: 'no-store' })).arrayBuffer()))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      for (const record of records) {
        const composite = await decode(record.publicPath), body = await decode(record.bodyOnlyPublicPath);
        let previousPoseOpaquePixels = 0, changedPreviousPoseOpaquePixels = 0, pixelsOutsidePreviousPose = 0, compositeOpaquePixels = 0;
        for (let i = 0; i < body.data.length; i += 4) {
          if (body.data[i + 3] === 255) { previousPoseOpaquePixels++; if (composite.data[i] !== body.data[i] || composite.data[i + 1] !== body.data[i + 1] || composite.data[i + 2] !== body.data[i + 2] || composite.data[i + 3] !== 255) changedPreviousPoseOpaquePixels++; }
          if (body.data[i + 3] === 0 && composite.data[i + 3] > 0) pixelsOutsidePreviousPose++;
          if (composite.data[i + 3] === 255) compositeOpaquePixels++;
        }
        results.push({ index: record.index, sourcePath: record.publicPath, cleanPreviousPosePath: record.bodyOnlyPublicPath, actualCompositeSha256: await hash(record.publicPath), expectedCompositeSha256: record.sha256, actualPreviousPoseSha256: await hash(record.bodyOnlyPublicPath), expectedPreviousPoseSha256: record.bodyOnlySha256, width: composite.canvas.width, height: composite.canvas.height, previousPoseOpaquePixels, changedPreviousPoseOpaquePixels, pixelsOutsidePreviousPose, compositeOpaquePixels, interpretation: 'Intentional redrawn artwork, not pixel-preserved aura addition. Pixel differences cannot isolate anatomy or aura.' });
        composite.canvas.width = body.canvas.width = 1; composite.image.src = body.image.src = '';
      }
      return results;
    }, redrawnFrames);
    for (const row of report.redrawnAuraSourceAudit) {
      assert(row.changedPreviousPoseOpaquePixels > 0, `Frame${row.index} must be the requested redraw, not the previous composite`);
      assert(row.compositeOpaquePixels > 1000 && row.previousPoseOpaquePixels > 1000, `Frame${row.index} must contain substantial opaque art`);
      assert.strictEqual(row.width, 2048); assert.strictEqual(row.height, 1536);
      assert.strictEqual(row.actualCompositeSha256, row.expectedCompositeSha256);
      assert.strictEqual(row.actualPreviousPoseSha256, row.expectedPreviousPoseSha256);
    }
    report.allFamilySourceHashes = await page.evaluate(async (records) => {
      const rows = [];
      for (const record of records) {
        const response = await fetch(record.publicPath, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Missing source ${record.publicPath}`);
        const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        rows.push({ path: record.publicPath, actual, expected: record.sha256 });
      }
      return rows;
    }, Object.values(currentFamily.variants).flatMap((variant) => variant.v2.frames));
    for (const row of report.allFamilySourceHashes) assert.strictEqual(row.actual, row.expected, `Served source hash changed: ${row.path}`);
    await page.evaluate(() => { const api = window.lamuhSandbox; api.selectSide('p1'); api.selectSpace('center'); api.selectOutcome('whiff'); api.scenario('Heaven Splitter Heavy'); });
    let auraSnapshot;
    for (let i = 0; i < heavy.timingCandidates.B.phaseTicks.startup; i++) auraSnapshot = await snapshotStep();
    const contactRecord = heavy.v2.frames[auraSnapshot.readout.activeNormalFrame];
    assert(contactRecord.auraBaked, 'Heavy contact pose must be an authored composite');
    await page.locator('#stage').screenshot({ path: path.join(out, `${version}-on.png`) });
    const beforeToggle = auraSnapshot.state;
    await page.locator('#vfx').uncheck();
    const off = await page.evaluate(async () => { window.__heavenBodyDraws = []; window.__heavenEffectPathCalls.stage = 0; await window.lamuhSandbox.render(); return { state: window.lamuhSandbox.getState(), draws: window.__heavenBodyDraws }; });
    assert.strictEqual(off.draws[0].sourcePath, contactRecord.bodyOnlyPublicPath, 'VFX-off must select the previous clean pose PNG, not claim exact aura removal');
    assert.strictEqual(off.draws[0].effectPathCallsBeforeDraw, 0);
    assert.deepStrictEqual(off.state, beforeToggle, 'Display toggle cannot mutate simulation state');
    await page.locator('#stage').screenshot({ path: path.join(out, `${version}-off.png`) });
    await page.locator('#vfx').check();
    report.authoredAuraSelection = { actualCompositePath: auraSnapshot.bodies[0].sourcePath, previousCleanPoseFallbackPath: off.draws[0].sourcePath, fallbackIsPixelIdenticalAuraRemoval: false, noProceduralOverlay: true, togglePreservedSimulation: true, screenshots: [`${version}-on.png`, `${version}-off.png`] };
    // Exercise the entire old-clean-pose alternative, including return to unchanged frames.
    await page.locator('#vfx').uncheck();
    await page.evaluate(() => { const api = window.lamuhSandbox; api.selectOutcome('whiff'); api.scenario('Heaven Splitter Heavy'); });
    const fallbackFrames = new Set();
    for (let i = 0; i < 73; i++) {
      const snapshot = await snapshotStep(); checkBodies(snapshot, 'previous-clean-pose-motion');
      if (!snapshot.state.fighters.p1.currentAttack) continue;
      const record = heavy.v2.frames[snapshot.readout.activeNormalFrame];
      assert.strictEqual(snapshot.bodies[0].sourcePath, record.bodyOnlyPublicPath || record.publicPath);
      assert.strictEqual(snapshot.bodies[0].effectPathCallsBeforeDraw, 0);
      fallbackFrames.add(record.index);
    }
    assert.deepStrictEqual([...fallbackFrames], Array.from({ length: 14 }, (_,i) => i));
    report.authoredAuraSelection.previousCleanPoseFrameIndices = [...fallbackFrames];
    await page.locator('#vfx').check();
    console.log('PASS six redraw/previous-pose hash pairs, all family source hashes, no double overlay and full VFX-off clean-pose alternative');

    for (const e of family) {
      await page.evaluate(() => { const api = window.lamuhSandbox; api.selectSide('p1'); api.selectSpace('center'); api.selectOutcome('whiff'); api.reset(); });
      const button = { light: 'j', medium: 'k', heavy: 'l' }[e.strength];
      await page.keyboard.down('u'); await page.keyboard.down('w'); await page.keyboard.down(button);
      const first = await snapshotStep();
      await page.keyboard.up(button); await page.keyboard.up('w'); await page.keyboard.up('u');
      assert.strictEqual(first.state.fighters.p1.currentAttack, `legacy_heaven_splitter_${e.strength}`);
      report.keyboard.push({ strength: e.strength, chord: `U then W+${button.toUpperCase()}`, actualDOMKeyEvents: true, passed: true });
      console.log(`PASS actual keyboard ${e.strength}`);
    }
    // A cinematic Heavy treatment must remain fully visible at either wall too.
    // Check every selected variant at both camera extremes without changing the UI.
    for (const side of ['p1', 'p2']) for (const e of family) for (const space of ['left_corner', 'right_corner']) {
      const name = `${side}-${e.strength}-${space}`;
      await page.evaluate(({ side, space, title }) => { const api = window.lamuhSandbox; api.selectSide(side); api.selectSpace(space); api.selectOutcome('hit'); api.scenario(`Heaven Splitter ${title}`); }, { side, space, title: e.title });
      let apex = false;
      for (let i = 0; i < e.total + 20; i++) {
        const snapshot = await snapshotStep(); checkBodies(snapshot, name);
        if (!apex && snapshot.state.fighters[side].phaseTick === e.apex && snapshot.state.fighters[side].currentAttack) {
          apex = true; await page.locator('#stage').screenshot({ path: path.join(out, `${name}-apex.png`) });
        }
      }
      assert(apex, `${name}: apex not reached`);
      report.cornerContainment.push({ side, strength: e.strength, space, passed: true, screenshot: `${name}-apex.png` });
      console.log(`PASS corner containment ${name}`);
    }

    await page.goto('http://127.0.0.1:4177/lamuh-v1-v2-review.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.lamuhReview, { timeout: 60000 });
    const defaultState = await page.evaluate(() => window.lamuhReview.getState());
    assert.strictEqual(defaultState.moveId, 'heaven_splitter_medium');
    await page.click('#speedHalf');
    assert.strictEqual((await page.evaluate(() => window.lamuhReview.getState())).speed, 0.5);
    await page.evaluate(() => window.lamuhReview.pause());
    const cursor = await page.evaluate(() => window.lamuhReview.getState().cursor);
    await page.evaluate(() => window.lamuhReview.step());
    assert.strictEqual((await page.evaluate(() => window.lamuhReview.getState())).cursor, cursor + 1);
    await page.screenshot({ path: path.join(out, 'comparison-medium-half-speed.png'), fullPage: true });
    report.comparison = { defaultMove: defaultState.moveId, halfSpeedSelected: true, frameAdvancePassed: true, screenshot: 'comparison-medium-half-speed.png' };
    console.log('PASS comparison default, half-speed control and exact frame advance');
    await page.evaluate(async () => {
      const api = window.lamuhReview; api.selectMove('heaven_splitter_heavy'); api.pause();
      for (let i = 0; i < 14; i++) { window.__heavenReviewDraws = []; window.__heavenEffectPathCalls.v2 = 0; await api.step(); }
    });
    const reviewOn = await page.evaluate(() => window.__heavenReviewDraws.at(-1));
    assert.strictEqual(reviewOn.sourcePath, contactRecord.publicPath, 'Comparison must draw the same authored contact composite');
    assert.strictEqual(reviewOn.effectPathCallsBeforeDraw, 0, 'Comparison cannot overlay the procedural aura again');
    await page.locator('#v2').screenshot({ path: path.join(out, `comparison-heavy-${version}.png`) });
    await page.evaluate(() => { window.__heavenReviewDraws = []; window.__heavenEffectPathCalls.v2 = 0; });
    await page.locator('#vfxToggle').uncheck();
    await page.waitForFunction((source) => window.__heavenReviewDraws.at(-1)?.sourcePath === source, contactRecord.bodyOnlyPublicPath);
    const reviewOff = await page.evaluate(() => window.__heavenReviewDraws.at(-1));
    assert.strictEqual(reviewOff.effectPathCallsBeforeDraw, 0);
    report.comparison.authoredAura = { actualCompositePath: reviewOn.sourcePath, actualPreviousCleanPosePath: reviewOff.sourcePath, fallbackIsPixelIdenticalAuraRemoval: false, noDoubleOverlay: true };
    console.log('PASS comparison actual authored composite and body-only fallback');

    if (!noVideo) {
      await openSandbox();
      for (const halfSpeed of [false, true]) {
        const motionSamples = [];
        await page.locator('#halfSpeed').setChecked(halfSpeed);
        await page.evaluate(() => {
          const stream = document.querySelector('#stage').captureStream(60), chunks = [];
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
          window.__heavenRecording = { stream, chunks, recorder }; recorder.start();
        });
        await page.click('#pause');
        for (const e of family) {
          await page.evaluate((title) => {
            const api = window.lamuhSandbox; api.selectSide('p1'); api.selectOutcome('hit'); api.scenario(`Heaven Splitter ${title}`);
            window.__heavenVideoTrace = [];
            window.__heavenTraceTimer = setInterval(() => {
              const state = api.getState(), body = state.fighters.p1;
              window.__heavenVideoTrace.push({ tick: state.tick, move: body.currentAttack, phaseTick: body.phaseTick, y: body.y, frame: JSON.parse(document.querySelector('#readout').textContent).activeNormalFrame });
            }, 12);
          }, e.title);
          await page.waitForTimeout(halfSpeed ? 3400 : 1900);
          const trace = await page.evaluate(() => { clearInterval(window.__heavenTraceTimer); return { samples: window.__heavenVideoTrace, final: window.lamuhSandbox.getState() }; });
          const sampledFrames = [...new Set(trace.samples.filter((s) => s.move).map((s) => s.frame))];
          assert(sampledFrames.length >= 5, `${e.strength}: actual recording must advance distinct rendered body frames`);
          assert(trace.samples.some((s) => s.y < 0), `${e.strength}: recorded motion must contain the real hop`);
          assert.strictEqual(trace.final.fighters.p1.currentAttack, null, `${e.strength}: recorded clip must complete`);
          assert.strictEqual(trace.final.fighters.p2.hitCountTaken, 1);
          motionSamples.push({ strength: e.strength, sampledFrames, firstTick: trace.samples[0].tick, lastTick: trace.samples.at(-1).tick, minimumY: Math.min(...trace.samples.map((s) => s.y)) });
        }
        await page.evaluate(() => window.lamuhSandbox.pause());
        const bytes = await page.evaluate(() => new Promise((resolve) => {
          const r = window.__heavenRecording;
          r.recorder.onstop = async () => { resolve(Array.from(new Uint8Array(await new Blob(r.chunks, { type: 'video/webm' }).arrayBuffer()))); r.stream.getTracks().forEach((track) => track.stop()); };
          r.recorder.stop();
        }));
        const file = `heaven-family-${halfSpeed ? 'half-speed' : '1x'}.webm`;
        fs.writeFileSync(path.join(out, file), Buffer.from(bytes)); report.recordings.push({ file, playbackRate: halfSpeed ? 0.5 : 1, actualCanvasCapture: true, bytes: bytes.length, motionSamples });
      }
    }
    await openSandbox();
    await page.setViewportSize({ width: 760, height: 720 });
    const viewportMove = family.at(-1);
    await page.evaluate((title) => window.lamuhSandbox.scenario(`Heaven Splitter ${title}`), viewportMove.title);
    for (let i = 0; i < viewportMove.total + 20; i++) {
      const snapshot = await snapshotStep(); checkBodies(snapshot, 'compact-viewport');
      if (snapshot.state.fighters.p1.phaseTick === viewportMove.apex) break;
    }
    await page.locator('#stage').scrollIntoViewIfNeeded();
    const viewport = await page.evaluate(() => {
      const rect = document.querySelector('#stage').getBoundingClientRect();
      return { innerWidth, innerHeight, scrollWidth: document.documentElement.scrollWidth, canvas: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } };
    });
    assert(viewport.scrollWidth <= viewport.innerWidth + 1, 'Compact playtest has horizontal page overflow');
    assert(viewport.canvas.left >= 0 && viewport.canvas.right <= viewport.innerWidth && viewport.canvas.top >= 0 && viewport.canvas.bottom <= viewport.innerHeight, 'Whole stage must fit the compact viewport');
    await page.screenshot({ path: path.join(out, 'compact-viewport-apex.png') });
    report.compactViewport = { ...viewport, strength: viewportMove.strength, passed: true, screenshot: 'compact-viewport-apex.png' };
    assert.deepStrictEqual(report.browserErrors, []);
  } catch (error) { report.failures.push(error.message); console.error(error.stack); }
  finally {
    report.passed = report.failures.length === 0 && report.browserErrors.length === 0;
    const suffix = selected.length === 3 ? '' : `-${selected.join('-')}`;
    fs.writeFileSync(path.join(out, `browser-report${suffix}.json`), JSON.stringify(report, null, 2) + '\n');
    writeScreenshotMetadata(report);
    await browser.close();
  }
  console.log(`${report.passed ? 'PASS' : 'FAIL'} Heaven browser smoke: ${report.cases.filter((c) => c.passed).length}/${report.cases.length} cases; ${report.failures.length} failures; ${report.browserErrors.length} browser errors`);
  if (!report.passed) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
