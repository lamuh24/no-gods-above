const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [source, target] = process.argv.slice(2).map(p => path.resolve(p));
assert(source && target && !fs.existsSync(target), 'Supply existing release and new output directory');
const oldBundle = 'playtest-index-paid-super-615c73f253a2.js';
let bundle = fs.readFileSync(path.join(source, 'assets', oldBundle), 'utf8');
function patch(from, to) {
  assert.equal(bundle.split(from).length, 2, `Expected one seam: ${from}`);
  bundle = bundle.replace(from, to);
}
patch('let fe=aI(n,!S&&u.get(`paid-rehearsal`)===`1`&&(f.p1===`swahili`||f.p2===`swahili`),()=>{ce.clear(),P.p1=[],P.p2=[]});',
 'let fe=ngaPaidAnimation(n,f.p1===`swahili`||f.p2===`swahili`,()=>{ce.clear(),P.p1=[],P.p2=[]},!S&&u.get(`paid-rehearsal`)===`1`);let ngaLastPaidEvent="";function ngaStartPaidSuper(){const event=N.lastProjectileEvent;if(event?.attackId!=="swahili_paid_super"||event.type!=="hit"||event.eventId===ngaLastPaidEvent)return false;ngaLastPaidEvent=event.eventId;fe.start(event.owner,true);return true;}');
patch('N=e.state,j&&e.director&&Object.assign(j,e.director)', 'N=e.state,ngaStartPaidSuper(),j&&e.director&&Object.assign(j,e.director)');
patch('function he(){!j&&!M||(', 'function he(){fe.stop();ngaLastPaidEvent="";!j&&!M||(');
patch('if(fe.active){e.code===`Escape`&&fe.stop()', 'if(fe.active){fe.canCancel&&e.code===`Escape`&&fe.stop()');
patch('e?.tick===N.tick-1&&e.attackId===`swahili_paid_seal`&&e.type===`hit`&&fe.start(e.owner)}catch(e)',
 'e?.tick===N.tick-1&&e.attackId===`swahili_paid_seal`&&e.type===`hit`&&fe.start(e.owner);if(ngaStartPaidSuper()){if(_?.role===`host`)_.send({type:`snapshot`,state:ZF(N),director:null,sequence:N.tick});return}}catch(e)');
patch('c=fe.active?[]:s?[s.defender,s.attacker]', 'c=fe.visible?[]:s?[s.defender,s.attacker]');
const compiled = fs.readFileSync(path.join(__dirname, '../dist/versus/swahiliPaidRehearsal.js'), 'utf8')
 .split('\n').filter(line => !line.startsWith('exports.') && !line.startsWith('Object.defineProperty(exports') && !line.startsWith('//# sourceMappingURL')).join('\n');
assert(!compiled.includes('require('));
bundle = `const ngaPaidAnimation=(()=>{\n${compiled}\nreturn createPaidRehearsal;})();\n${bundle}`;
fs.cpSync(source, target, {recursive:true, errorOnExist:true, force:false});
const hash = crypto.createHash('sha256').update(bundle).digest('hex').slice(0,12);
const newBundle = `playtest-index-paid-cinematic-${hash}.js`;
fs.writeFileSync(path.join(target,'assets',newBundle),bundle);
for (const name of ['index.html','versus-playtest.html']) {
 const file=path.join(target,name); const html=fs.readFileSync(file,'utf8'); assert(html.includes(oldBundle));
 fs.writeFileSync(file,html.replace(oldBundle,newBundle));
}
console.log(JSON.stringify({target,newBundle,hash}));
