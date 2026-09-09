const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const out=path.resolve(__dirname,'../artifacts/lamuh-celestial-palm-v1');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],cases=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4177/lamuh-legacy-sandbox.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.lamuhSandbox,{timeout:60000});await page.click('#cleanView');await page.evaluate(()=>window.lamuhSandbox.pause());
  for(const side of ['p1','p2'])for(const [strength,release,damage] of [['Light',9,34],['Medium',14,48],['Heavy',21,68]])for(const outcome of ['hit','stand_block']){
   await page.evaluate(({side,outcome,strength})=>{const s=window.lamuhSandbox;s.selectSide(side);s.selectOutcome(outcome);s.scenario('Celestial Palm '+strength);},{side,outcome,strength});
   let spawn,flight,contact;
   for(let i=0;i<100;i++){
    await page.evaluate(()=>window.lamuhSandbox.step());
    const state=await page.evaluate(()=>window.lamuhSandbox.getState());
    if(state.lastProjectileEvent?.type==='spawn'&&!spawn){spawn=state;await page.locator('#stage').screenshot({path:path.join(out,`${side}-${strength}-${outcome}-release.png`)});}
    if(state.projectiles?.[0]?.ageTicks===6){flight=state;await page.locator('#stage').screenshot({path:path.join(out,`${side}-${strength}-${outcome}-flight.png`)});}
    if(['hit','block'].includes(state.lastProjectileEvent?.type)&&!contact){contact=state;await page.locator('#stage').screenshot({path:path.join(out,`${side}-${strength}-${outcome}-contact.png`)});}
   }
   const state=await page.evaluate(()=>window.lamuhSandbox.getState()),victim=state.fighters[side==='p1'?'p2':'p1'];
   assert(spawn&&flight&&contact,`${side} ${strength} ${outcome} missing visible projectile phase`);
   assert.strictEqual(spawn.fighters[side].phaseTick,release);assert.strictEqual(state.projectileSpawnLedger.length,1);assert.strictEqual(state.projectiles.length,0);
   assert.strictEqual(victim.hitCountTaken,outcome==='hit'?1:0);assert.strictEqual(victim.health,1000-(outcome==='hit'?damage:0));
   cases.push({side,strength,outcome,release,damage:1000-victim.health,oneSpawn:true,oneContact:true});
  }
  await page.goto('http://127.0.0.1:4177/lamuh-v1-v2-review.html',{waitUntil:'domcontentloaded'});await page.waitForSelector('#move');await page.waitForFunction(()=>document.querySelector('#move').value==='attack:celestial_palm_medium');
  await page.screenshot({path:path.join(out,'comparison-neutral-default.png'),fullPage:true});
  assert((await page.locator('body').innerText()).includes('STARRED')||(await page.locator('body').innerText()).includes('marked for polish'));
  await page.goto('http://127.0.0.1:4177/lamuh-legacy-sandbox.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.lamuhSandbox);await page.click('#cleanView');
  await page.evaluate(()=>{const stream=document.querySelector('#stage').captureStream(60),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};window.palmRecording={stream,chunks,recorder};recorder.start();});
  for(const name of ['Light','Medium','Heavy']){await page.getByRole('button',{name:'Celestial Palm '+name,exact:true}).click();await page.waitForTimeout(1800);}
  const bytes=await page.evaluate(()=>new Promise(resolve=>{const r=window.palmRecording;r.recorder.onstop=async()=>{resolve(Array.from(new Uint8Array(await new Blob(r.chunks,{type:'video/webm'}).arrayBuffer())));r.stream.getTracks().forEach(t=>t.stop());};r.recorder.stop();}));fs.writeFileSync(path.join(out,'neutral-family-1x.webm'),Buffer.from(bytes));
  assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({candidateOnly:true,deployable:false,cases,errors,realTimeMotion:'neutral-family-1x.webm'},null,2)+'\n');console.log('PASS 12 browser projectile cases, neutral comparison default, native 1x recording, no browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
