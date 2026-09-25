// Read the exact frame lists used by the versus presenter, without a browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const engine = path.resolve(__dirname, '..');
const repo = path.resolve(engine, '../..');
function evaluate(source, filename, bindings = {}) {
  const exports = {};
  let js = stripTypeScriptTypes(source);
  const names = [...js.matchAll(/export (?:const|function) (\w+)/g)].map((m) => m[1]);
  js = js.replace(/^import (\w+) from ["']([^"']+)["'];/gm, 'const $1 = require("$2");')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
    .replace(/export \{ ([^}]+) \};/g, 'Object.assign(exports, { $1 });');
  js += `\nObject.assign(exports, { ${names.join(', ')} });`;
  vm.runInNewContext(js, { exports, ...bindings, require: (url) => {
    if (url.endsWith('?url')) return path.resolve(path.dirname(filename), url.slice(0, -4));
    throw new Error(`Unexpected dependency ${url}`);
  } }, { filename });
  return exports;
}
function inventory() {
  const sandboxFile = path.join(engine, 'src/sandbox/swahiliSandboxSpriteSources.ts');
  const stageFile = path.join(engine, 'src/stage/spriteSources.ts');
  const sandbox = evaluate(fs.readFileSync(sandboxFile, 'utf8'), sandboxFile).swahiliSandboxSpriteSources;
  const stage = evaluate(fs.readFileSync(stageFile, 'utf8'), stageFile).swahiliStageSpriteSources;
  const filename = path.join(engine, 'src/versus/presentation.ts');
  const text = fs.readFileSync(filename, 'utf8');
  const newFramesFile = path.join(engine, 'src/versus/swahiliNewSpecialFrames.ts');
  const newFrames = evaluate(fs.readFileSync(newFramesFile, 'utf8'), newFramesFile);
  const direct = [...text.matchAll(/^import (air\w+) from "([^"]+\?url)";/gm)].map((m) => m[0]).join('\n');
  const block = text.slice(text.indexOf('type PoseKey ='), text.indexOf('class SwahiliPresenter'));
  const clips = evaluate(`${direct}\n${block}\nexport { SWAHILI_ATTACK_CLIPS, SWAHILI_MOVEMENT_CLIPS };`, filename,
    { swahiliSandboxSpriteSources: sandbox, swahiliStageSpriteSources: stage, newSpecialFrames: newFrames.newSpecialFrames });
  const groups = { ...clips.SWAHILI_ATTACK_CLIPS, ...clips.SWAHILI_MOVEMENT_CLIPS };
  const singlePoseBlock = text.slice(text.indexOf('for (const key of [', text.indexOf('class SwahiliPresenter')), text.indexOf('return out;', text.indexOf('class SwahiliPresenter')));
  for (const [, key] of singlePoseBlock.matchAll(/"([a-z0-9_]+)"/g)) groups[key] = { urls: [sandbox[key].url], ticksPerFrame: 1, loop: false };
  const relative = (p) => path.relative(repo, p).replaceAll('\\', '/');
  const oldOverrides = JSON.parse(fs.readFileSync(path.join(engine, 'src/versus/swahiliSpriteScale.json'), 'utf8')).clipOverrides;
  return { repo, engine, groups: Object.fromEntries(Object.entries(groups).map(([key, c]) => [key, {
    ...c, urls: c.urls.map(relative),
    // Mirrors preload: the normalized new clip geometry wins over the historical
    // Down Light override. Do not apply the old 0.81 correction to Kneecap Notice.
    geometry: c.urls.some(url => url.includes('new-specials-runtime-v1'))
      ? { ...newFrames.NEW_SPECIAL_GEOMETRY, bodyScale: newFrames.NEW_SPECIAL_BODY_SCALES[key] } : oldOverrides[key]
  }])) };
}
module.exports = { inventory };
if (require.main === module) process.stdout.write(JSON.stringify(inventory()));
