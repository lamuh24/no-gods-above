#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const artifactRoot = path.join(root, 'artifacts', 'lamuh-legacy-v2');
const currentReviewData = JSON.parse(fs.readFileSync(path.join(root, 'public/lamuh-legacy-v2/review-data.json'), 'utf8'));
const expectedCurrentMove = currentReviewData.heavenSplitterFamily ? 'heaven_splitter_medium' : 'celestial_palm_medium';
fs.mkdirSync(artifactRoot, { recursive: true });
function availablePort() { return new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const address = server.address(); server.close(() => resolve(address.port)); }); }); }
function waitForHttp(url, attempts = 80) { return new Promise((resolve, reject) => { const poll = (remaining) => { http.get(url, (response) => { response.resume(); if (response.statusCode === 200) resolve(); else if (remaining) setTimeout(() => poll(remaining - 1), 100); else reject(new Error(`HTTP ${response.statusCode}`)); }).on('error', (error) => remaining ? setTimeout(() => poll(remaining - 1), 100) : reject(error)); }; poll(attempts); }); }

(async () => {
  const port = await availablePort();
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const serverOutput = [];
  server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString())); server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));
  let browser;
  try {
    const origin = `http://127.0.0.1:${port}`;
    await waitForHttp(`${origin}/lamuh-v1-v2-review.html`);
    const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({ headless: true, ...(fs.existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(30000);
    const errors = [], failedRequests = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

    console.log('SMOKE closure comparison route');
    await page.goto(`${origin}/lamuh-v1-v2-review.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.lamuhReview);
    await page.waitForFunction(() => document.querySelector('#styleImage')?.complete && document.querySelector('#styleImage')?.naturalWidth > 0);
    await page.evaluate(() => window.lamuhReview.pause());
    await page.waitForTimeout(150);
    const currentGateAudit = await page.evaluate(() => ({
      state: window.lamuhReview.getState(),
      selectedValue: document.querySelector('#move').value,
      selectedLabel: document.querySelector('#move').selectedOptions[0]?.textContent,
      optionGroups: [...document.querySelectorAll('#move optgroup')].map((group) => group.label),
      gate: document.querySelector('.gate').textContent,
      questions: [...document.querySelectorAll('#questions li')].map((item) => item.textContent),
      sandboxHref: document.querySelector('a[href="/lamuh-legacy-sandbox.html"]')?.getAttribute('href'),
      controls: ['speed1', 'speedHalf', 'step', 'facing', 'restart'].filter((id) => !!document.querySelector(`#${id}`)),
      v1Data: document.querySelector('#v1data').textContent,
      v2Data: document.querySelector('#v2data').textContent,
      facts: document.querySelector('#styleFacts').textContent,
      caption: document.querySelector('#styleCaption').textContent,
      imageSource: document.querySelector('#styleImage').getAttribute('src')
    }));
    await page.screenshot({ path: path.join(artifactRoot, 'current-review-gate-default.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhReview.pause(); window.lamuhReview.selectMove('ascend_step'); window.lamuhReview.selectCandidate('B'); window.lamuhReview.selectImpact('I2'); for (let index = 0; index < 7; index++) await window.lamuhReview.step(); });
    await page.waitForFunction(() => document.querySelector('#styleImage')?.complete && document.querySelector('#styleImage')?.naturalWidth > 0 && document.querySelector('#styleImage')?.src.includes('ascend-step-medium-slide-flip-v1'));
    const ascendStepComparison = await page.evaluate(() => {
      const canvases = ['v1', 'v2'].map((id) => document.querySelector(`#${id}`));
      const pixels = canvases[1].getContext('2d').getImageData(0, 0, canvases[1].width, canvases[1].height).data;
      let purplePixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
      }
      return { state: window.lamuhReview.getState(), differentPixels: canvases[0].toDataURL() !== canvases[1].toDataURL(), purplePixels, v1Data: document.querySelector('#v1data').textContent, v2Data: document.querySelector('#v2data').textContent, facts: document.querySelector('#styleFacts').textContent, caption: document.querySelector('#styleCaption').textContent, debt: document.querySelector('#styleDebt').textContent, imageSource: document.querySelector('#styleImage').getAttribute('src') };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'v1-v2-ascend-step-medium-slide-contact.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhReview.pause(); window.lamuhReview.selectMove('standing_heavy'); window.lamuhReview.selectCandidate('B'); window.lamuhReview.selectImpact('I2'); for (let index = 0; index < 11; index++) await window.lamuhReview.step(); });
    await page.waitForTimeout(250);
    const reviewState = await page.evaluate(() => window.lamuhReview.getState());
    const comparisonAudit = await page.evaluate(() => {
      const canvases = ['v1', 'v2'].map((id) => document.querySelector(`#${id}`));
      const countPurple = (canvas) => { const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; let count = 0; for (let index = 0; index < pixels.length; index += 4) { const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]]; if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) count++; } return count; };
      return { differentPixels: canvases[0].toDataURL() !== canvases[1].toDataURL(), v1PurplePixels: countPurple(canvases[0]), v2PurplePixels: countPurple(canvases[1]), gate: document.querySelector('.gate').textContent, facts: document.querySelector('#styleFacts').textContent };
    });
    await page.click('#speedHalf'); await page.click('#silhouette'); await page.evaluate(() => window.lamuhReview.mirror());
    const overlayState = await page.evaluate(() => window.lamuhReview.getState());
    await page.screenshot({ path: path.join(artifactRoot, 'v1-v2-standing-heavy-closure.png'), fullPage: true });
    await page.evaluate(async () => { const silhouette = document.querySelector('#silhouette'); if (silhouette?.checked) silhouette.click(); window.lamuhReview.pause(); window.lamuhReview.selectMove('air_light'); window.lamuhReview.selectCandidate('B'); window.lamuhReview.selectImpact('I2'); for (let index = 0; index < 3; index++) await window.lamuhReview.step(); });
    const airLightComparison = await page.evaluate(() => {
      const canvas = document.querySelector('#v2');
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let purplePixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
      }
      return { state: window.lamuhReview.getState(), purplePixels, facts: document.querySelector('#styleFacts').textContent, debt: document.querySelector('#styleDebt').textContent };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'v1-v2-air-light-b-contact.png'), fullPage: true });
    await page.evaluate(async () => { const silhouette = document.querySelector('#silhouette'); if (silhouette?.checked) silhouette.click(); window.lamuhReview.pause(); window.lamuhReview.selectMove('air_medium'); window.lamuhReview.selectCandidate('B'); window.lamuhReview.selectImpact('I2'); for (let index = 0; index < 6; index++) await window.lamuhReview.step(); });
    const airMediumComparison = await page.evaluate(() => {
      const canvas = document.querySelector('#v2');
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let purplePixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
      }
      return { state: window.lamuhReview.getState(), purplePixels, facts: document.querySelector('#styleFacts').textContent, debt: document.querySelector('#styleDebt').textContent };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'v1-v2-air-medium-b-contact.png'), fullPage: true });

    const captureThrowReview = async (moveId, ticks, screenshot) => {
      await page.evaluate(async ({ selectedMove, stepCount }) => {
        window.lamuhReview.pause(); window.lamuhReview.selectMove(selectedMove);
        for (let index = 0; index < stepCount; index++) await window.lamuhReview.step();
      }, { selectedMove: moveId, stepCount: ticks });
      await page.waitForFunction(() => document.querySelector('#styleImage')?.complete && document.querySelector('#styleImage')?.naturalWidth > 0 && document.querySelector('#styleImage')?.src.includes('throw-family-v2'));
      const audit = await page.evaluate(() => {
        const canvases = ['v1', 'v2'].map((id) => document.querySelector(`#${id}`));
        const pixels = canvases[1].getContext('2d').getImageData(0, 0, canvases[1].width, canvases[1].height).data;
        let purplePixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
          if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
        }
        return {
          state: window.lamuhReview.getState(),
          differentPixels: canvases[0].toDataURL() !== canvases[1].toDataURL(),
          purplePixels,
          v1Title: document.querySelector('#v1Title').textContent,
          v1Data: document.querySelector('#v1data').textContent,
          v2Data: document.querySelector('#v2data').textContent,
          facts: document.querySelector('#styleFacts').textContent,
          caption: document.querySelector('#styleCaption').textContent,
          imageSource: document.querySelector('#styleImage').getAttribute('src')
        };
      });
      await page.screenshot({ path: path.join(artifactRoot, screenshot), fullPage: true });
      return audit;
    };
    const grabComparison = await captureThrowReview('universal_grab_attempt', 5, 'v1-v2-universal-grab-connect-review.png');
    const forwardThrowComparison = await captureThrowReview('forward_throw', 14, 'v1-v2-forward-throw-release-review.png');
    const backThrowComparison = await captureThrowReview('back_throw', 16, 'v1-v2-back-throw-release-review.png');
    const captureMovementReview = async (moveId, ticks, screenshot, contactSheetFragment) => {
      await page.evaluate(async ({ selectedMove, stepCount }) => {
        window.lamuhReview.pause(); window.lamuhReview.selectMove(selectedMove);
        for (let index = 0; index < stepCount; index++) await window.lamuhReview.step();
      }, { selectedMove: moveId, stepCount: ticks });
      await page.waitForFunction((fragment) => document.querySelector('#styleImage')?.complete && document.querySelector('#styleImage')?.naturalWidth > 0 && document.querySelector('#styleImage')?.src.includes(fragment), contactSheetFragment);
      const audit = await page.evaluate(() => {
        const canvases = ['v1', 'v2'].map((id) => document.querySelector(`#${id}`));
        const pixels = canvases[1].getContext('2d').getImageData(0, 0, canvases[1].width, canvases[1].height).data;
        let purplePixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
          if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
        }
        return { state: window.lamuhReview.getState(), differentPixels: canvases[0].toDataURL() !== canvases[1].toDataURL(), purplePixels, v2Data: document.querySelector('#v2data').textContent, facts: document.querySelector('#styleFacts').textContent, caption: document.querySelector('#styleCaption').textContent };
      });
      await page.screenshot({ path: path.join(artifactRoot, screenshot), fullPage: true });
      return audit;
    };
    const walkBackwardComparison = await captureMovementReview('walk_backward', 7, 'v1-v2-walk-backward-video-rebuild.png', 'walk-backward-video-numbered-contact-sheet');
    const dashForwardComparison = await captureMovementReview('dash_forward', 7, 'v1-v2-dash-forward-modern-style-review.png', 'dash-forward-numbered-contact-sheet');
    const dashBackwardComparison = await captureMovementReview('dash_backward', 9, 'v1-v2-dash-backward-modern-style-review.png', 'dash-backward-directional-repair-numbered-contact-sheet');
    const airDashForwardComparison = await captureMovementReview('air_dash_forward', 5, 'v1-v2-air-dash-forward-modern-style-review.png', 'air-dash-forward-numbered-contact-sheet');
    const airDashBackwardComparison = await captureMovementReview('air_dash_backward', 5, 'v1-v2-air-dash-backward-modern-style-review.png', 'air-dash-backward-numbered-contact-sheet');
    const standingBlockComparison = await captureMovementReview('standing_block', 8, 'v1-v2-standing-block-modern-style-review.png', 'standing-block-numbered-contact-sheet');
    const crouchingBlockComparison = await captureMovementReview('crouching_block', 10, 'v1-v2-crouching-block-adult-identity-review.png', 'crouching-block-numbered-contact-sheet');
    const crouchComparison = await captureMovementReview('crouch', 8, 'v1-v2-crouch-modern-style-review.png', 'crouch-jump-numbered-contact-sheet');
    const crouchReleaseComparison = await captureMovementReview('crouch_to_stand', 5, 'v1-v2-crouch-release-live-transition-review.png', 'crouch-jump-numbered-contact-sheet');
    const jumpComparison = await captureMovementReview('jump', 12, 'v1-v2-jump-adult-proportion-review.png', 'jump-adult-proportion-numbered-contact-sheet');

    console.log('SMOKE closure gameplay sandbox');
    await page.goto(`${origin}/lamuh-legacy-sandbox.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.lamuhSandbox);
    await page.evaluate(async () => { window.lamuhSandbox.pause(); window.lamuhSandbox.reset(); window.lamuhSandbox.scenario('idle → 5M'); await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const standingMediumEntry = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.screenshot({ path: path.join(artifactRoot, 'standing-medium-fixed-scale-entry.png'), fullPage: true });

    const stagePurpleAudit = () => page.evaluate(() => {
      const canvas = document.querySelector('#stage');
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let purplePixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) purplePixels++;
      }
      return purplePixels;
    });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Walk backward'); for (let index = 0; index < 8; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const walkBackward = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    walkBackward.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'walk-backward-directional-repair.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Dash forward'); for (let index = 0; index < 4; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const dashForward = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    dashForward.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'dash-forward-modern-entry.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Dash backward'); for (let index = 0; index < 4; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const dashBackward = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    dashBackward.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'dash-backward-modern-entry.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.scenario('Air dash forward'); for (let index = 0; index < 9; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airDashForward = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    airDashForward.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'air-dash-forward-entry.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.scenario('Air dash backward'); for (let index = 0; index < 9; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airDashBackward = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    airDashBackward.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'air-dash-backward-entry.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Standing block'); for (let index = 0; index < 4; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const standingBlock = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    standingBlock.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'standing-block-modern-hold.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Crouching block'); for (let index = 0; index < 12; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const crouchingBlock = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    crouchingBlock.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'crouching-block-adult-identity-hold.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Crouch movement'); for (let index = 0; index < 12; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const crouchMovement = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    crouchMovement.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'crouch-modern-style-hold.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Crouch release'); for (let index = 0; index < 20; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const crouchRelease = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    crouchRelease.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'crouch-release-live-transition.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('Jump movement'); for (let index = 0; index < 7; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const jumpRise = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    jumpRise.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'jump-modern-style-rise.png'), fullPage: true });
    await page.evaluate(async () => { for (let index = 0; index < 13; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const jumpApex = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'jump-modern-style-apex.png'), fullPage: true });
    const jumpLanding = await page.evaluate(async () => {
      let guard = 0;
      while (window.lamuhSandbox.getState().fighters.p1.phase !== 'landing' && guard++ < 50) await window.lamuhSandbox.step();
      await window.lamuhSandbox.render();
      return { state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent), guard };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'jump-modern-style-landing.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('jump → j.M'); for (let index = 0; index < 9; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airMediumEntry = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'air-medium-modern-entry.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('j.L one-hit check'); for (let index = 0; index < 35; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airLightHitParity = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'air-light-one-hit-check.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('j.M one-hit check'); for (let index = 0; index < 40; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airMediumHitParity = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'air-medium-one-hit-check.png'), fullPage: true });
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('jump → j.H'); for (let index = 0; index < 9; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const airHeavyEntry = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'air-heavy-modern-entry.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.selectTiming('B'); window.lamuhSandbox.selectImpact('I2'); window.lamuhSandbox.scenario('Ascend Step Medium'); for (let index = 0; index < 8; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const ascendStepSandbox = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), review: window.lamuhSandbox.getReviewState(), readout: JSON.parse(document.querySelector('#readout').textContent), artDebt: document.querySelector('#artdebt').textContent }));
    ascendStepSandbox.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'ascend-step-medium-slide-contact-playtest.png'), fullPage: true });
    const ascendStepLauncherSandbox = await page.evaluate(async () => {
      let guard = 0;
      while (window.lamuhSandbox.getState().fighters.p2.hitCountTaken < 2 && guard++ < 80) await window.lamuhSandbox.step();
      await window.lamuhSandbox.render();
      return { state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent), guard };
    });
    ascendStepLauncherSandbox.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'ascend-step-medium-launcher-contact-playtest.png'), fullPage: true });
    const ascendStepPostContactSandbox = await page.evaluate(async () => {
      let guard = 0;
      while (window.lamuhSandbox.getState().fighters.p1.currentAttack === 'legacy_ascend_step' && window.lamuhSandbox.getState().fighters.p1.phaseTick < 30 && guard++ < 60) await window.lamuhSandbox.step();
      await window.lamuhSandbox.render();
      return { state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent), guard };
    });
    ascendStepPostContactSandbox.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'ascend-step-medium-post-contact-tuck-playtest.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.selectTiming('B'); window.lamuhSandbox.selectImpact('I2'); window.lamuhSandbox.scenario('Ascend Step Heavy'); for (let index = 0; index < 24; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const ascendStepHeavySandbox = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent), artDebt: document.querySelector('#artdebt').textContent }));
    ascendStepHeavySandbox.purplePixels = await stagePurpleAudit();
    await page.screenshot({ path: path.join(artifactRoot, 'ascend-step-heavy-rear-blast-contact-playtest.png'), fullPage: true });

    await page.evaluate(() => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); });
    await page.keyboard.press('Shift');
    await page.evaluate(async () => { for (let index = 0; index < 3; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const shiftDashForward = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.evaluate(() => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); });
    await page.keyboard.down('a'); await page.keyboard.press('Shift'); await page.keyboard.up('a');
    await page.evaluate(async () => { for (let index = 0; index < 3; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const shiftDashBackward = await page.evaluate(() => window.lamuhSandbox.getState());

    const pushboxPressure = await page.evaluate(async () => {
      window.lamuhSandbox.selectSide('p1'); window.lamuhSandbox.selectSpace('right_corner'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.pause();
      window.lamuhSandbox.scenario('Pushbox pressure');
      for (let index = 0; index < 90; index++) await window.lamuhSandbox.step();
      await window.lamuhSandbox.render();
      return {
        state: window.lamuhSandbox.getState(),
        readout: JSON.parse(document.querySelector('#readout').textContent),
        pushboxToggleChecked: document.querySelector('#pushboxes')?.checked === true,
        reviewMark: document.querySelector('#pushboxReviewMark')?.textContent || ''
      };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'fighter-pushbox-pressure.png'), fullPage: true });

    const boundedMovement = await page.evaluate(async () => {
      window.lamuhSandbox.selectSide('p1'); window.lamuhSandbox.selectSpace('center'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.pause();
      window.lamuhSandbox.queue(...Array.from({ length: 300 }, () => ({ right: true })));
      for (let index = 0; index < 300; index++) await window.lamuhSandbox.step();
      const p1 = window.lamuhSandbox.getState();
      window.lamuhSandbox.selectSide('p2'); window.lamuhSandbox.selectSpace('center'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.pause();
      window.lamuhSandbox.queue(...Array.from({ length: 300 }, () => ({ left: true })));
      for (let index = 0; index < 300; index++) await window.lamuhSandbox.step();
      await window.lamuhSandbox.render();
      const p2 = window.lamuhSandbox.getState();
      window.lamuhSandbox.selectSide('p1');
      return { p1X: p1.fighters.p1.x, p1Bounds: [p1.stage.left, p1.stage.right], p2X: p2.fighters.p2.x, p2Bounds: [p2.stage.left, p2.stage.right] };
    });

    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.pause(); window.lamuhSandbox.scenario('crouch → 2H'); for (let index = 0; index < 13; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const crouchingHeavyScaleReview = await page.evaluate(async () => {
      const review = await (await fetch('/lamuh-legacy-v2/review-data.json')).json();
      const vfx = document.querySelector('#vfx');
      vfx.checked = true;
      await window.lamuhSandbox.render();
      const withVfxToggleEnabled = document.querySelector('#stage').toDataURL();
      const readout = JSON.parse(document.querySelector('#readout').textContent);
      vfx.checked = false;
      await window.lamuhSandbox.render();
      const withVfxToggleDisabled = document.querySelector('#stage').toDataURL();
      vfx.checked = true;
      await window.lamuhSandbox.render();
      return {
        state: window.lamuhSandbox.getState(),
        sequenceScale: review.crouchingHeavyClosure.v2.singleSequenceScale,
        contactContract: review.crouchingHeavyClosure.v2.contactPresentation,
        readout,
        vfxToggleChangesContactFrame: withVfxToggleEnabled !== withVfxToggleDisabled
      };
    });
    await page.screenshot({ path: path.join(artifactRoot, 'crouching-heavy-sequence-scale-095.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.pause(); window.lamuhSandbox.selectTiming('C'); window.lamuhSandbox.selectImpact('I3'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.scenario('5H outcome'); for (let index = 0; index < 24; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const hitState = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), review: window.lamuhSandbox.getReviewState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'standing-heavy-candidate-c-hit.png'), fullPage: true });

    await page.evaluate(async () => { window.lamuhSandbox.selectOutcome('stand_block'); window.lamuhSandbox.scenario('5H outcome'); for (let index = 0; index < 26; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const blockState = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.evaluate(async () => { window.lamuhSandbox.selectTiming('B'); window.lamuhSandbox.selectImpact('I2'); window.lamuhSandbox.selectOutcome('whiff'); window.lamuhSandbox.scenario('5H outcome'); for (let index = 0; index < 12; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const whiffState = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));

    await page.evaluate(async () => { window.lamuhSandbox.selectSide('p2'); window.lamuhSandbox.selectTiming('A'); window.lamuhSandbox.selectImpact('I1'); window.lamuhSandbox.selectSpace('right_corner'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.scenario('5H outcome'); for (let index = 0; index < 22; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const mirroredCorner = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), review: window.lamuhSandbox.getReviewState() }));

    await page.evaluate(async () => { window.lamuhSandbox.selectSide('p1'); window.lamuhSandbox.selectSpace('center'); window.lamuhSandbox.selectOutcome('hit'); window.lamuhSandbox.scenario('Forward throw'); for (let index = 0; index < 10; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const forwardThrowMid = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'forward-throw-dedicated-mid-track.png'), fullPage: true });
    await page.evaluate(async () => { for (let index = 0; index < 50; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const forwardThrow = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.evaluate(async () => { window.lamuhSandbox.reset(); window.lamuhSandbox.scenario('Back throw'); for (let index = 0; index < 12; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const backThrowMid = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'back-throw-dedicated-mid-track.png'), fullPage: true });
    await page.evaluate(async () => { for (let index = 0; index < 60; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const backThrow = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.evaluate(async () => { window.lamuhSandbox.scenario('Grab whiff → neutral'); for (let index = 0; index < 8; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const grabWhiffMid = await page.evaluate(() => ({ state: window.lamuhSandbox.getState(), readout: JSON.parse(document.querySelector('#readout').textContent) }));
    await page.screenshot({ path: path.join(artifactRoot, 'grab-whiff-dedicated-recoil.png'), fullPage: true });
    await page.evaluate(async () => { for (let index = 0; index < 50; index++) await window.lamuhSandbox.step(); await window.lamuhSandbox.render(); });
    const grabWhiff = await page.evaluate(() => window.lamuhSandbox.getState());
    await page.screenshot({ path: path.join(artifactRoot, 'first-playable-closure-sandbox.png'), fullPage: true });

    if (currentGateAudit.state.moveId !== expectedCurrentMove || currentGateAudit.state.kind !== 'attack' || currentGateAudit.selectedValue !== `attack:${expectedCurrentMove}`) throw new Error(`comparison route did not open the available current-family review: ${JSON.stringify(currentGateAudit)}`);
    if (!currentGateAudit.gate.includes('CURRENT GATE: HEAVEN SPLITTER') || !currentGateAudit.gate.includes('CANDIDATE ONLY') || !currentGateAudit.gate.includes('NO PRODUCTION PROMOTION') || !currentGateAudit.gate.includes('FORWARD SPECIALS')) throw new Error(`current review gate or preservation boundary missing: ${JSON.stringify(currentGateAudit)}`);
    const currentQuestions = currentGateAudit.questions.join(' ');
    if (![/motion|anti.air/i, /single|one.*hit|hit.count/i, /scale|adult/i, /transition|recover|connected landing/i, /counterplay|block|jump|punish/i].every((pattern) => pattern.test(currentQuestions))) throw new Error(`current human decision queue incomplete: ${currentQuestions}`);
    // Keep the detailed accepted-forward regression, but inspect its explicit selection rather than the new default gate.
    if (!ascendStepComparison.v1Data.includes('30 ticks') || !ascendStepComparison.v2Data.includes('world Δx 0 → 90 → 59') || !ascendStepComparison.v2Data.includes('48 ticks') || !ascendStepComparison.facts.includes('16 distinct frames') || !ascendStepComparison.facts.includes('traveling slide + coil + one rising-heel handspring launcher') || !ascendStepComparison.facts.includes('adult locked / chibi rejected') || !ascendStepComparison.facts.includes('2 / 2') || !ascendStepComparison.caption.includes('16 FRAMES') || !ascendStepComparison.caption.includes('TRAVELING SLIDE') || !ascendStepComparison.caption.includes('COIL') || !ascendStepComparison.caption.includes('HAND PLANT') || !ascendStepComparison.caption.includes('ONE RISING-HEEL CONTACT') || !ascendStepComparison.caption.includes('AUTHORED TUCK') || !ascendStepComparison.caption.includes('CONTROLLED LANDING') || !ascendStepComparison.imageSource.includes('ascend-step-medium-slide-flip-v1')) throw new Error(`Ascend Step Medium source boundary, two-contact contract, adult identity, or root-path evidence missing: ${JSON.stringify(ascendStepComparison)}`);
    if (currentGateAudit.sandboxHref !== '/lamuh-legacy-sandbox.html' || currentGateAudit.controls.length !== 5 || !currentGateAudit.optionGroups.includes('PRESERVED MOVEMENT / DEFENSE') || !currentGateAudit.optionGroups.includes('NEW V2 STANDARD GRAB / THROWS')) throw new Error(`current review controls or route link missing: ${JSON.stringify(currentGateAudit)}`);
    if (!ascendStepComparison.v1Data.includes('30 ticks') || !ascendStepComparison.v1Data.includes('not exactly recoverable')) throw new Error(`V1 Ascend Step historical evidence did not render: ${JSON.stringify(ascendStepComparison.v1Data)}`);
    if (!ascendStepComparison.v2Data.includes('world Δx 0 → 90 → 59') || !ascendStepComparison.v2Data.includes('simulation-owned') || !ascendStepComparison.v2Data.includes('48 ticks') || !ascendStepComparison.v2Data.includes('tick 7') || !ascendStepComparison.v2Data.includes('tick 26')) throw new Error(`V2 Ascend Step Medium evidence did not render: ${JSON.stringify(ascendStepComparison.v2Data)}`);
    if (ascendStepComparison.state.moveId !== 'ascend_step' || ascendStepComparison.state.candidate !== 'B' || !ascendStepComparison.differentPixels || ascendStepComparison.purplePixels > 20 || !ascendStepComparison.facts.includes('traveling slide + coil + one rising-heel handspring launcher') || !ascendStepComparison.facts.includes('adult locked / chibi rejected') || !ascendStepComparison.facts.includes('2 / 2') || !ascendStepComparison.caption.includes('TRAVELING SLIDE') || !ascendStepComparison.caption.includes('ONE RISING-HEEL CONTACT') || !ascendStepComparison.debt.includes('STARRED FOR POLISH') || !ascendStepComparison.debt.includes('contact height') || !ascendStepComparison.debt.includes('registration')) throw new Error(`Ascend Step Medium V1/V2 comparison failed: ${JSON.stringify(ascendStepComparison)}`);
    if (reviewState.moveId !== 'standing_heavy' || reviewState.candidate !== 'B' || reviewState.impact !== 'I2' || reviewState.cursor !== 11) throw new Error('comparison route timing/impact/frame advance mismatch');
    if (!comparisonAudit.differentPixels) throw new Error('V1 and V2 comparison canvases are not visually distinct');
    if (!comparisonAudit.gate.includes('CANDIDATE ONLY') || !comparisonAudit.gate.includes('NO PRODUCTION PROMOTION') || !comparisonAudit.facts.includes('promotionblocked') || !comparisonAudit.facts.includes('7 distinct')) throw new Error('comparison promotion/sequence evidence missing');
    if (comparisonAudit.v2PurplePixels > 20 || (comparisonAudit.v1PurplePixels > 0 && comparisonAudit.v2PurplePixels / comparisonAudit.v1PurplePixels >= .01)) throw new Error(`V2 purple contour audit failed: ${JSON.stringify(comparisonAudit)}`);
    if (overlayState.speed !== .5 || overlayState.facing !== -1 || !overlayState.silhouette) throw new Error('review speed/mirror/silhouette controls failed');
    if (airLightComparison.state.moveId !== 'air_light' || airLightComparison.state.candidate !== 'B' || airLightComparison.state.cursor !== 3 || !airLightComparison.facts.includes('5 distinct') || !airLightComparison.debt.includes('BODY_ONLY')) throw new Error(`Air Light comparison route failed: ${JSON.stringify(airLightComparison)}`);
    if (airLightComparison.purplePixels > 20) throw new Error(`Air Light modern V2 purple contour audit failed: ${airLightComparison.purplePixels}`);
    if (airMediumComparison.state.moveId !== 'air_medium' || airMediumComparison.state.candidate !== 'B' || airMediumComparison.state.cursor !== 6 || !airMediumComparison.facts.includes('6 distinct') || !airMediumComparison.debt.includes('BODY_ONLY')) throw new Error(`Air Medium comparison route failed: ${JSON.stringify(airMediumComparison)}`);
    if (airMediumComparison.purplePixels > 20) throw new Error(`Air Medium modern V2 purple contour audit failed: ${airMediumComparison.purplePixels}`);
    for (const [label, audit, releaseTick] of [['standard grab', grabComparison, null], ['forward throw', forwardThrowComparison, 14], ['back throw', backThrowComparison, 16]]) {
      if (audit.state.kind !== 'throw' || !audit.differentPixels || !audit.v1Title.includes('required state was missing') || !audit.v1Data.includes('NO RECOVERABLE V1 UNIVERSAL THROW SOURCE')) throw new Error(`${label} V1/V2 missing-state boundary failed: ${JSON.stringify(audit)}`);
      if (!audit.v2Data.includes('body path overlay') || !audit.v2Data.includes('fixed 768, 1360') || !audit.facts.includes('6 distinct frames') || !audit.facts.includes('blocked')) throw new Error(`${label} V2 fixed-root review evidence failed: ${JSON.stringify(audit)}`);
      if (!audit.caption.includes('18 DEDICATED FRAMES') || !audit.imageSource.includes('throw-family-v2') || audit.purplePixels > 20) throw new Error(`${label} throw contact-sheet/style evidence failed: ${JSON.stringify(audit)}`);
      if (releaseTick === null ? !audit.v2Data.includes('no release') : !audit.v2Data.includes(`release tick ${releaseTick}`)) throw new Error(`${label} connect/release timing evidence failed: ${JSON.stringify(audit)}`);
    }
    if (crouchComparison.state.kind !== 'state' || crouchComparison.state.moveId !== 'crouch' || !crouchComparison.differentPixels || crouchComparison.purplePixels > 20 || !crouchComparison.caption.includes('13 DISTINCT CROUCH/JUMP FRAMES')) throw new Error(`crouch V1/V2 movement comparison failed: ${JSON.stringify(crouchComparison)}`);
    if (crouchingBlockComparison.state.kind !== 'state' || crouchingBlockComparison.state.moveId !== 'crouching_block' || !crouchingBlockComparison.differentPixels || crouchingBlockComparison.purplePixels > 20 || !crouchingBlockComparison.facts.includes('4 distinct frames') || !crouchingBlockComparison.caption.includes('4 ADULT-PROPORTION CROUCH BLOCK FRAMES')) throw new Error(`Crouching Block adult-identity comparison failed: ${JSON.stringify(crouchingBlockComparison)}`);
    if (jumpComparison.state.kind !== 'state' || jumpComparison.state.moveId !== 'jump' || !jumpComparison.differentPixels || jumpComparison.purplePixels > 20 || !jumpComparison.facts.includes('7 distinct frames') || !jumpComparison.caption.includes('7 ADULT-PROPORTION JUMP FRAMES') || !jumpComparison.caption.includes('PHYSICS UNCHANGED')) throw new Error(`Jump adult-proportion comparison failed: ${JSON.stringify(jumpComparison)}`);
    for (const audit of [crouchComparison, crouchingBlockComparison, jumpComparison]) if (!audit.v2Data.includes('fixed 768, 1360') || !audit.facts.includes('runtime rescaledisabled')) throw new Error(`fixed-scale movement evidence failed: ${JSON.stringify(audit)}`);
    for (const [label, audit, frameCount] of [['dash_forward', dashForwardComparison, 6], ['air_dash_forward', airDashForwardComparison, 6], ['air_dash_backward', airDashBackwardComparison, 5], ['standing_block', standingBlockComparison, 4]]) {
      if (audit.state.kind !== 'state' || audit.state.moveId !== label || !audit.differentPixels || audit.purplePixels > 20) throw new Error(`${label} V1/V2 dash-block comparison failed: ${JSON.stringify(audit)}`);
      if (!audit.v2Data.includes('fixed 768, 1360') || !audit.facts.includes(`${frameCount} distinct frames`) || !audit.facts.includes('runtime rescaledisabled') || !audit.caption.includes('26 DISTINCT DASH / AIR-DASH / BLOCK FRAMES')) throw new Error(`${label} fixed-scale dash-block evidence failed: ${JSON.stringify(audit)}`);
    }
    if (walkBackwardComparison.state.kind !== 'state' || walkBackwardComparison.state.moveId !== 'walk_backward' || !walkBackwardComparison.differentPixels || walkBackwardComparison.purplePixels > 20) throw new Error(`walk_backward V1/V2 video-derived comparison failed: ${JSON.stringify(walkBackwardComparison)}`);
    if (!walkBackwardComparison.v2Data.includes('fixed 768, 1360') || !walkBackwardComparison.facts.includes('7 distinct frames') || !walkBackwardComparison.facts.includes('runtime rescaledisabled') || !walkBackwardComparison.caption.includes('7 USER-VIDEO WALK BACK FRAMES') || !walkBackwardComparison.caption.includes('REVERSED SOURCE CYCLE') || !walkBackwardComparison.caption.includes('18 TICKS')) throw new Error(`walk_backward video-derived evidence failed: ${JSON.stringify(walkBackwardComparison)}`);
    if (dashBackwardComparison.state.kind !== 'state' || dashBackwardComparison.state.moveId !== 'dash_backward' || !dashBackwardComparison.differentPixels || dashBackwardComparison.purplePixels > 20) throw new Error(`dash_backward V1/V2 directional comparison failed: ${JSON.stringify(dashBackwardComparison)}`);
    if (!dashBackwardComparison.v2Data.includes('fixed 768, 1360') || !dashBackwardComparison.facts.includes('5 distinct frames') || !dashBackwardComparison.facts.includes('runtime rescaledisabled') || !dashBackwardComparison.caption.includes('5 DISTINCT BACK DASH FRAMES') || !dashBackwardComparison.caption.includes('TIMING UNCHANGED')) throw new Error(`dash_backward directional evidence failed: ${JSON.stringify(dashBackwardComparison)}`);
    if (standingMediumEntry.fighters.p1.currentAttack !== 'standing_medium' || standingMediumEntry.fighters.p1.phase !== 'attack') throw new Error('Standing Medium fixed-scale entry scenario failed');
    if (walkBackward.state.fighters.p1.phase !== 'walk_backward' || walkBackward.state.fighters.p1.x >= 0 || walkBackward.readout.visualPackage !== 'modern_movement' || walkBackward.purplePixels > 20) throw new Error(`modern walk-back browser scenario failed: ${JSON.stringify(walkBackward)}`);
    if (dashForward.state.fighters.p1.phase !== 'dash' || dashForward.readout.visualPackage !== 'modern_movement' || dashForward.purplePixels > 20) throw new Error(`modern forward dash browser scenario failed: ${JSON.stringify(dashForward)}`);
    if (dashBackward.state.fighters.p1.phase !== 'backdash' || dashBackward.readout.visualPackage !== 'modern_movement' || dashBackward.purplePixels > 20) throw new Error(`modern backward dash browser scenario failed: ${JSON.stringify(dashBackward)}`);
    if (airDashForward.state.fighters.p1.phase !== 'air_dash_forward' || airDashForward.state.fighters.p1.airDashesRemaining !== 0 || airDashForward.readout.visualPackage !== 'modern_movement' || airDashForward.purplePixels > 20) throw new Error(`modern forward air-dash browser scenario failed: ${JSON.stringify(airDashForward)}`);
    if (airDashBackward.state.fighters.p1.phase !== 'air_dash_backward' || airDashBackward.state.fighters.p1.airDashesRemaining !== 0 || airDashBackward.readout.visualPackage !== 'modern_movement' || airDashBackward.purplePixels > 20) throw new Error(`modern backward air-dash browser scenario failed: ${JSON.stringify(airDashBackward)}`);
    if (standingBlock.state.fighters.p1.phase !== 'block' || standingBlock.readout.visualPackage !== 'modern_movement' || standingBlock.purplePixels > 20) throw new Error(`modern standing-block browser scenario failed: ${JSON.stringify(standingBlock)}`);
    if (crouchingBlock.state.fighters.p1.phase !== 'block' || crouchingBlock.state.fighters.p1.crouchBlocking !== true || crouchingBlock.readout.visualPackage !== 'modern_movement' || crouchingBlock.purplePixels > 20) throw new Error(`modern Crouching Block browser scenario failed: ${JSON.stringify(crouchingBlock)}`);
    if (crouchMovement.state.fighters.p1.phase !== 'crouch' || crouchMovement.readout.visualPackage !== 'modern_movement' || crouchMovement.purplePixels > 20) throw new Error(`modern crouch browser scenario failed: ${JSON.stringify(crouchMovement)}`);
    if (crouchRelease.state.fighters.p1.phase !== 'crouch_release' || crouchRelease.readout.visualPackage !== 'modern_movement' || crouchRelease.purplePixels > 20) throw new Error(`live crouch-release browser scenario failed: ${JSON.stringify(crouchRelease)}`);
    if (jumpRise.state.fighters.p1.phase !== 'jump' || jumpRise.readout.visualPackage !== 'modern_movement' || jumpRise.purplePixels > 20) throw new Error(`modern jump rise browser scenario failed: ${JSON.stringify(jumpRise)}`);
    if (jumpApex.state.fighters.p1.phase !== 'jump' || jumpApex.readout.visualPackage !== 'modern_movement') throw new Error(`modern jump apex browser scenario failed: ${JSON.stringify(jumpApex)}`);
    if (jumpLanding.state.fighters.p1.phase !== 'landing' || jumpLanding.readout.visualPackage !== 'modern_movement') throw new Error(`modern jump landing browser scenario failed: ${JSON.stringify(jumpLanding)}`);
    if (airMediumEntry.state.fighters.p1.currentAttack !== 'air_medium' || airMediumEntry.readout.visualPackage !== 'modern_air_normal_candidate') throw new Error(`Air Medium modern sandbox entry failed: ${JSON.stringify(airMediumEntry)}`);
    if (airLightHitParity.state.fighters.p2.hitCountTaken !== 1 || airLightHitParity.state.fighters.p2.health !== 978 || airLightHitParity.readout.combo.count !== 1) throw new Error(`Air Light single-hit browser parity failed: ${JSON.stringify(airLightHitParity)}`);
    if (airMediumHitParity.state.fighters.p2.hitCountTaken !== 1 || airMediumHitParity.state.fighters.p2.health !== 956 || airMediumHitParity.readout.combo.count !== 1 || airMediumHitParity.state.lastCombatEvent?.hitOrdinal !== 1) throw new Error(`Air Medium one-hit browser parity failed: ${JSON.stringify(airMediumHitParity)}`);
    if (airHeavyEntry.state.fighters.p1.currentAttack !== 'air_heavy' || airHeavyEntry.readout.visualPackage !== 'modern_air_normal_candidate') throw new Error(`Air Heavy modern sandbox entry failed: ${JSON.stringify(airHeavyEntry)}`);
    if (ascendStepSandbox.state.fighters.p1.currentAttack !== 'legacy_ascend_step' || ascendStepSandbox.readout.visualPackage !== 'ascend_step_medium_targeted_motion_repair_candidate' || ascendStepSandbox.purplePixels > 20 || ascendStepSandbox.readout.authoredContacts.join(',') !== '3,10' || ascendStepSandbox.readout.attackTiming.join(',') !== '7,24,17' || ascendStepSandbox.readout.opponentKind !== 'lamuh_legacy_v2' || ascendStepSandbox.readout.visibleArenaBounds.join(',') !== '-280,280' || ascendStepSandbox.state.fighters.p2.hitCountTaken !== 1 || ascendStepSandbox.readout.forwardSpecialsReview !== 'passed_for_now_starred' || !ascendStepSandbox.artDebt.includes('Forward L/M/H')) throw new Error(`Ascend Step Medium slide sandbox integration failed: ${JSON.stringify(ascendStepSandbox)}`);
    if (ascendStepLauncherSandbox.state.fighters.p2.hitCountTaken !== 2 || ascendStepLauncherSandbox.state.fighters.p2.health !== 934 || ascendStepLauncherSandbox.state.fighters.p2.grounded !== false || ascendStepLauncherSandbox.state.fighters.p2.vy >= 0 || ascendStepLauncherSandbox.readout.opponentKind !== 'lamuh_legacy_v2' || ascendStepLauncherSandbox.purplePixels > 20) throw new Error(`Ascend Step Medium launcher/victim integration failed: ${JSON.stringify(ascendStepLauncherSandbox)}`);
    if (ascendStepPostContactSandbox.readout.activeFrameRole !== 'post_contact_leg_gather' || ascendStepPostContactSandbox.purplePixels > 40) throw new Error(`Ascend Step Medium authored post-contact tuck did not render: ${JSON.stringify(ascendStepPostContactSandbox)}`);
    if (ascendStepHeavySandbox.state.fighters.p1.currentAttack !== 'legacy_ascend_step_heavy' || ascendStepHeavySandbox.readout.visualPackage !== 'ascend_step_heavy_pause_growing_ball_single_blast_candidate' || ascendStepHeavySandbox.purplePixels > 40 || ascendStepHeavySandbox.readout.authoredContacts.join(',') !== '7' || ascendStepHeavySandbox.readout.attackTiming.join(',') !== '24,5,13' || ascendStepHeavySandbox.readout.activeFrameRole !== 'approved_single_rear_palm_blast_contact' || !ascendStepHeavySandbox.readout.targetSideSwitch || ascendStepHeavySandbox.state.fighters.p2.health !== 916 || ascendStepHeavySandbox.state.fighters.p2.hitCountTaken !== 1 || ascendStepHeavySandbox.readout.forwardSpecialsReview !== 'passed_for_now_starred' || !ascendStepHeavySandbox.artDebt.includes('Forward L/M/H')) throw new Error(`Ascend Step Heavy sandbox integration failed: ${JSON.stringify(ascendStepHeavySandbox)}`);
    if (shiftDashForward.fighters.p1.phase !== 'dash') throw new Error('neutral Shift forward-dash shortcut failed');
    if (shiftDashBackward.fighters.p1.phase !== 'backdash') throw new Error('directional Shift backdash shortcut failed');
    if (pushboxPressure.readout.fighterCollision.pushboxesOverlap || pushboxPressure.readout.fighterCollision.authoredThrowExceptionActive || pushboxPressure.readout.fighterCollision.rootSeparation < 68 || pushboxPressure.state.fighters.p2.x !== 280 || !pushboxPressure.pushboxToggleChecked || pushboxPressure.readout.fighterCollision.reviewDecision !== 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT' || pushboxPressure.readout.fighterCollision.starredForRevisit !== true || !pushboxPressure.reviewMark.includes('PASSED FOR NOW') || !pushboxPressure.reviewMark.includes('REVISIT') || !pushboxPressure.reviewMark.includes('CANDIDATE ONLY')) throw new Error(`deterministic wall-aware fighter pushbox pressure or provisional review mark failed: ${JSON.stringify(pushboxPressure)}`);
    if (boundedMovement.p1Bounds.join(',') !== '-280,280' || boundedMovement.p2Bounds.join(',') !== '-280,280' || boundedMovement.p1X > 280 || boundedMovement.p2X < -280) throw new Error(`visible arena boundary clamp failed: ${JSON.stringify(boundedMovement)}`);
    if (crouchingHeavyScaleReview.sequenceScale !== 0.95 || crouchingHeavyScaleReview.state.fighters.p1.currentAttack !== 'crouching_heavy') throw new Error('Crouching Heavy sequence-wide scale review failed');
    if (crouchingHeavyScaleReview.contactContract.vfxEnabled !== false || crouchingHeavyScaleReview.contactContract.bodyOnlyForAllOutcomes !== true || crouchingHeavyScaleReview.contactContract.classification !== 'DISABLE_FOR_NOW') throw new Error('Crouching Heavy VFX-disable contract failed');
    if (crouchingHeavyScaleReview.readout.contactPresentation !== 'body_only_vfx_disabled' || crouchingHeavyScaleReview.vfxToggleChangesContactFrame) throw new Error('Crouching Heavy still changes visually when the VFX toggle is used');
    if (hitState.review.timing !== 'C' || hitState.review.impact !== 'I3' || hitState.state.fighters.p1.reviewAttackProfile.hitstop !== 10 || hitState.state.lastCombatEvent?.outcome !== 'hit') throw new Error('direct C/I3 hit profile failed');
    if (hitState.readout.contactPresentation !== 'body_plus_contact_event' && hitState.state.fighters.p1.phaseTick === 13) throw new Error('hit contact event did not route');
    if (blockState.lastCombatEvent?.outcome !== 'block') throw new Error('Standing Heavy block scenario failed');
    if (whiffState.state.lastCombatEvent !== null || whiffState.readout.contactPresentation !== 'body_only_no_whiff_spark') throw new Error(`Standing Heavy whiff incorrectly routed a hit presentation: ${JSON.stringify({ event: whiffState.state.lastCombatEvent, phaseTick: whiffState.state.fighters.p1.phaseTick, frame: whiffState.readout.standingHeavyFrame, presentation: whiffState.readout.contactPresentation, positions: [whiffState.state.fighters.p1.x, whiffState.state.fighters.p2.x] })}`);
    if (mirroredCorner.review.side !== 'p2' || mirroredCorner.review.space !== 'right_corner' || mirroredCorner.state.lastCombatEvent?.attacker !== 'p2' || mirroredCorner.state.fighters.p2.attackFacing !== -1) throw new Error('P2 mirrored corner scenario failed');
    if (forwardThrowMid.state.throwInteraction?.result !== 'connected' || forwardThrowMid.readout.visualPackage !== 'dedicated_standard_grab_throw_candidate') throw new Error(`forward throw dedicated animation did not bind: ${JSON.stringify(forwardThrowMid)}`);
    if (forwardThrow.fighters.p2.health !== 930 || forwardThrow.throwInteraction !== null) throw new Error('forward throw completion mismatch');
    if (backThrowMid.state.throwInteraction?.result !== 'connected' || backThrowMid.readout.visualPackage !== 'dedicated_standard_grab_throw_candidate') throw new Error(`back throw dedicated animation did not bind: ${JSON.stringify(backThrowMid)}`);
    if (backThrow.fighters.p2.health !== 925 || !(backThrow.fighters.p2.x < backThrow.fighters.p1.x)) throw new Error('back throw physical side-switch mismatch');
    if (grabWhiffMid.state.throwInteraction?.result !== 'whiff' || grabWhiffMid.readout.visualPackage !== 'dedicated_standard_grab_throw_candidate') throw new Error(`grab whiff dedicated recoil did not bind: ${JSON.stringify(grabWhiffMid)}`);
    if (grabWhiff.fighters.p2.health !== 1000 || grabWhiff.throwInteraction !== null) throw new Error('grab whiff neutral return mismatch');
    if (errors.length || failedRequests.length) throw new Error(`browser diagnostics: ${JSON.stringify({ errors, failedRequests })}`);

    const report = { status: 'PASS', candidateOnly: true, deployable: false, humanReviewStatus: currentReviewData.firstPlayable.currentReviewGate.status, reviewedAt: new Date().toISOString(), origin, currentGateAudit, ascendStepComparison, reviewState, overlayState, comparisonAudit, airLightComparison, airMediumComparison, movementComparison: { walkBackward: walkBackwardComparison, dashForward: dashForwardComparison, dashBackward: dashBackwardComparison, airDashForward: airDashForwardComparison, airDashBackward: airDashBackwardComparison, standingBlock: standingBlockComparison, crouchingBlock: crouchingBlockComparison, crouch: crouchComparison, jump: jumpComparison }, throwComparison: { universalGrab: grabComparison, forwardThrow: forwardThrowComparison, backThrow: backThrowComparison }, gameplay: { ascendStep: { attack: ascendStepSandbox.state.fighters.p1.currentAttack, timing: ascendStepSandbox.readout.attackTiming, visualPackage: ascendStepSandbox.readout.visualPackage, firstContactDamage: 1000 - ascendStepSandbox.state.fighters.p2.health, finalDamage: 1000 - ascendStepLauncherSandbox.state.fighters.p2.health, finalHits: ascendStepLauncherSandbox.state.fighters.p2.hitCountTaken, launched: !ascendStepLauncherSandbox.state.fighters.p2.grounded, postContactRole: ascendStepPostContactSandbox.readout.activeFrameRole, opponentKind: ascendStepSandbox.readout.opponentKind, visibleArenaBounds: ascendStepSandbox.readout.visibleArenaBounds, purplePixels: Math.max(ascendStepSandbox.purplePixels, ascendStepLauncherSandbox.purplePixels, ascendStepPostContactSandbox.purplePixels) }, ascendStepHeavy: { attack: ascendStepHeavySandbox.state.fighters.p1.currentAttack, timing: ascendStepHeavySandbox.readout.attackTiming, visualPackage: ascendStepHeavySandbox.readout.visualPackage, damage: 1000 - ascendStepHeavySandbox.state.fighters.p2.health, hits: ascendStepHeavySandbox.state.fighters.p2.hitCountTaken, purplePixels: ascendStepHeavySandbox.purplePixels }, boundedMovement, standingMediumEntry: standingMediumEntry.fighters.p1.currentAttack, walkBackward: { phase: walkBackward.state.fighters.p1.phase, x: walkBackward.state.fighters.p1.x, visualPackage: walkBackward.readout.visualPackage, purplePixels: walkBackward.purplePixels }, dashForward: { phase: dashForward.state.fighters.p1.phase, visualPackage: dashForward.readout.visualPackage, purplePixels: dashForward.purplePixels }, dashBackward: { phase: dashBackward.state.fighters.p1.phase, visualPackage: dashBackward.readout.visualPackage, purplePixels: dashBackward.purplePixels }, airDashForward: { phase: airDashForward.state.fighters.p1.phase, remaining: airDashForward.state.fighters.p1.airDashesRemaining, visualPackage: airDashForward.readout.visualPackage, purplePixels: airDashForward.purplePixels }, airDashBackward: { phase: airDashBackward.state.fighters.p1.phase, remaining: airDashBackward.state.fighters.p1.airDashesRemaining, visualPackage: airDashBackward.readout.visualPackage, purplePixels: airDashBackward.purplePixels }, standingBlock: { phase: standingBlock.state.fighters.p1.phase, visualPackage: standingBlock.readout.visualPackage, purplePixels: standingBlock.purplePixels }, crouchingBlock: { phase: crouchingBlock.state.fighters.p1.phase, crouchBlocking: crouchingBlock.state.fighters.p1.crouchBlocking, visualPackage: crouchingBlock.readout.visualPackage, purplePixels: crouchingBlock.purplePixels }, crouchMovement: { phase: crouchMovement.state.fighters.p1.phase, visualPackage: crouchMovement.readout.visualPackage, purplePixels: crouchMovement.purplePixels }, jumpMovement: { risePhase: jumpRise.state.fighters.p1.phase, apexPhase: jumpApex.state.fighters.p1.phase, landingPhase: jumpLanding.state.fighters.p1.phase, visualPackage: jumpLanding.readout.visualPackage }, airMediumEntry: airMediumEntry.state.fighters.p1.currentAttack, airLightHitParity: { hits: airLightHitParity.state.fighters.p2.hitCountTaken, damage: 1000 - airLightHitParity.state.fighters.p2.health }, airMediumHitParity: { hits: airMediumHitParity.state.fighters.p2.hitCountTaken, damage: 1000 - airMediumHitParity.state.fighters.p2.health }, airHeavyEntry: airHeavyEntry.state.fighters.p1.currentAttack, shiftDashForward: shiftDashForward.fighters.p1.phase, shiftDashBackward: shiftDashBackward.fighters.p1.phase, crouchingHeavySequenceScale: crouchingHeavyScaleReview.sequenceScale, crouchingHeavyContactPresentation: crouchingHeavyScaleReview.readout.contactPresentation, crouchingHeavyVfxToggleChangesContactFrame: crouchingHeavyScaleReview.vfxToggleChangesContactFrame, hitProfile: hitState.review, hitOutcome: hitState.state.lastCombatEvent?.outcome, blockOutcome: blockState.lastCombatEvent?.outcome, whiffOutcome: whiffState.state.lastCombatEvent, mirroredCorner: mirroredCorner.review }, throws: { visualPackage: forwardThrowMid.readout.visualPackage, forwardHealth: forwardThrow.fighters.p2.health, backHealth: backThrow.fighters.p2.health, backSideSwitched: backThrow.fighters.p2.x < backThrow.fighters.p1.x, whiffVictimHealth: grabWhiff.fighters.p2.health }, errors, failedRequests, screenshots: ['current-review-gate-default.png', 'v1-v2-ascend-step-medium-slide-contact.png', 'ascend-step-medium-slide-contact-playtest.png', 'ascend-step-medium-launcher-contact-playtest.png', 'ascend-step-medium-post-contact-tuck-playtest.png', 'ascend-step-heavy-rear-blast-contact-playtest.png', 'v1-v2-standing-heavy-closure.png', 'v1-v2-air-light-b-contact.png', 'v1-v2-air-medium-b-contact.png', 'v1-v2-universal-grab-connect-review.png', 'v1-v2-forward-throw-release-review.png', 'v1-v2-back-throw-release-review.png', 'v1-v2-walk-backward-directional-repair.png', 'v1-v2-dash-forward-modern-style-review.png', 'v1-v2-dash-backward-modern-style-review.png', 'v1-v2-air-dash-forward-modern-style-review.png', 'v1-v2-air-dash-backward-modern-style-review.png', 'v1-v2-standing-block-modern-hold.png', 'v1-v2-crouching-block-adult-identity-review.png', 'v1-v2-crouch-modern-style-review.png', 'v1-v2-jump-adult-proportion-review.png', 'standing-medium-fixed-scale-entry.png', 'walk-backward-directional-repair.png', 'dash-forward-modern-entry.png', 'dash-backward-modern-entry.png', 'air-dash-forward-entry.png', 'air-dash-backward-entry.png', 'standing-block-modern-hold.png', 'crouching-block-adult-identity-hold.png', 'crouch-modern-style-hold.png', 'jump-modern-style-rise.png', 'jump-modern-style-apex.png', 'jump-modern-style-landing.png', 'air-medium-modern-entry.png', 'air-light-one-hit-check.png', 'air-medium-one-hit-check.png', 'air-heavy-modern-entry.png', 'crouching-heavy-sequence-scale-095.png', 'standing-heavy-candidate-c-hit.png', 'forward-throw-dedicated-mid-track.png', 'back-throw-dedicated-mid-track.png', 'grab-whiff-dedicated-recoil.png', 'first-playable-closure-sandbox.png'] };
    report.movementComparison.crouchRelease = crouchReleaseComparison;
    report.gameplay.crouchRelease = { phase: crouchRelease.state.fighters.p1.phase, phaseTick: crouchRelease.state.fighters.p1.phaseTick, visualPackage: crouchRelease.readout.visualPackage, purplePixels: crouchRelease.purplePixels };
    report.screenshots.push('v1-v2-crouch-release-live-transition-review.png', 'crouch-release-live-transition.png');
    fs.writeFileSync(path.join(artifactRoot, 'browser-smoke-closure.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log('PASS Lamuh Legacy V2 first-playable closure browser smoke');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
