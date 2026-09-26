const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const origin = process.argv[2] || 'http://127.0.0.1:4230';
async function main() {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    page.setDefaultTimeout(120000);
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.pads=[0,1].map(index=>({index,id:`Test pad ${index}`,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))}));
      Object.defineProperty(navigator,'getGamepads',{value:()=>window.pads});
    });
    const button=async(seat,id,value)=>{await page.evaluate(({seat,id,value})=>{window.pads[seat].buttons[id].pressed=value;window.pads[seat].buttons[id].value=value?1:0;},{seat,id,value});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
    await page.goto(`${origin}/versus-playtest.html`,{waitUntil:'domcontentloaded'});
    await page.locator('#enterGame').waitFor();
    await page.bringToFront();
    await page.locator('[data-controller-help]').waitFor();
    console.log('title ready', await page.evaluate(() => document.hasFocus()));
    await button(0,0,true);await button(0,0,false);
    await page.locator('#modeTraining').waitFor();
    await button(0,0,true);await button(0,0,false);
    await page.locator('#fight').waitFor();
    console.log('controller menu navigation passed');
    assert.match(await page.locator('[data-controller-help]').innerText(),/P1: controller · P2: controller/);
    await page.goto(`${origin}/versus-playtest.html?arena=flat&autostart=1`,{waitUntil:'domcontentloaded'});
    await page.locator('.match[data-stage-ready="true"]').waitFor();
    console.log('match ready');
    const before=await page.evaluate(()=>({p1:window.__versus.state.fighters.p1.x,p2:window.__versus.state.fighters.p2.x}));
    await button(0,15,true);await page.waitForTimeout(150);await button(0,15,false);
    const moved=await page.evaluate(()=>({p1:window.__versus.state.fighters.p1.x,p2:window.__versus.state.fighters.p2.x}));
    assert(moved.p1>before.p1,'P1 moves');assert.equal(moved.p2,before.p2,'P2 stays independent');
    await page.keyboard.down('a');await page.waitForTimeout(150);await page.keyboard.up('a');
    assert(await page.evaluate(x=>window.__versus.state.fighters.p1.x<x,moved.p1),'keyboard remains usable alongside controllers');
    await button(1,14,true);await page.waitForTimeout(150);await button(1,14,false);
    assert(await page.evaluate(x=>window.__versus.state.fighters.p2.x<x,moved.p2),'P2 moves');
    await button(0,0,true);
    await page.waitForFunction(()=>window.__versus.state.fighters.p1.y < -65);
    await button(0,0,false);
    await button(0,7,true);await button(0,3,true);
    await page.waitForFunction(()=>window.__versus.state.fighters.p1.currentAttack === 'legacy_radiant_dive_medium');
    await button(0,3,false);await button(0,7,false);
    await button(0,9,true);await button(0,9,false);
    assert.match(await page.locator('#hudPause').innerText(),/Resume/);
    const tick=await page.evaluate(()=>window.__versus.state.tick);
    await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__versus.state.tick),tick);
    await button(0,9,true);await button(0,9,false);
    await page.evaluate(()=>window.pads[0]=null);await page.waitForTimeout(150);
    assert.match(await page.locator('#hudPause').innerText(),/Resume/);
    assert.match(await page.locator('[data-controller-help]').innerText(),/P1: keyboard · P2: controller/);
    await page.screenshot({path:'controller-support.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({menu:'pass',twoPlayers:'pass',jump:'pass',pause:'pass',disconnect:'pass',pageErrors:0}));
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
