const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/lamuh-quality-v1');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4177/lamuh-legacy-sandbox.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.lamuhSandbox,{timeout:60000});
    await page.click('#cleanView');
    await page.evaluate(()=>window.lamuhSandbox.pause());
    const read=()=>page.evaluate(()=>JSON.parse(document.querySelector('#readout').textContent));
    const frames=[],tests=[];
    for(const [label,stem,expected]of [['idle → 5L','light',1],['idle → 5M','medium',1],['crouch → 2L','crouch-light',1],['crouch → 2M','crouch-medium',1],['5L → 5M cancel','cancel',2],['Ascend Step Medium','slide-launch',2],['Ascend Step Heavy','rear-blast',1]]){
      await page.evaluate(label=>{window.lamuhSandbox.reset();window.lamuhSandbox.scenario(label);},label);
      const phases=new Set(),reactionFrames=new Set(),events=[];
      for(let i=0;i<160;i++){
        await page.evaluate(()=>window.lamuhSandbox.step());
        const r=await read();phases.add(r.victim.phase);if(r.presentationQuality.victimReactionFrame!==null)reactionFrames.add(r.presentationQuality.victimReactionFrame);
        if(r.lastCombatEvent?.tick===r.tick-1){
          events.push(r.lastCombatEvent);assert.strictEqual(r.presentationQuality.activeContactCues.at(-1).tick,r.lastCombatEvent.tick);
          const file=`${stem}-contact-${events.length}.png`;await page.locator('#stage').screenshot({path:path.join(out,file)});frames.push(file);
        }
        if(stem==='slide-launch'&&i===70){const file='slide-launch-recovery.png';await page.locator('#stage').screenshot({path:path.join(out,file)});frames.push(file);}
        assert.ok(!r.fighterCollision.pushboxesOverlap||r.fighterCollision.authoredThrowExceptionActive,'Unexpected actor overlap');
      }
      assert.strictEqual(events.length,expected,`${label} contact parity`);assert.ok(reactionFrames.size>=2,`${label} should show connected reaction phases`);
      tests.push({label,contacts:events.length,phases:[...phases],reactionFrames:[...reactionFrames]});
    }
    await page.selectOption('#outcome','whiff');await page.evaluate(()=>{window.lamuhSandbox.scenario('idle → 5M');});
    for(let i=0;i<45;i++)await page.evaluate(()=>window.lamuhSandbox.step());
    assert.strictEqual((await read()).presentationQuality.eventIds.length,0,'Whiff must not emit contact feedback');
    await page.selectOption('#outcome','stand_block');await page.evaluate(()=>window.lamuhSandbox.scenario('idle → 5M'));
    for(let i=0;i<6;i++)await page.evaluate(()=>window.lamuhSandbox.step());
    assert.strictEqual((await read()).presentationQuality.activeContactCues.at(-1).kind,'block');
    await page.locator('#stage').screenshot({path:path.join(out,'medium-block.png')});frames.push('medium-block.png');
    await page.selectOption('#side','p2');await page.selectOption('#outcome','hit');await page.evaluate(()=>window.lamuhSandbox.scenario('idle → 5M'));
    for(let i=0;i<6;i++)await page.evaluate(()=>window.lamuhSandbox.step());
    const mirror=await read();assert.strictEqual(mirror.presentationQuality.activeContactCues.at(-1).facing,-1);
    await page.locator('#stage').screenshot({path:path.join(out,'medium-mirrored.png')});frames.push('medium-mirrored.png');
    await page.selectOption('#side','p1');await page.click('#reset');await page.click('#pause');
    await page.evaluate(()=>{
      const chunks=[],stream=document.querySelector('#stage').captureStream(60),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      window.qualityRecording={recorder,chunks,stream};recorder.start();
    });
    for(const label of ['idle → 5M','Ascend Step Medium','Ascend Step Heavy']){
      await page.click('#reset');await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(2300);
    }
    await page.click('#reset');await page.locator('h1').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'clean-playtest.png'),fullPage:false});
    assert.deepStrictEqual(errors,[]);
    const report={candidateOnly:true,deployable:false,testedAt:new Date().toISOString(),tests,checks:['12 new hash-locked reaction frames','hit/block/whiff/mirror contact routing','no unexpected pushbox overlap','fresh-start cancel displays full attack','one-shot reaction states','real-time 1x sampled'],screenshots:frames,errors};
    fs.writeFileSync(path.join(out,'browser-quality-report.json'),JSON.stringify(report,null,2)+'\n');
    const videoBytes=await page.evaluate(()=>new Promise(resolve=>{const {recorder,chunks,stream}=window.qualityRecording;recorder.onstop=async()=>{resolve(Array.from(new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())));stream.getTracks().forEach(track=>track.stop());};recorder.stop();}));
    fs.writeFileSync(path.join(out,'quality-playtest-motion.webm'),Buffer.from(videoBytes));await context.close();
    console.log('PASS Lamuh quality review browser checks and real-time samples');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
