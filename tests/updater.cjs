const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='http://127.0.0.1:8769/docs/';
const html=fs.readFileSync(path.resolve(__dirname,'../docs/index.html'),'utf8');
const current=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/version.json')));
const candidate='r-11111111111111111111';
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const b=await engine.launch(),ctx=await b.newContext({viewport:{width:440,height:956}});let published=false;
  await ctx.route('**/version.json*',route=>route.fulfill({json:{...current,version:published?candidate:current.version}}));
  await ctx.route('**/index.html?**',route=>route.fulfill({contentType:'text/html',body:html.replace(`content="${current.version}"`,`content="${candidate}"`)}));
  const p=await ctx.newPage();await p.goto(base);
  await p.locator('#text-size').selectOption('xlarge');await p.locator('.main-nav [data-mode=learn]').click();await p.locator('#study-topic').selectOption('craft');await p.locator('#start-review').click();await p.locator('#reveal-answer').click();
  published=true;await p.locator('#about-button').click();await p.locator('#check-update').click();await p.waitForFunction(()=>document.querySelector('#update-status').textContent.includes('завершения повторения'));
  assert.equal(await p.locator('#apply-update').isDisabled(),true);await p.locator('#auto-update').uncheck();await p.locator('#about-dialog .close-dialog').click();assert.equal(await p.locator('#update-now').isDisabled(),true);
  await p.locator('[data-grade=good]').click();await p.locator('#end-review').click();
  const before=await p.evaluate(()=>localStorage.getItem('palermo-learning-v1'));
  await p.locator('#about-button').click();await p.locator('#check-update').click();await p.waitForFunction(()=>!document.querySelector('#apply-update').disabled);
  await Promise.all([p.waitForURL(u=>u.pathname.endsWith('index.html')),p.locator('#apply-update').click()]);
  await p.waitForFunction(()=>document.querySelector('#study-topic').value==='craft');
  assert.equal(await p.locator('meta[name=atlas-version]').getAttribute('content'),candidate);assert.equal(await p.locator('#text-size').inputValue(),'xlarge');assert.equal(await p.locator('#learn-view').isHidden(),false);assert.equal(await p.evaluate(()=>localStorage.getItem('palermo-learning-v1')),before);assert.equal(await p.locator('#seen-count').textContent(),'1');assert.ok(!p.url().includes('__atlas_'));
  await b.close();console.log(`${name}: active recall protects update; applied release preserves font, topic, mode and actual study state.`);
 }
})().catch(e=>{console.error(e);process.exit(1);});
