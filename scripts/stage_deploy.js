#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const gameRoot = path.join(repoRoot, 'NO_GODS_ABOVE');
const stageRoot = path.resolve(process.argv[2] || process.env.NGA_DEPLOY_STAGE || path.join(os.tmpdir(), 'nga_deploy'));

function read(rel) {
  return fs.readFileSync(path.join(gameRoot, rel), 'utf8');
}

function addMatches(set, text, pattern, group = 1) {
  for (const match of text.matchAll(pattern)) {
    const value = match[group];
    if (value && !value.includes('${') && !/[{}]/.test(value)) {
      set.add(value.split('?')[0]);
    }
  }
}

function copyFile(rel) {
  const src = path.join(gameRoot, rel);
  const dest = path.join(stageRoot, rel);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageRoot, { recursive: true });

const assets = new Set();
const assetPattern = /assets\/[^"'`\\?]+\.(?:png|jpg|jpeg|webp|gif|mp3|ogg|wav|json)/g;
for (const rel of ['game.js', 'index.html']) {
  for (const match of read(rel).matchAll(assetPattern)) {
    const value = match[0];
    if (!value.includes('${') && !/[{}]/.test(value)) assets.add(value.split('?')[0]);
  }
}
addMatches(assets, read('style.css'), /url\(["']?(assets\/[^"')]+)["']?\)/g);

const portraitDir = path.join(gameRoot, 'assets', 'sprites', 'portraits');
for (const name of fs.readdirSync(portraitDir)) {
  const full = path.join(portraitDir, name);
  if (fs.statSync(full).isFile()) assets.add(`assets/sprites/portraits/${name}`);
}

const missing = [];
let copied = 0;
for (const rel of [...assets].sort()) {
  if (copyFile(rel)) copied += 1;
  else missing.push(rel);
}
for (const rel of ['index.html', 'game.js', 'style.css']) {
  fs.copyFileSync(path.join(gameRoot, rel), path.join(stageRoot, rel));
}

let total = 0;
const stack = [stageRoot];
while (stack.length) {
  const current = stack.pop();
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) stack.push(full);
    else total += fs.statSync(full).size;
  }
}

console.log(`Stage: ${stageRoot}`);
console.log(`Copied: ${copied} assets. Missing referenced files: ${missing.length}`);
for (const rel of missing) console.log(`MISSING: ${rel}`);
console.log(`Stage size: ${(total / 1024 / 1024).toFixed(1)} MB`);
if (missing.length) process.exitCode = 1;
