(() => {
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sourceButton=(ids,label='Источник и пояснение ↗')=>`<button type="button" class="source-link" data-source="${esc(ids)}">${label}</button>`;
 const publicURL='https://evgk724.github.io/palermo-stone/';
 let toastTimer;
 function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5500);}
 $('#metrics').innerHTML=CONTENT.metrics.map(m=>`<article class="metric"><strong>${esc(m.value)} <small>${esc(m.unit)}</small></strong><span>${esc(m.label)}</span>${sourceButton(m.source,'Об измерении ↗')}</article>`).join('');
 $('#entries').innerHTML=CONTENT.entries.map(e=>`<article class="entry"><span class="eyebrow copper">${esc(e.label)}</span><p class="entry-value">${esc(e.value)}</p><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${sourceButton(e.source)}</article>`).join('');
 $('#questions').innerHTML=CONTENT.questions.map(q=>`<details><summary>${esc(q.title)}</summary><p>${esc(q.text)}</p>${sourceButton(q.source)}</details>`).join('');
 $('#film-cards').innerHTML=CONTENT.film.map(f=>`<article class="film-card"><a class="film-time" href="https://www.youtube.com/watch?v=-2ouNekCeR8&amp;t=${f.seconds}s" target="_blank" rel="noopener noreferrer" aria-label="Смотреть кадр ${esc(f.time)} на YouTube">${esc(f.time)} ↗</a><h3>${esc(f.title)}</h3><div class="evidence-line"><strong>Что видно в кадре</strong><p>${esc(f.seen)}</p></div><div class="evidence-line"><strong>Что из этого следует</strong><p>${esc(f.interpretation)}</p></div></article>`).join('');
 function readPart(key){const d=CONTENT.reading[key];if(!d)return;$('#reading-title').textContent=d.title;$('#reading-text').textContent=d.text;$('#reading-anchor').textContent=d.anchor;$$('[data-read]').forEach(b=>{const active=b.dataset.read===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$$('[data-zone]').forEach(e=>e.classList.toggle('selected',e.dataset.zone===key));}
 $$('[data-read]').forEach(b=>b.addEventListener('click',()=>readPart(b.dataset.read)));readPart('king');
 function showSources(ids){
  const wanted=ids?ids.split(','):Object.keys(CONTENT.sources);
  $('#sources-list').innerHTML=wanted.filter(id=>CONTENT.sources[id]).map(id=>{const s=CONTENT.sources[id];return `<article class="source-item"><p class="source-type">${esc(s.type)}</p><h3>${esc(s.title)}</h3><p>${esc(s.supports)}</p>${s.note?`<p>${esc(s.note)}</p>`:''}<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>${s.fullText?`<a href="${esc(s.fullText)}" target="_blank" rel="noopener noreferrer">Текст автора ↗</a>`:''}</article>`;}).join('');
  $('#sources-dialog').showModal();
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-source]');if(b)showSources(b.dataset.source);});
 $('#all-sources').addEventListener('click',()=>showSources());
 $$('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
 $$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));
 $('.qr-trigger').addEventListener('click',()=>$('#qr-dialog').showModal());$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
 $('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(publicURL);$('#copy-link').textContent='Ссылка скопирована';setTimeout(()=>$('#copy-link').textContent='Скопировать ссылку',2500);}catch{const r=document.createRange();r.selectNodeContents($('.qr-url'));const s=getSelection();s.removeAllRanges();s.addRange(r);$('#copy-link').textContent='Ссылка выделена — скопируйте её';}});
 $('#text-size').value=document.documentElement.dataset.textSize;
 $('#text-size').addEventListener('change',e=>{const size=e.target.value;if(!['normal','large','xlarge'].includes(size))return;document.documentElement.dataset.textSize=size;try{localStorage.setItem('palermo-text-size',size);}catch{toast('Размер изменён. Браузер не разрешил сохранить настройку.');}});

 // The historical plate is kept intact; display filters never invent missing marks.
 const viewer=$('#stone-viewer'),viewport=$('#stone-viewport'),art=$('#stone-art'),svg=art.querySelector('svg'),expand=$('#expand-viewer'),viewerDialog=$('#viewer-dialog');
 const home=document.createComment('viewer-position');viewer.before(home);
 let zoom=1,panX=0,panY=0,drag=null,artMode='neon';
 function bounds(){const box=viewport.getBoundingClientRect();return{x:Math.max(0,(box.width-20)*(zoom-1)/2),y:Math.max(0,(box.height-20)*(zoom-1)/2)};}
 function draw(){const b=bounds();panX=Math.max(-b.x,Math.min(b.x,panX));panY=Math.max(-b.y,Math.min(b.y,panY));art.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;$('#stone-zoom').value=Math.round(zoom*100);$('#zoom-label').textContent=`${Number(zoom.toFixed(2)).toLocaleString('ru-RU')}×`;$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=4;viewport.classList.toggle('zoomed',zoom>1);}
 function setZoom(value){const previous=zoom;zoom=Math.max(1,Math.min(4,value));panX*=zoom/previous;panY*=zoom/previous;if(zoom===1)panX=panY=0;draw();}
 $('#stone-zoom').addEventListener('input',e=>setZoom(Number(e.target.value)/100));$('#zoom-in').addEventListener('click',()=>setZoom(zoom+.25));$('#zoom-out').addEventListener('click',()=>setZoom(zoom-.25));
 $$('[data-art]').forEach(b=>b.addEventListener('click',()=>{artMode=b.dataset.art;art.classList.toggle('original',artMode==='original');svg.setAttribute('viewBox',artMode==='original'?'0 0 1924 2992':'0 72 1924 2784');$$('[data-art]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});$('#viewer-note').textContent=artMode==='original'?'Исходная историческая прорисовка 1903 года, без неонового фильтра. Это копия оборотной стороны, не фотография поверхности.':'Историческая прорисовка оборотной стороны, Édouard Naville, 1903. Неоновый цвет — современное оформление. Увеличьте и перетаскивайте.';draw();}));
 function focusPart(name){
  if(name==='whole'){setZoom(1);return;}
  const target=name==='cartouche'?{x:1320,y:840}:{x:840,y:2210};
  const width=viewport.clientWidth-20,height=viewport.clientHeight-20,vHeight=artMode==='original'?2992:2784,top=artMode==='original'?0:72;
  const fit=Math.min(width/1924,height/vHeight);zoom=name==='cartouche'?3.5:4;
  panX=(1924/2-target.x)*fit*zoom;panY=(top+vHeight/2-target.y)*fit*zoom;draw();
 }
 $$('[data-focus]').forEach(b=>b.addEventListener('click',()=>focusPart(b.dataset.focus)));
 viewport.addEventListener('pointerdown',e=>{if(zoom===1||e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:panX,py:panY};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');e.preventDefault();});
 viewport.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;panX=drag.px+e.clientX-drag.x;panY=drag.py+e.clientY-drag.y;draw();});
 const stopDrag=e=>{if(drag?.id===e.pointerId){drag=null;viewport.classList.remove('dragging');}};
 viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);viewport.addEventListener('lostpointercapture',stopDrag);
 viewport.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom+.25);}else if(e.key==='-'){e.preventDefault();setZoom(zoom-.25);}else if(e.key==='0'){e.preventDefault();setZoom(1);}else if(zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();panX+=e.key==='ArrowLeft'?45:e.key==='ArrowRight'?-45:0;panY+=e.key==='ArrowUp'?45:e.key==='ArrowDown'?-45:0;draw();}});
 expand.addEventListener('click',()=>{if(viewerDialog.open){viewerDialog.close();return;}viewerDialog.append(viewer);viewer.classList.add('expanded');expand.textContent='×';expand.setAttribute('aria-label','Свернуть изображение');expand.setAttribute('aria-expanded','true');viewerDialog.showModal();requestAnimationFrame(()=>{draw();expand.focus();});});
 viewerDialog.addEventListener('close',()=>{home.after(viewer);viewer.classList.remove('expanded');expand.textContent='⤢';expand.setAttribute('aria-label','Развернуть изображение');expand.setAttribute('aria-expanded','false');draw();expand.focus({preventScroll:true});});
 new ResizeObserver(draw).observe(viewport);draw();

 const L=window.PalermoLearning,key='palermo-learning-v1';
 let state={},queue=[],position=0,rated=0,revealed=false,mode='atlas';
 try{state=L.clean(JSON.parse(localStorage.getItem(key)),CONTENT.cards.map(c=>c.id));}catch{}
 function save(){try{localStorage.setItem(key,JSON.stringify(state));window.atlasHasUnsavedProgress=false;}catch{window.atlasHasUnsavedProgress=true;toast('Прогресс остался в памяти этой вкладки. Браузер не разрешил сохранить его на устройстве.');}}
 function topicCards(){return CONTENT.cards.filter(c=>$('#study-topic').value==='all'||c.topic===$('#study-topic').value);}
 function overview(){
  const cards=topicCards(),due=L.select(cards,state),seen=cards.filter(c=>state[c.id]);
  $('#due-count').textContent=due.length;$('#seen-count').textContent=seen.length;$('#total-count').textContent=cards.length;$('#start-review').disabled=!due.length;
  $('#review-ready-note').textContent=due.length?'Можно начать с новых карточек и тех, срок которых уже наступил.':cards.length?'На сейчас повторений нет. Всю подборку можно открыть в любое время.':'В этой теме пока нет карточек.';
 }
 function showOverview(){queue=[];revealed=false;$('#review-session').hidden=true;$('#review-complete').hidden=true;$('#learn-overview').hidden=false;overview();}
 function route(next,push=true,scroll=true){
  if(!['atlas','learn'].includes(next))return;
  const changed=mode!==next;mode=next;$('#atlas-view').hidden=next!=='atlas';$('#learn-view').hidden=next!=='learn';
  $$('.main-nav [data-mode]').forEach(b=>{const active=b.dataset.mode===next;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(next==='learn'&&(changed||!queue.length))showOverview();else if(next==='atlas'&&changed)showOverview();
  if(push){const url=new URL(location.href);if(next==='learn')url.searchParams.set('mode','learn');else url.searchParams.delete('mode');url.hash='';try{history.pushState(null,'',url);}catch{}}
  if(scroll)scrollTo({top:0,behavior:'instant'});
 }
 $$('[data-mode]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();route(b.dataset.mode);}));
 addEventListener('popstate',()=>route(new URL(location.href).searchParams.get('mode')==='learn'?'learn':'atlas',false));
 $('#study-topic').addEventListener('change',overview);
 function daysText(days){return days===1?'через 1 день':days===3?'через 3 дня':`через ${days} дней`;}
 function showCard(){
  if(position>=queue.length){$('#review-session').hidden=true;$('#review-complete').hidden=false;$('#review-summary').textContent=`Отмечено карточек: ${rated}. Сроки следующего повторения ${window.atlasHasUnsavedProgress?'пока сохранены только в памяти вкладки':'сохранены в этом браузере'}. К подборке можно вернуться в любое время.`;$('#return-overview').focus({preventScroll:true});return;}
  const c=queue[position];revealed=false;$('#session-position').textContent=`${position+1} из ${queue.length} в подборке`;$('#card-topic').textContent=CONTENT.topics[c.topic];$('#card-question').textContent=c.q;$('#card-answer').textContent=c.a;$('#card-detail').textContent=c.detail;$('#card-anchor').textContent=c.anchor;$('#answer-source').dataset.source=c.source;$('#card-back').hidden=true;$('#rating-buttons').hidden=true;$('#reveal-answer').hidden=false;$('#reveal-answer').setAttribute('aria-expanded','false');$('#good-interval').textContent=daysText(L.nextDays(state[c.id]));$('#reveal-answer').focus({preventScroll:true});
 }
 function start(all){queue=L.select(CONTENT.cards,state,$('#study-topic').value,all);if(!queue.length){overview();return;}position=0;rated=0;$('#learn-overview').hidden=true;$('#review-complete').hidden=true;$('#review-session').hidden=false;showCard();scrollTo({top:0,behavior:'instant'});}
 $('#start-review').addEventListener('click',()=>start(false));$('#practice-all').addEventListener('click',()=>start(true));$('#end-review').addEventListener('click',showOverview);$('#return-overview').addEventListener('click',()=>{showOverview();scrollTo({top:0,behavior:'instant'});});
 $('#reveal-answer').addEventListener('click',()=>{revealed=true;$('#card-back').hidden=false;$('#rating-buttons').hidden=false;$('#reveal-answer').setAttribute('aria-expanded','true');$('#reveal-answer').hidden=true;$('#card-answer').tabIndex=-1;$('#card-answer').focus({preventScroll:true});});
 $$('[data-grade]').forEach(b=>b.addEventListener('click',()=>{if(!revealed||!queue[position])return;const c=queue[position];state[c.id]=L.rate(state[c.id],b.dataset.grade);save();position++;rated++;showCard();scrollTo({top:0,behavior:'instant'});}));
 // A second tab may update due dates; do not overwrite its completed ratings.
 addEventListener('storage',e=>{if(e.key!==key||window.atlasHasUnsavedProgress)return;try{state=L.clean(JSON.parse(e.newValue),CONTENT.cards.map(c=>c.id));overview();if(queue[position]&&!revealed)$('#good-interval').textContent=daysText(L.nextDays(state[queue[position].id]));}catch{}});
 route(new URL(location.href).searchParams.get('mode')==='learn'?'learn':'atlas',false,false);
 overview();
})();
