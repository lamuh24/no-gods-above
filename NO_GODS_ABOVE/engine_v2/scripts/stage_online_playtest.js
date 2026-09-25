const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const built = path.join(root, 'playtest_dist');
const publicRoot = path.join(root, 'public');
const stage = path.join(root, 'playtest_public');

if (stage !== path.join(root, 'playtest_public') || !stage.startsWith(root + path.sep)) {
  throw new Error('Refusing to replace a stage outside Engine V2');
}
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

function copyFile(source, destination) {
  if (!fs.existsSync(source)) throw new Error(`Missing release asset: ${source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
function copyTree(source, destination) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) copyFile(from, to);
  }
}

copyFile(path.join(built, 'versus-playtest.html'), path.join(stage, 'index.html'));
copyFile(path.join(built, 'versus-playtest.html'), path.join(stage, 'versus-playtest.html'));
copyTree(path.join(built, 'assets'), path.join(stage, 'assets'));
for (const dir of ['celeste', 'stages', 'ui', 'swahili-paid-review']) {
  copyTree(path.join(publicRoot, dir), path.join(stage, dir));
}

const lamuhRoot = path.join(publicRoot, 'lamuh-legacy-v2');
const reviewData = JSON.parse(fs.readFileSync(path.join(lamuhRoot, 'review-data.json'), 'utf8'));
const closureKeys = [
  'standingLightClosure', 'standingMediumClosure', 'standingHeavyClosure',
  'crouchingLightClosure', 'crouchingMediumClosure', 'crouchingHeavyClosure',
  'airLightClosure', 'airMediumClosure', 'airHeavyClosure'
];
const familyKeys = ['celestialPalmFamily', 'heavenSplitterFamily', 'radiantDiveFamily', 'ascendStepFamily'];
const runtimeClosure = value => ({
  v2: { frames: value?.v2?.frames ?? [] },
  timingCandidates: { B: { exposureTicks: value?.timingCandidates?.B?.exposureTicks } }
});
const runtimeReviewData = {
  movementModernization: { states: Object.fromEntries(Object.entries(reviewData.movementModernization.states)
    .map(([key, state]) => [key, { frames: state.frames, exposureTicks: state.exposureTicks }])) },
  throwAnimations: { sequences: reviewData.throwAnimations.sequences }
};
for (const key of closureKeys) runtimeReviewData[key] = runtimeClosure(reviewData[key]);
for (const key of familyKeys) runtimeReviewData[key] = {
  variants: Object.fromEntries(Object.entries(reviewData[key]?.variants ?? {})
    .map(([name, value]) => [name, runtimeClosure(value)]))
};
const manifestPaths = [
  'forward-clean-v1/manifest.json',
  'down-specials-v1/manifest.json',
  'divine-vanish-v1/manifest.json',
  'divine-vanish-medium-v4/manifest.json',
  'counter-launch-v4/manifest.json',
  'heavy-chain-v1/manifest.json',
  'reactions-quality-v1/manifest.json',
  'ultimate-v1/manifest.json'
];
const lamuhPaths = new Set(['review-data.json', 'movement-v2/idle-00.png']);
for (const relative of manifestPaths) lamuhPaths.add(relative);

function collectRuntimePaths(value) {
  if (typeof value === 'string') {
    if (/^\/lamuh-legacy-v2\/[^?#]+\.(png|webp|wav|json)$/i.test(value)) {
      lamuhPaths.add(value.slice('/lamuh-legacy-v2/'.length));
    }
    return;
  }
  if (Array.isArray(value)) return value.forEach(collectRuntimePaths);
  if (value && typeof value === 'object') Object.values(value).forEach(collectRuntimePaths);
}

collectRuntimePaths(runtimeReviewData);
for (const relative of manifestPaths) {
  collectRuntimePaths(JSON.parse(fs.readFileSync(path.join(lamuhRoot, relative), 'utf8')));
}

for (const relative of lamuhPaths) {
  const source = path.join(lamuhRoot, relative);
  const destination = path.join(stage, 'lamuh-legacy-v2', relative);
  if (!destination.startsWith(path.join(stage, 'lamuh-legacy-v2') + path.sep)) throw new Error('Invalid Lamuh asset path');
  copyFile(source, destination);
}
fs.writeFileSync(path.join(stage, 'lamuh-legacy-v2', 'review-data.json'), JSON.stringify(runtimeReviewData));
for (const relative of manifestPaths) {
  const file = path.join(stage, 'lamuh-legacy-v2', relative);
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  function removeLocalPaths(value) {
    if (typeof value === 'string') return /^[A-Za-z]:\\/.test(value) ? path.win32.basename(value) : value;
    if (Array.isArray(value)) return value.map(removeLocalPaths);
    if (value && typeof value === 'object') for (const key of Object.keys(value)) value[key] = removeLocalPaths(value[key]);
    return value;
  }
  fs.writeFileSync(file, JSON.stringify(removeLocalPaths(manifest)));
}

const files = [];
function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) inventory(file);
    else if (entry.isFile()) files.push(file);
  }
}
inventory(stage);
const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(JSON.stringify({ stage, files: files.length, lamuhFiles: lamuhPaths.size, megabytes: Math.round(bytes / 1048576 * 10) / 10 }));
