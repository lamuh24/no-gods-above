// Real presenter captures of every move, next to idle at identical world scale.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { inventory } = require('./swahili_scale_inventory.cjs');
const { engine, groups } = inventory();
const out = path.join(engine, 'docs/versus_playtest/swahili-scale-v1');
const phase = process.argv[2] || 'resolution-fixed';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:4175/versus-playtest.html?character=swahili&air-specials-v1=1');
    await page.waitForFunction(() => !!window.__versus, null, { timeout: 180000 });
    const result = await page.evaluate(({ groups }) => {
      const v = window.__versus; v.pause(false);
      const presenter = v.presenters.p1;
      const entries = [...presenter.images.entries()];
      const source = (file) => entries.find(([url]) => decodeURIComponent(url).split('?')[0].replaceAll('\\', '/').endsWith(file));
      const parityFailures = entries.flatMap(([url, image]) => {
        const other = v.presenters.p2.images.get(url);
        return !other || image.width !== other.width || image.height !== other.height ||
          JSON.stringify(presenter.origins.get(url)) !== JSON.stringify(v.presenters.p2.origins.get(url)) ? [url] : [];
      });
      document.body.innerHTML = '<main id="audit" style="background:#121722;color:#f4eddf;font:18px system-ui;padding:16px"></main>';
      const main = document.querySelector('#audit');
      const idle = source(groups.idle.urls[0])[0];
      const missing = [];
      for (const [name, group] of Object.entries(groups)) {
        const section = document.createElement('section'); section.id = name;
        section.style = 'border-bottom:1px solid #5f626b;height:364px';
        section.innerHTML = `<div style="height:32px">${name} · ${group.urls.length} frames · compared to idle</div>`;
        const indices = [0, Math.floor(group.urls.length / 2), group.urls.length - 1];
        const sources = [idle, ...indices.map(i => { const found = source(group.urls[i]); if (!found) missing.push(group.urls[i]); return found?.[0]; })];
        sources.forEach((url, i) => {
          const canvas = document.createElement('canvas'); canvas.width = 375; canvas.height = 325;
          canvas.style = 'width:375px;height:325px;display:inline-block;border:0;border-radius:0;max-width:none';
          section.appendChild(canvas);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#151e2b'; ctx.fillRect(0, 0, 375, 325);
          ctx.strokeStyle = '#685d3c'; ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(375, 290); ctx.stroke();
          ctx.strokeStyle = '#304963'; ctx.beginPath(); ctx.moveTo(0, 290 - 182 * 1.3); ctx.lineTo(375, 290 - 182 * 1.3); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = '16px system-ui'; ctx.fillText(i === 0 ? 'IDLE' : `FRAME ${indices[i - 1] + 1}`, 8, 22);
          if (url) presenter.put(ctx, url, 187, 290, 1);
        });
        main.appendChild(section);
      }
      return { frameCount: entries.length, missing, failed: [...presenter.failed], parityFailures, normalizedCanvasWidths: [...new Set(entries.map(([, c]) => c.width))] };
    }, { groups });
    const names = Object.keys(groups);
    for (let start = 0; start < names.length; start += 4) {
      await page.evaluate(({ names, start }) => {
        for (const [i, name] of names.entries()) document.getElementById(name).style.display = i >= start && i < start + 4 ? 'block' : 'none';
      }, { names, start });
      await page.locator('#audit').screenshot({ path: path.join(out, `${phase}-${String(start / 4 + 1).padStart(2, '0')}.png`) });
    }
    fs.writeFileSync(path.join(out, `${phase}-browser.json`), JSON.stringify({ ...result, errors }, null, 2));
    if (result.missing.length || result.failed.length || result.parityFailures.length || errors.length) throw new Error(JSON.stringify({ ...result, errors }));
    console.log(JSON.stringify({ ...result, errors, pages: Math.ceil(names.length / 4) }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
