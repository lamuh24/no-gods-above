const assert = require('node:assert/strict');
const { lamuhBodyScale } = require('../dist/lamuhlegacy/bodyScale.js');
const { PreparedFrames } = require('../dist/lamuhlegacy/quality.js');
for (const [strength,count] of [['light',5],['medium',6],['heavy',7]]) for (let i = 0; i < count; i++) {
  const source = `/lamuh-legacy-v2/air-normals-v2/air-${strength}/air-${strength}-0${i}.png`;
  assert.equal(lamuhBodyScale(source), .84);
  assert.equal(lamuhBodyScale(source+'?review=2'), .84);
  const frames = new PreparedFrames();
  frames.images.set(source, {});
  for (const facing of [-1, 1]) {
    const calls = [];
    frames.draw({save(){},restore(){},translate(...v){calls.push(v)},rotate(){},scale(...v){calls.push(v)},drawImage(){}},source,{x:768,y:1360},100,200,facing);
    assert.deepEqual(calls, [[100,200],[facing*.84,.84]], 'Mirror scale must preserve world root');
  }
}
for (const source of ['/lamuh-legacy-v2/movement-v2/idle-00.png', '/lamuh-legacy-v2/air-normals-v2/air-light/air-heavy-00.png', '/swahili/air-heavy-00.png']) assert.equal(lamuhBodyScale(source), 1);
console.log('PASS all air normals: 18 poses, both facings, fixed root, idle and unrelated art unchanged');
const data = require('../public/lamuh-legacy-v2/review-data.json');
for (const family of ['heavenSplitterFamily','radiantDiveFamily']) {
  for (const strength of ['light','medium','heavy']) {
    for (const frame of data[family].variants[strength].v2.frames) {
      for (const source of [frame.publicPath,frame.bodyOnlyPublicPath].filter(Boolean)) {
        const expected = strength === 'heavy' && !source.includes('/movement-v2/') ? .90 : 1;
        assert.equal(lamuhBodyScale(source), expected, source);
      }
    }
  }
}
console.log('PASS Up/Air Heavy specials: active and body-only sources calibrated; shared endpoints and L/M unchanged');
