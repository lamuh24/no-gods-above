#!/usr/bin/env node
// Apply only Swahili's playable super to the last verified full-stage public package.
// The shared source tree has independent, unfinished work and is not a release input.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const source = path.resolve(process.argv[2] || '');
const target = path.resolve(process.argv[3] || '');
assert(process.argv[2] && process.argv[3], 'Usage: node patch_swahili_super_release.js <verified-fullstage-package> <new-package>');
assert(fs.existsSync(source), 'Verified source package missing');
assert(!fs.existsSync(target), 'Target package already exists');

const oldBundle = 'playtest-index-fullstage-9db3e56ac47a.js';
let bundle = fs.readFileSync(path.join(source, 'assets', oldBundle), 'utf8');
const patch = (from, to, label) => {
  const first = bundle.indexOf(from);
  assert(first >= 0 && bundle.indexOf(from, first + 1) < 0, `${label}: expected one exact match`);
  bundle = bundle.replace(from, to);
};

patch('ot=[`swahili_paid_seal`,`special_neutral_light`',
  'ot=[`swahili_paid_seal`,`swahili_paid_super`,`special_neutral_light`', 'Swahili move ID');
patch('st={swahili_paid_seal:{id:`swahili_paid_seal`,command:`Ultimate starter test`,startup:18,active:1,recovery:29,groundOnly:!0,hitboxes:[],projectile:{releaseTick:18,spawnOffset:{x:38,y:-105},releaseSweepStartX:30,speed:9,gravity:0,maxTravel:310,lifeTicks:36,hitbox:it(`paid_contract_confirm`,0,{x:-16,y:-20,w:32,h:40},0,{hitstop:8,hitstun:32,blockstun:16,knockbackX:0,knockbackY:0,juggleCost:0})}},special_neutral_light:',
  'st={swahili_paid_seal:{id:`swahili_paid_seal`,command:`Ultimate starter test`,startup:18,active:1,recovery:29,groundOnly:!0,hitboxes:[],projectile:{releaseTick:18,spawnOffset:{x:38,y:-105},releaseSweepStartX:30,speed:9,gravity:0,maxTravel:310,lifeTicks:36,hitbox:it(`paid_contract_confirm`,0,{x:-16,y:-20,w:32,h:40},0,{hitstop:8,hitstun:32,blockstun:16,knockbackX:0,knockbackY:0,juggleCost:0})}},swahili_paid_super:{id:`swahili_paid_super`,command:`P · Paid in Full`,startup:18,active:1,recovery:29,groundOnly:!0,hitboxes:[],projectile:{releaseTick:18,spawnOffset:{x:38,y:-105},releaseSweepStartX:30,speed:9,gravity:0,maxTravel:310,lifeTicks:36,hitbox:it(`paid_contract_collection`,0,{x:-16,y:-20,w:32,h:40},180,{hitstop:12,hitstun:0,blockstun:18,knockbackX:8,knockbackY:0,juggleCost:0,knockdown:`hard`})}},special_neutral_light:',
  'playable super definition');
patch('t===`swahili_paid_seal`&&(!e.paidSealStarterTest||e.kind!==`lamuh_proto`)||t===`legacy_crown_of_no_gods`',
  't===`swahili_paid_seal`&&(!e.paidSealStarterTest||e.kind!==`lamuh_proto`)||t===`swahili_paid_super`&&(e.kind!==`lamuh_proto`||!e.swahiliAirSpecialsV1||e.tension<H(e.kind).combat.maxTension||!e.grounded)||t===`legacy_crown_of_no_gods`',
  'super resource and ground gate');
patch('if(t===`legacy_crown_of_no_gods`){let t=H(e.kind).combat.maxTension;e.tension-=t,e.tensionSpent+=t}if(e.kind===`celeste_proto`)',
  'if(t===`legacy_crown_of_no_gods`){let t=H(e.kind).combat.maxTension;e.tension-=t,e.tensionSpent+=t}if(t===`swahili_paid_super`){let t=H(e.kind).combat.maxTension;e.tension-=t,e.tensionSpent+=t}if(e.kind===`celeste_proto`)',
  'spend super resource');
patch('return`swahili_paid_seal`;let n=6+t;',
  'return`swahili_paid_seal`;if(e.kind===`lamuh_proto`&&e.swahiliAirSpecialsV1&&de(e.deterministicBuffer,`ultimate`,1+t))return`swahili_paid_super`;let n=6+t;',
  'P input route');
patch('FS={swahili_paid_seal:{...G(ix,4),frameStarts:[0,4,8,12,15,18,22,26,30,35,40,45]},special_neutral_light:',
  'FS={swahili_paid_seal:{...G(ix,4),frameStarts:[0,4,8,12,15,18,22,26,30,35,40,45]},swahili_paid_super:{...G(ix,4),frameStarts:[0,4,8,12,15,18,22,26,30,35,40,45]},special_neutral_light:',
  'approved cast clip reuse');
patch('if(t.attackId===`swahili_paid_seal`){if(this.paidToken)',
  'if(t.attackId===`swahili_paid_seal`||t.attackId===`swahili_paid_super`){if(this.paidToken)',
  'contract token rendering');
patch('{command:`I  /  ← + I`,name:`Forward / back throw`,animated:!1}]}coverage()',
  '{command:`P · 100% SUPER`,name:`Paid in Full · contract collection`,animated:e(`swahili_paid_super`)},{command:`I  /  ← + I`,name:`Forward / back throw`,animated:!1}]}coverage()',
  'Swahili move list');

for (const htmlName of ['index.html', 'versus-playtest.html']) {
  assert(fs.readFileSync(path.join(source, htmlName), 'utf8').includes(oldBundle), `${htmlName}: wrong source build`);
}
fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: true });
const digest = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 12);
const newBundle = `playtest-index-paid-super-${digest}.js`;
fs.writeFileSync(path.join(target, 'assets', newBundle), bundle);
for (const htmlName of ['index.html', 'versus-playtest.html']) {
  const file = path.join(target, htmlName);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(oldBundle, newBundle));
}
console.log(JSON.stringify({ source, target, oldBundle, newBundle, digest, patchCount: 8 }));
