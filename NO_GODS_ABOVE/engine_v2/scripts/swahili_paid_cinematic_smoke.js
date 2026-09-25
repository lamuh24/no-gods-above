const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const origin=process.argv[2]||'http://127.0.0.1:4195';
const shots=process.argv[3]||path.join(process.env.TEMP,'nga-paid-cinematic-qa');
fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 try {
 for(const [side,lethal] of [['p1',false],['p2',true]]) {
  const query=side==='p1'?'character=swahili&p2char=lamuh':'character=lamuh&p2char=swahili';
  await page.goto(`${origin}/versus-playtest.html?${query}&mode=stocks&autostart=1&p2=human`);
  await page.waitForFunction(()=>window.__versus?.arena?.stageLoaded===true,null,{timeout:180000});
  await page.evaluate(({side,lethal})=>{
   const v=window.__versus;v.pause(false);
   for(let i=0;i<180&&v.stockDirector.inputsLocked;i++)v.step();
   for(const id of ['p1','p2'])Object.assign(v.state.fighters[id],{x:id==='p1'?-100:100,y:0,vx:0,vy:0,facing:id==='p1'?1:-1,grounded:true,phase:'idle',currentAttack:null,tension:100,health:id!==side&&lethal?100:1000});
   window.__paidPhases=[];window.__paidComplete=false;
   window.addEventListener('message',e=>{if(e.data?.type==='swahili-paid-review-complete')window.__paidComplete=true;});
   window.__paidPoll=setInterval(()=>{const f=document.querySelector('iframe[title="Paid in Full ultimate"]');const d=f?.contentWindow?.paidWorldFrame;if(d&&!window.__paidPhases.includes(d.phase))window.__paidPhases.push(d.phase);},20);
  },{side,lethal});
  const key=side==='p1'?'p':'Numpad0';await page.keyboard.down(key);await page.evaluate(()=>window.__versus.step());await page.keyboard.up(key);
  const before=await page.evaluate(()=>{for(let i=0;i<55&&!document.querySelector('iframe[title="Paid in Full ultimate"]');i++)window.__versus.step();return {tick:window.__versus.state.tick,lives:{...window.__versus.stockDirector.lives}};});
  await page.waitForSelector('iframe[title="Paid in Full ultimate"]',{state:'attached'});
  await page.evaluate(()=>window.__versus.pause(true));
  assert.equal(await page.locator('#paidRehearsal').count(),0);
  assert.equal(await page.locator('input[aria-label="Cinematic frame scrub (pauses playback)"]').count(),0);
  await page.keyboard.press('Escape');
  for(const phase of [1,2,3,5]) {
   await page.waitForFunction(p=>document.querySelector('iframe[title="Paid in Full ultimate"]')?.contentWindow?.paidWorldFrame?.phase===p,phase,{timeout:25000});
   await page.screenshot({path:path.join(shots,`${side}-phase-${phase}.png`)});
   const held=await page.evaluate(()=>{window.__versus.step();return {tick:window.__versus.state.tick,lives:{...window.__versus.stockDirector.lives}};});
   assert.deepEqual(held,before,'simulation and stocks held through all shots');
   if(phase===5)await page.evaluate(()=>window.__versus.pause(false));
  }
  await page.waitForFunction(()=>window.__paidComplete,null,{timeout:15000});
  await page.waitForSelector('iframe[title="Paid in Full ultimate"]',{state:'detached'});
  const result=await page.evaluate(({side})=>{clearInterval(window.__paidPoll);const v=window.__versus;const health=v.state.fighters[side==='p1'?'p2':'p1'].health;v.step();return {tick:v.state.tick,health,phases:window.__paidPhases,lives:{...v.stockDirector.lives}};},{side});
  for(const p of [-1,0,1,2,3,4,5])assert(result.phases.includes(p),`missing phase ${p}`);
  assert.equal(result.tick,before.tick+1,'simulation resumes');
  assert.equal(result.health,lethal?0:820,'one damage transaction');
  if(lethal)assert.equal(result.lives.p1,before.lives.p1-1,'stock loss occurs after ending');
  console.log(JSON.stringify({side,lethal,...result}));
 }
 assert.deepEqual(errors,[]);console.log('PASS complete cinematic, both owners/facings, lethal stock timing, assets');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
