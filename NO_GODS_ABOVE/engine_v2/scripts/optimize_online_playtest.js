const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const stage = path.resolve(__dirname, '..', 'playtest_public');
const roots = ['assets', 'lamuh-legacy-v2', 'celeste'];
// The select screen and HUD request this public URL directly. Runtime manifests
// may use its WebP copy, but the original URL must remain available too.
const fixedUiPngs = new Set([path.join(stage, 'lamuh-legacy-v2', 'movement-v2', 'idle-00.png')]);
const pngs = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.isFile() && file.toLowerCase().endsWith('.png')) pngs.push(file);
  }
}
for (const root of roots) visit(path.join(stage, root));

function encode(file) {
  return new Promise((resolve, reject) => {
    const output = file.slice(0, -4) + '.webp';
    const preserveKey = file.startsWith(path.join(stage, 'celeste') + path.sep);
    const args = ['-loglevel', 'error', '-y', '-i', file, '-frames:v', '1', '-c:v', 'libwebp',
      ...(preserveKey ? ['-lossless', '1'] : ['-q:v', '98']), '-compression_level', '3', output];
    execFile('ffmpeg', args, { windowsHide: true }, (error, _stdout, stderr) => {
      if (error || !fs.existsSync(output) || fs.statSync(output).size === 0) {
        reject(new Error(`WebP conversion failed for ${file}: ${stderr || error}`));
      } else resolve({ original: fs.statSync(file).size, encoded: fs.statSync(output).size });
    });
  });
}

async function main() {
  let next = 0, completed = 0, originalBytes = 0, optimizedBytes = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < pngs.length) {
      const file = pngs[next++];
      const result = await encode(file);
      originalBytes += result.original;
      optimizedBytes += result.encoded;
      completed++;
      if (completed % 100 === 0) console.log(`Optimized ${completed}/${pngs.length} images`);
    }
  }));

  // Vite's bundled URL strings point at hashed image names. Stage and menu art
  // keep their original PNG files and are deliberately outside this rewrite.
  let bundleReferences = 0;
  for (const entry of fs.readdirSync(path.join(stage, 'assets'))) {
    if (!/\.(js|css)$/.test(entry)) continue;
    const file = path.join(stage, 'assets', entry);
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(/playtest-[A-Za-z0-9_.-]+\.png/g, match => {
      if (!fs.existsSync(path.join(stage, 'assets', match.slice(0, -4) + '.webp'))) return match;
      bundleReferences++;
      return match.slice(0, -4) + '.webp';
    });
    if (after !== before) fs.writeFileSync(file, after);
  }

  function rewriteJson(file, transform) {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    let references = 0;
    function walk(current) {
      if (typeof current === 'string') {
        const changed = transform(current);
        if (changed !== current) references++;
        return changed;
      }
      if (Array.isArray(current)) return current.map(walk);
      if (current && typeof current === 'object') {
        for (const key of Object.keys(current)) current[key] = walk(current[key]);
      }
      return current;
    }
    walk(value);
    if (references) fs.writeFileSync(file, JSON.stringify(value));
    return references;
  }
  let lamuhReferences = 0;
  function visitJson(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visitJson(file);
      else if (entry.isFile() && entry.name.endsWith('.json')) {
        lamuhReferences += rewriteJson(file, value => {
          if (!value.startsWith('/lamuh-legacy-v2/') || !value.endsWith('.png')) return value;
          const webp = value.slice(0, -4) + '.webp';
          // Some manifest metadata names review-only art excluded from this
          // release. Keep those strings untouched; active frame paths are staged.
          if (!fs.existsSync(path.join(stage, webp.slice(1)))) return value;
          return webp;
        });
      }
    }
  }
  visitJson(path.join(stage, 'lamuh-legacy-v2'));
  const celesteReferences = rewriteJson(path.join(stage, 'celeste', 'import.json'), value => {
    if (!value.endsWith('.png') || !fs.existsSync(path.join(stage, 'celeste', value.slice(0, -4) + '.webp'))) return value;
    return value.slice(0, -4) + '.webp';
  });

  if (!bundleReferences || !lamuhReferences || !celesteReferences) {
    throw new Error(`Incomplete URL rewrite: bundle=${bundleReferences}, Lamuh=${lamuhReferences}, Celeste=${celesteReferences}`);
  }
  for (const file of pngs) if (!fixedUiPngs.has(file)) fs.unlinkSync(file);
  for (const file of fixedUiPngs) if (!fs.existsSync(file)) throw new Error(`Missing fixed UI image: ${file}`);
  const saved = Math.round((originalBytes - optimizedBytes) / 1048576 * 10) / 10;
  console.log(JSON.stringify({ images: pngs.length, bundleReferences, lamuhReferences, celesteReferences, megabytesSaved: saved }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
