const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8769/docs/';
const out=path.resolve(__dirname,'../../palermo-qa');fs.mkdirSync(out,{recursive:true});
const matrix=[[320,740],[390,844],[440,956],[820,1180],[834,1194],[1180,820],[1440,1080]];
const results=[];
async function noOverflow(page,label){
 const sizes=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,width:d.clientWidth,scroll:d.scrollWidth}))}));
 assert.ok(sizes.body<=sizes.viewport+1,label+' body overflow '+JSON.stringify(sizes));
 for(const d of sizes.dialogs)assert.ok(d.scroll<=d.width+1,label+' dialog overflow '+JSON.stringify(d));
}
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();const context=await browser.newContext({viewport:{width:440,height:956},deviceScaleFactor:1});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);assert.equal(await page.locator('#metrics article').count(),4);assert.equal(await page.locator('.film-card').count(),4);
  for(const [width,height] of matrix){
   await page.setViewportSize({width,height});
   for(const size of ['normal','large','xlarge']){
    await page.locator('#text-size').selectOption(size);await noOverflow(page,`${name} ${width} ${size} atlas`);
    await page.locator('.main-nav [data-mode=learn]').click();await noOverflow(page,`${name} ${width} ${size} learn`);
    await page.locator('.main-nav [data-mode=atlas]').click();
   }
  }
  await page.setViewportSize({width:320,height:740});
  for(const trigger of ['#about-button','.qr-trigger','#all-sources']){
   await page.locator(trigger).click();await noOverflow(page,`${name} 320 dialog`);await page.locator('dialog[open] .close-dialog').click();
  }
  await page.locator('#expand-viewer').click();assert.equal(await page.locator('#viewer-dialog').evaluate(d=>d.open),true);await noOverflow(page,`${name} 320 viewer`);await page.keyboard.press('Escape');assert.equal(await page.locator('#viewer-dialog').evaluate(d=>d.open),false);
  await page.setViewportSize({width:440,height:956});await page.locator('#text-size').selectOption('large');
  await page.locator('[data-focus=dense]').click();assert.equal(await page.locator('#stone-zoom').inputValue(),'400');
  const transform=await page.locator('#stone-art').evaluate(e=>e.style.transform);await page.locator('#stone-viewport').focus();await page.keyboard.press('ArrowLeft');assert.notEqual(await page.locator('#stone-art').evaluate(e=>e.style.transform),transform);
  await page.locator('#stone-viewer').screenshot({path:path.join(out,name+'-viewer.png')});
  await page.locator('[data-art=original]').click();assert.ok(await page.locator('#stone-art').evaluate(e=>e.classList.contains('original')));assert.equal(await page.locator('#stone-art svg').getAttribute('viewBox'),'0 0 1924 2992');
  await page.locator('#stone-viewer').screenshot({path:path.join(out,name+'-original.png')});
  await page.locator('[data-art=neon]').click();await page.locator('[data-focus=cartouche]').click();await page.locator('#stone-viewer').screenshot({path:path.join(out,name+'-cartouche.png')});
  await page.locator('[data-read=nile]').click();assert.ok((await page.locator('#reading-anchor').textContent()).includes('5 · 1 · 1'));
  await page.locator('#reading').screenshot({path:path.join(out,name+'-reading.png')});
  await page.locator('#film').screenshot({path:path.join(out,name+'-film.png')});
  await page.locator('.main-nav [data-mode=learn]').click();assert.equal(await page.locator('#due-count').textContent(),'16');assert.equal(await page.locator('#seen-count').textContent(),'0');
  await page.locator('#study-topic').selectOption('craft');assert.equal(await page.locator('#due-count').textContent(),'6');await page.locator('#start-review').click();
  assert.equal(await page.locator('#card-back').isHidden(),true);assert.equal(await page.locator('#rating-buttons').isHidden(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('palermo-learning-v1')),null);
  await page.locator('#reveal-answer').click();assert.equal(await page.locator('#card-back').isHidden(),false);await page.locator('#review-session').screenshot({path:path.join(out,name+'-recall.png')});
  await page.locator('[data-grade=good]').click();assert.equal(await page.locator('#card-back').isHidden(),true);
  await page.locator('#end-review').click();assert.equal(await page.locator('#seen-count').textContent(),'1');assert.equal(await page.locator('#due-count').textContent(),'5');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('palermo-learning-v1')));assert.equal(Object.values(saved)[0].reviews,1);
  await page.reload();assert.equal(await page.locator('#learn-view').isHidden(),false);assert.equal(await page.locator('#seen-count').textContent(),'1');assert.equal(await page.locator('#text-size').inputValue(),'large');
  await page.locator('#study-topic').selectOption('stone');await page.locator('#start-review').click();await page.locator('#reveal-answer').click();await page.locator('[data-grade=again]').click();await page.locator('#end-review').click();assert.equal(await page.locator('#due-count').textContent(),'4');
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({browser:name,viewports:matrix,fontSizes:3,overflow:'none',viewer:'neon, original, presets, keys, expand, close',recall:'hidden answers, grade scheduling, topics, persistence',errors});
  await browser.close();
 }
 // Standalone file must render offline without runtime fetches or CDN resources.
 const b=await chromium.launch(),p=await b.newPage();const network=[];p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await p.goto('file://'+path.resolve(__dirname,'../docs/PALERMO.html'));assert.equal(await p.locator('#metrics article').count(),4);assert.equal(await p.locator('#auto-update').isDisabled(),true);assert.equal(await p.locator('.app-updates a').getAttribute('href'),'https://evgk724.github.io/palermo-stone/');assert.deepEqual(network,[]);await b.close();
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({results,offline:'no external requests'},null,2));console.log(JSON.stringify({matrix:'42 browser/viewport/font combinations',results,offline:'passed'},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
