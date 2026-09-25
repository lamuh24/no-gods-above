const assert = require('node:assert/strict');
const { createMatch, tick } = require('../dist/core/engine');
const { STOCK_RULES, ROUNDS_RULES } = require('../dist/versus/matchRules');
const { StockDirector } = require('../dist/versus/stockDirector');
const { onlineSnapshot, normalizeRoomCode } = require('../dist/versus/onlineRoom');
const { calculateFallenCapitalCamera } = require('../dist/stage/fallenCapital/camera');

function walkBeyondEdge(rules) {
  const state = createMatch(17, { versusRules: rules });
  state.fighters.p1.x = rules.openPlatform ? rules.openPlatform.right - 1 : 299;
  for (let i = 0; i < 200; i++) tick(state, { p1: { right: true } });
  return state;
}

const open = walkBeyondEdge(STOCK_RULES);
assert.equal(open.fighters.p1.knockedOut, true, 'stock fighter falls and crosses blast line');
assert.equal(open.fighters.p1.health, 0);
assert(open.fighters.p1.y >= STOCK_RULES.openPlatform.blastY || Math.abs(open.fighters.p1.x) >= STOCK_RULES.openPlatform.blastX);

const enclosed = walkBeyondEdge(ROUNDS_RULES);
assert.equal(enclosed.fighters.p1.knockedOut, undefined, 'rounds remain enclosed');
assert.equal(enclosed.fighters.p1.y, 0);
assert(enclosed.fighters.p1.x <= enclosed.stage.right);

const belowLedge = createMatch(23, { versusRules: STOCK_RULES });
belowLedge.fighters.p1.x = STOCK_RULES.openPlatform.right + 1;
belowLedge.fighters.p1.y = 15;
belowLedge.fighters.p1.vx = -2;
belowLedge.fighters.p1.vy = 1;
belowLedge.fighters.p1.grounded = false;
belowLedge.fighters.p1.phase = 'jump';
tick(belowLedge, { p1: { left: true } });
assert(belowLedge.fighters.p1.x < STOCK_RULES.openPlatform.right, 'fighter can cross beneath ledge horizontally');
assert(belowLedge.fighters.p1.y > 0 && !belowLedge.fighters.p1.grounded, 'returning under the ledge cannot teleport to floor');

const raised = STOCK_RULES.openPlatform.upperPlatforms;
assert.equal(STOCK_RULES.openPlatform.right - STOCK_RULES.openPlatform.left, 1800, 'stock uses the complete 36-unit Fallen Capital slab');
assert.equal(open.stage.right, STOCK_RULES.openPlatform.right, 'combat bounds reach the visible stock ledge');
assert.equal(enclosed.stage.right, 420, 'rounds retain their original wall bounds');
const centerStockCamera = calculateFallenCapitalCamera(createMatch(18, { versusRules: STOCK_RULES }));
const centerRoundsCamera = calculateFallenCapitalCamera(createMatch(18, { versusRules: ROUNDS_RULES }));
assert.equal(centerStockCamera.distance, centerRoundsCamera.distance, 'stock retains the regular 1v1 camera scale at center');
const edgeCameraState = createMatch(19, { versusRules: STOCK_RULES });
edgeCameraState.fighters.p1.x = 865; edgeCameraState.fighters.p2.x = 825;
assert(calculateFallenCapitalCamera(edgeCameraState).targetX > 13, 'camera follows fighters to the right drop-off');
assert.equal(raised.length, 3, 'three upper landings');
const landing = createMatch(31, { versusRules: STOCK_RULES });
landing.fighters.p1.x = -240; landing.fighters.p1.y = -115;
landing.fighters.p1.vy = 2; landing.fighters.p1.grounded = false; landing.fighters.p1.phase = 'jump';
for (let i = 0; i < 25; i++) tick(landing, {});
assert.equal(landing.fighters.p1.grounded, true, 'fighter lands on the upper platform');
assert.equal(landing.fighters.p1.y, raised[0].y);
tick(landing, { p1: { up: true } });
assert(landing.fighters.p1.y < raised[0].y || landing.fighters.p1.phase === 'jump_startup', 'fighter can jump from an upper platform');
const walkOffUpper = createMatch(33, { versusRules: STOCK_RULES });
walkOffUpper.fighters.p1.x = raised[0].right - 1;
walkOffUpper.fighters.p1.y = raised[0].y;
walkOffUpper.fighters.p1.grounded = true;
for (let i = 0; i < 20; i++) tick(walkOffUpper, { p1: { right: true } });
assert(walkOffUpper.fighters.p1.x > raised[0].right && walkOffUpper.fighters.p1.y > raised[0].y, 'fighter walks off raised landing and falls');
const jumpThrough = createMatch(32, { versusRules: STOCK_RULES });
jumpThrough.fighters.p1.x = -240; jumpThrough.fighters.p1.y = -45;
jumpThrough.fighters.p1.vy = -12; jumpThrough.fighters.p1.grounded = false; jumpThrough.fighters.p1.phase = 'jump';
for (let i = 0; i < 4; i++) tick(jumpThrough, {});
assert(jumpThrough.fighters.p1.y < raised[0].y && !jumpThrough.fighters.p1.grounded, 'fighter passes upward through platform');
for (let i = 0; i < 35; i++) tick(jumpThrough, {});
assert.equal(jumpThrough.fighters.p1.y, raised[0].y, 'fighter lands when descending');

const director = new StockDirector(2, { p1: 'LAMUH', p2: 'SWAHILI' });
for (let i = 0; i < 70; i++) director.afterTick(createMatch(1, { versusRules: STOCK_RULES }));
assert.equal(director.phase, 'fight');
director.afterTick(open);
assert.equal(director.lives.p1, 1);
for (let i = 0; i < 85; i++) director.afterTick(open);
assert.deepEqual(director.takeRespawns(), ['p1']);
assert.equal(director.phase, 'intro');
for (let i = 0; i < 70; i++) director.afterTick(enclosed);
director.afterTick(open);
assert.equal(director.lives.p1, 0);
for (let i = 0; i < 85; i++) director.afterTick(open);
assert.equal(director.phase, 'match_end');
assert.equal(director.matchWinner, 'p2');

open.inputLog.push({}); open.checksums.push('x'); open.debugWarnings.push('x');
const snapshot = onlineSnapshot(open);
assert.equal(snapshot.fighters.p1.x, open.fighters.p1.x);
assert.equal(snapshot.inputLog.length, 0);
assert.equal(snapshot.checksums.length, 0);
assert.equal(normalizeRoomCode('ab-cd2!'), 'ABCD2');
console.log('stock mode and online packet contract passed');
