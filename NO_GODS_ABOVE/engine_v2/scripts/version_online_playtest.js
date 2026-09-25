const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const stage = path.resolve(__dirname, '..', 'playtest_public');
const assets = path.join(stage, 'assets');
const pages = ['index.html', 'versus-playtest.html'].map(name => path.join(stage, name));
const entries = fs.readdirSync(assets).filter(name => /^playtest-index-.+\.js$/.test(name) && !name.includes('-optimized-'));
if (entries.length !== 1) throw new Error(`Expected one unversioned playtest bundle, found ${entries.length}`);
const original = entries[0];
const bytes = fs.readFileSync(path.join(assets, original));
if (!bytes.includes(Buffer.from('.webp'))) throw new Error('Bundle has not been optimized yet');
const digest = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const versioned = original.replace(/\.js$/, `-optimized-${digest}.js`);
fs.renameSync(path.join(assets, original), path.join(assets, versioned));
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  if (!html.includes(original)) throw new Error(`Missing bundle reference in ${page}`);
  fs.writeFileSync(page, html.replaceAll(original, versioned));
}
console.log(JSON.stringify({ bundle: versioned, digest }));
