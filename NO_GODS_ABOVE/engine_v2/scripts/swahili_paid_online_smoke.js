const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const origin=process.argv[2]||'http://127.0.0.1:4196';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const host=await browser.newPage(),guest=await browser.newPage();const errors=[];
 for(const p of [host,guest])p.on('pageerror',e=>errors.push(e.message));
 await host.goto(`${origin}/versus-playtest.html?screen=modes`);
 await host.locator('#modeOnline').click();await host.locator('#onlineHost').click();
 await host.waitForFunction(()=>document.querySelector('#onlineStatus')?.textContent?.includes('ROOM OPEN'),null,{timeout:45000});
 const code=await host.locator('.online-room-code strong').textContent();
 await guest.goto(`${origin}/versus-playtest.html?online=${code}`);
 for(const p of [host,guest])await p.waitForFunction(()=>document.querySelector('#onlineStatus')?.textContent?.includes('RIVAL CONNECTED'),null,{timeout:45000});
 await host.locator('[data-side="p1"][data-online-pick="swahili"]').click();
 await guest.locator('#onlineReady').click();await host.locator('#onlineStart:not([disabled])').click();
 for(const p of [host,guest])await p.waitForFunction(()=>window.__versus?.arena?.stageLoaded===true,null,{timeout:180000});
 await host.waitForFunction(()=>window.__versus.stockDirector.phase==='fight',null,{timeout:60000});
 await host.evaluate(()=>{const v=window.__versus;v.pause(false);for(const id of ['p1','p2'])Object.assign(v.state.fighters[id],{x:id==='p1'?-100:100,y:0,vx:0,vy:0,facing:id==='p1'?1:-1,grounded:true,phase:'idle',currentAttack:null,tension:100,health:1000});});
 for(const p of [host,guest])await p.evaluate(()=>{window.__paidDone=false;window.addEventListener('message',e=>{if(e.data?.type==='swahili-paid-review-complete')window.__paidDone=true;});});
 await host.keyboard.down('p');await host.evaluate(()=>window.__versus.step());await host.keyboard.up('p');
 await host.evaluate(()=>{for(let i=0;i<55&&!document.querySelector('iframe[title="Paid in Full ultimate"]');i++)window.__versus.step();});
 for(const p of [host,guest])await p.waitForSelector('iframe[title="Paid in Full ultimate"]',{state:'attached'});
 const ticks=await Promise.all([host,guest].map(p=>p.evaluate(()=>window.__versus.state.tick)));assert.equal(ticks[0],ticks[1]);
 for(const p of [host,guest])await p.waitForFunction(()=>window.__paidDone,null,{timeout:90000});
 for(const p of [host,guest])assert.equal(await p.locator('iframe[title="Paid in Full ultimate"]').count(),0);
 const finalTicks=await Promise.all([host,guest].map(p=>p.evaluate(()=>window.__versus.state.tick)));assert.deepEqual(finalTicks,ticks);
 await host.evaluate(()=>window.__versus.pause(true));
 await guest.waitForFunction(t=>window.__versus.state.tick>t+10,ticks[1],{timeout:20000});
 assert.deepEqual(errors,[]);console.log('PASS host and guest both finish the cinematic and resume snapshots');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
