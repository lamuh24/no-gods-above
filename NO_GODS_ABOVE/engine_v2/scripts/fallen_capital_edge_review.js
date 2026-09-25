const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const out = path.resolve(__dirname, '../docs/fallen-capital-v1/edge-polish');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const report = { timestamp: new Date().toISOString(), method: 'Independent synthetic render stress; does not certify reachable combat states', errors: [], failedRequests: [], views: {} };
  try {
    const page = await browser.newPage({ viewport: { width: 1660, height: 1100 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
    page.on('requestfailed', r => report.failedRequests.push(r.url()));
    page.on('response', r => { if (r.status() >= 400) report.failedRequests.push(`${r.status()} ${r.url()}`); });
    await page.goto('http://127.0.0.1:4175/versus-playtest.html?arena=fallen-capital&autostart=1');
    await page.waitForFunction(() => window.__versus?.arena?.stageLoaded, null, { timeout: 180000 });
    await page.evaluate(() => { window.__versus.pause(false); document.querySelector('#aiToggle').checked = false; document.querySelector('#boxes').checked = false; });
    for (const [name, x1, x2, y, orbit] of [ ['center', -130, 130, 0, 0], ['maximum-zoom-out', -420, 420, -180, 0], ['maximum-width-grounded', -420, 420, 0, 0], ['left-corner', -405, -290, 0, 0], ['right-corner', 290, 405, 0, 0], ['maximum-mirrored-orbit-left', -420, 420, -180, -1], ['maximum-mirrored-orbit-right', -420, 420, -180, 1] ]) {
      report.views[name] = await page.evaluate(async ({ x1, x2, y, orbit }) => {
        const v = window.__versus;
        const { FallenCapitalArena } = await import('/src/stage/fallenCapital/fallenCapitalArena.ts');
        const host = document.createElement('div'); host.id = 'edgeReview'; host.style.cssText = 'position:fixed;inset:0;width:1600px;height:900px;z-index:99999;background:#111'; document.body.append(host);
        const arena = new FallenCapitalArena(host); await arena.ready;
        const state = JSON.parse(JSON.stringify(v.state));
        Object.assign(state.fighters.p1, { x:x1, y, grounded: y === 0, phase:y ? 'jump':'idle' });
        Object.assign(state.fighters.p2, { x:x2, y, grounded: y === 0, phase:y ? 'jump':'idle' });
        state.ultimateInteraction = orbit ? { tick:106, facing:orbit, phase:'beam' } : undefined;
        // Empty overlay isolates architecture; main playtest still verifies normal fighter composition.
        const foreground = document.createElement('canvas'); foreground.width=1600; foreground.height=900;
        arena.render(state, foreground);
        window.edgeReviewDispose = () => { arena.dispose(); host.remove(); };
        return { ...arena.diagnostics(), sceneChildren:arena.scene.children.length, meshes:arena.scene.children.filter(o=>o.isMesh).length };
      }, { x1, x2, y, orbit });
      await page.locator('#edgeReview').screenshot({ path:path.join(out, `${name}.png`) });
      if (name === 'maximum-zoom-out') await page.screenshot({ path:path.join(out,'maximum-zoom-out-edge-closeup.png'), clip:{x:0,y:740,width:1600,height:160} });
      if (name === 'maximum-width-grounded') await page.screenshot({ path:path.join(out,'maximum-width-grounded-edge-closeup.png'), clip:{x:0,y:720,width:1600,height:180} });
      await page.evaluate(() => window.edgeReviewDispose());
    }
    await page.locator('#tribunalStage').screenshot({path:path.join(out,'normal-gameplay.png')});
    report.actualPresenterSyntheticStress = await page.evaluate(() => {
      const v = window.__versus;
      Object.assign(v.state.fighters.p1,{x:-420,y:-180,grounded:false,phase:'jump'});
      Object.assign(v.state.fighters.p2,{x:420,y:-180,grounded:false,phase:'jump'});
      v.step();
      return { arena:v.arena, fighters:Object.values(v.state.fighters).map(f=>({x:f.x,y:f.y})) };
    });
    await page.locator('#tribunalStage').screenshot({path:path.join(out,'maximum-zoom-out-with-fighters.png')});
    await page.evaluate(() => {
      const v=window.__versus;
      for (const [id,x] of [['p1',-420],['p2',420]]) Object.assign(v.state.fighters[id],{x,y:0,vy:0,grounded:true,phase:'idle'});
      v.step();
    });
    await page.locator('#tribunalStage').screenshot({path:path.join(out,'maximum-width-grounded-with-fighters.png')});
    report.passedTechnical = report.errors.length === 0 && report.failedRequests.length === 0;
  } finally {
    fs.writeFileSync(path.join(out,'QA.json'),JSON.stringify(report,null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
