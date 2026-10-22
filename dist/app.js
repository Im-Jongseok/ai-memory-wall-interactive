(() => {
  'use strict';
  const scenes = window.REVIEW_SCENES;
  const asset = name => window.REVIEW_ASSETS?.[name] || `assets/${name}`;
  const $ = id => document.getElementById(id);
  const pageRatio = 773.858 / 566.929;
  const paperW = 1000, paperH = paperW * pageRatio;
  const pageNames = ['문제 제기\n초록·배경','성장의 격차\nFig. 1 · Fig. 2','지표와 실험 조건\n식 (1) · 각주 c·d','프로파일링\nFig. 3a–d','학습과 배포\nFig. 4 · 해결책','가속기 설계와 결론','저자 소개'];
  const state = { index: 0, page: null, overview: false, manual: false, sourceOnly: false, notes: false, camera: {x:0,y:0,s:1}, freePage: null, renderToken: 0, dragging: null };
  const views = ['reader','ending'];
  const stage = $('stage'), paper = $('paper');
  paper.style.height = `${paperH}px`;
  const scene = () => scenes[state.index];
  const activePage = () => state.freePage || scene().page;
  const isPaper = () => !['cover','map','end'].includes(scene().kind);
  const formatPage = p => String(p + 32);
  let toastTimer, resizeTimer;

  function toast(text) {
    $('toast').textContent = text; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2200);
  }
  function go(target) {
    const index = typeof target === 'number' ? target : scenes.findIndex(s => s.id === target);
    if (index < 0 || index >= scenes.length) return;
    state.index = index; state.freePage = null; state.overview = false; state.manual = false;
    if (location.hash.slice(1) !== scene().id) history.replaceState(null,'',`#${scene().id}`);
    render();
  }
  function step(direction) {
    if (state.freePage) { state.freePage = null; render(); return; }
    go(Math.max(0,Math.min(scenes.length-1,state.index + direction)));
  }
  function buildNavigation() {
    for(const container of [$('explorer-pages')]) {
      const count=7;
      for(let p=1;p<=count;p++){
        const b=document.createElement('button'); b.className='page-card'; b.dataset.page=p;
        b.setAttribute('aria-label',`원문 ${formatPage(p)}쪽: ${pageNames[p-1].replace(/\n/g,' ')}`);
        b.innerHTML=`<small><span>p.${formatPage(p)}</span><span>↗</span></small><span class="page-thumb"><img src="${asset(`thumb-${p}.webp`)}" alt="원문 ${formatPage(p)}쪽" loading="lazy"></span><strong>${pageNames[p-1]}</strong>`;
        b.addEventListener('click',()=>openPage(p)); container.append(b);
      }
    }
  }
  function openPage(page) {
    $('page-dialog').close();
    const target = scenes.findIndex(s=>s.page===page && !s.roi && s.kind==='paper');
    if(target>=0){go(target);return;}
    state.freePage=page; state.overview=true; state.manual=false; render();
  }
  function fitCamera(roi=[0,0,1,1]) {
    const w=stage.clientWidth,h=stage.clientHeight;
    const pad=w<450?18:32, rw=(roi[2]-roi[0])*paperW,rh=(roi[3]-roi[1])*paperH;
    const s=Math.min((w-pad*2)/rw,(h-pad*2)/rh);
    return {s,x:(w-rw*s)/2-roi[0]*paperW*s,y:(h-rh*s)/2-roi[1]*paperH*s};
  }
  function applyCamera(camera,manual=false) {
    state.camera=camera; state.manual=manual;
    stage.classList.toggle('manual',manual);
    paper.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.s})`;
    const full=fitCamera().s;
    $('zoom-value').textContent=`${Math.round(camera.s/full*100)}%`;
    updateMinimap();
  }
  function targetROI() {
    if(state.freePage || state.overview || !scene().roi)return [0,0,1,1];
    if(scene().opening && stage.clientWidth<600)return [.065,.09,.49,.133];
    return scene().roi;
  }
  function setClip(roi) {
    const [x0,y0,x1,y1]=roi;
    paper.style.clipPath=`inset(${y0*100}% ${(1-x1)*100}% ${(1-y1)*100}% ${x0*100}%)`;
  }
  function fitScene(animate=true) {
    if(!isPaper()&&!state.freePage)return;
    const roi=targetROI(); state.manual=false;
    stage.classList.toggle('switching',!animate);
    setClip(roi); applyCamera(fitCamera(roi)); updateViewLabel();
    if(!animate) requestAnimationFrame(()=>stage.classList.remove('switching'));
  }
  function updateViewLabel() {
    const full=targetROI().every((v,i)=>v===[0,0,1,1][i])&&!state.manual;
    $('view-label').textContent=state.manual?'원문 자유 탐색':full?'원문 전체':'그림·문단 확대';
    $('overview-btn').innerHTML = full&&scene().roi&&!state.freePage?'확대 위치로 <span>↗</span>':'전체 페이지 <span>↙</span>';
    $('overview-btn').setAttribute('aria-pressed',String(full));
    $('hotspots').hidden=!full;
    $('stage-tip').hidden=!full||!$('hotspots').children.length;
  }
  function updateMinimap() {
    const c=state.camera, w=stage.clientWidth,h=stage.clientHeight;
    let roi = state.manual ? [Math.max(0,-c.x/(paperW*c.s)),Math.max(0,-c.y/(paperH*c.s)),Math.min(1,(w-c.x)/(paperW*c.s)),Math.min(1,(h-c.y)/(paperH*c.s))] : targetROI();
    roi=roi.map(v=>Math.max(0,Math.min(1,v)));
    const r=$('mini-region');r.style.left=`${roi[0]*100}%`;r.style.top=`${roi[1]*100}%`;r.style.width=`${Math.max(0,roi[2]-roi[0])*100}%`;r.style.height=`${Math.max(0,roi[3]-roi[1])*100}%`;
  }
  function makeHotspots(page) {
    $('hotspots').replaceChildren();
    const candidates=scenes.filter(s=>s.page===page&&s.roi&&s.kind==='paper'&&!s.opening);
    candidates.forEach((s,i)=>{
      const [x0,y0,x1,y1]=s.roi;const b=document.createElement('button');b.className='hotspot';
      b.style.cssText=`left:${x0*100}%;top:${y0*100}%;width:${(x1-x0)*100}%;height:${(y1-y0)*100}%`;
      const label=s.id.startsWith('fig')?'Fig. '+s.id.slice(3).replace(/([0-9])([a-d])/,'$1($2)'):s.id==='equation'?'式 (1)':s.id==='footnote-c'?'각주 c':s.id==='review-2'?'각주 d':s.label.split(' · ')[0];
      b.innerHTML=`<span>${label} ↗</span>`;b.setAttribute('aria-label',`${label}: ${s.title.replace(/\n/g,' ')}`);
      b.addEventListener('click',e=>{e.stopPropagation();if(!state.dragging?.moved)go(s.id);});
      $('hotspots').append(b);
    });
  }
  async function renderPaper(token) {
    const s=scene(),page=activePage(),free=!!state.freePage;
    $('scene-kicker').textContent=free?'EXPLORE THE ORIGINAL':(s.label||s.chapter).replace(/FIGURE /,'FIGURE ');
    $('scene-title').textContent=free?`원문 p.${formatPage(page)}\n직접 탐색하기.`:s.title;
    $('page-number').textContent=formatPage(page);
    $('source-citation').textContent=free?`IEEE Micro 44(3), 2024 · 원문 p.${formatPage(page)}`:s.source;
    $('scene-stat').textContent=free?'The original.':s.stat;
    $('scene-stat').classList.toggle('long',s.stat.length>25);
    $('scene-body').textContent=free?(page===7?'출판본의 저자 소개 페이지입니다. 휠로 확대하고 드래그로 이동하며 확인할 수 있습니다.':'원문에 표시된 영역을 선택하면 해당 그림·문단으로 이동합니다. 휠로 확대하거나 드래그로 직접 탐색할 수도 있습니다.'):s.body;
    $('scene-notes').textContent=(s.note||'').replace(/^- /gm,'• ');
    $('mini-label').textContent=`p.${formatPage(page)}`;
    $('mini-image').src=asset(`thumb-${page}.webp`);
    $('figure-tabs').hidden=free||!/^fig3[a-d]$/.test(s.id);
    document.querySelectorAll('.tab-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.go===s.id));
    $('notes-panel').hidden=!state.notes;
    $('notes-btn').setAttribute('aria-expanded',String(state.notes));
    $('notes-btn').innerHTML=`노트 <span>${state.notes?'−':'＋'}</span>`;
    document.body.classList.toggle('exploring',free);
    makeHotspots(page);
    $('source-highlights').replaceChildren();
    if(s.highlight&&!free){const [x0,y0,x1,y1]=s.highlight;const marker=document.createElement('span');marker.className='title-highlight';marker.style.cssText=`left:${x0*100}%;top:${y0*100}%;width:${(x1-x0)*100}%;height:${(y1-y0)*100}%`;$('source-highlights').append(marker);}

    const changed=state.page!==page;
    if(changed){
      stage.classList.add('switching');paper.style.opacity='0';
      const img=$('paper-image');img.src=asset(`page-${page}.webp`);img.alt=`AI and Memory Wall IEEE 출판본 ${formatPage(page)}쪽`;
      try{await img.decode();}catch{toast('원문 이미지를 불러오지 못했습니다. assets 폴더를 확인해 주세요.');}
      if(token!==state.renderToken)return;
      state.page=page;setClip([0,0,1,1]);applyCamera(fitCamera());paper.style.opacity='1';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token!==state.renderToken)return;stage.classList.remove('switching');fitScene();}));
    }else{fitScene();}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){$('interpretation').classList.remove('scene-enter');void $('interpretation').offsetWidth;$('interpretation').classList.add('scene-enter');}
    $('reader').scrollTop=0;$('interpretation').scrollTop=0;
  }
  function render() {
    const s=scene(), token=++state.renderToken;
    const view=state.freePage?'reader':s.kind==='end'?'ending':'reader';
    views.forEach(id=>$(id).hidden=id!==view);
    document.body.classList.toggle('title-scene',!!s.opening&&!state.freePage);
    document.body.classList.toggle('source-only',state.sourceOnly&&view==='reader');
    $('prev-btn').disabled=state.index===0&&!state.freePage;
    $('next-btn').disabled=state.index===scenes.length-1&&!state.freePage;
    $('next-btn').innerHTML=state.freePage?'복귀 <span>↙</span>':'다음 <span>→</span>';
    $('live-status').textContent=`${state.index+1}/${scenes.length}. ${s.title.replace(/\n/g,' ')}`;
    if(view==='reader')renderPaper(token);
  }
  function toggleOverview(){
    if(!isPaper()&&!state.freePage)return;
    if(state.manual){state.manual=false;state.overview=true;}
    else state.overview=!state.overview;
    fitScene();
  }
  function toggleNotes(){state.notes=!state.notes;$('notes-panel').hidden=!state.notes;$('notes-btn').setAttribute('aria-expanded',String(state.notes));$('notes-btn').innerHTML=`노트 <span>${state.notes?'−':'＋'}</span>`;}
  function toggleSourceOnly(){state.sourceOnly=!state.sourceOnly;document.body.classList.toggle('source-only',state.sourceOnly);$('isolate-btn').setAttribute('aria-pressed',String(state.sourceOnly));requestAnimationFrame(()=>fitScene(false));}
  function zoom(factor,anchor){
    if(!isPaper()&&!state.freePage)return;
    const current=state.camera,full=fitCamera().s;
    const s=Math.max(full*.6,Math.min(full*16,current.s*factor));
    const point=anchor||{x:stage.clientWidth/2,y:stage.clientHeight/2};
    const x=point.x-(point.x-current.x)*s/current.s,y=point.y-(point.y-current.y)*s/current.s;
    setClip([0,0,1,1]);applyCamera({x,y,s},true);updateViewLabel();
  }
  async function toggleFullscreen(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{toast('전체 화면은 브라우저의 전체 화면 메뉴에서도 켤 수 있습니다.');}
  }
  function openDialog(id){const d=$(id);if(!d.open)d.showModal();}
  $('prev-btn').addEventListener('click',()=>step(-1));$('next-btn').addEventListener('click',()=>step(1));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

  $('fullscreen-btn').addEventListener('click',toggleFullscreen);$('overview-btn').addEventListener('click',toggleOverview);$('isolate-btn').addEventListener('click',toggleSourceOnly);$('notes-btn').addEventListener('click',toggleNotes);
  $('minimap').addEventListener('click',()=>{state.overview=true;fitScene();});$('mini-return').addEventListener('click',()=>{state.overview=true;fitScene();});
  $('zoom-in').addEventListener('click',()=>zoom(1.25));$('zoom-out').addEventListener('click',()=>zoom(.8));$('fit-btn').addEventListener('click',()=>{state.manual=false;fitScene();});
  for(const d of document.querySelectorAll('dialog')){d.querySelector('.dialog-close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});}
  stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoom(Math.exp(-Math.max(-70,Math.min(70,e.deltaY))*.007),{x:e.clientX-r.left,y:e.clientY-r.top});},{passive:false});
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('.zoom-controls')||e.button!==0)return;
    state.dragging={x:e.clientX,y:e.clientY,c:{...state.camera},moved:false,target:e.target};
  });
  stage.addEventListener('pointermove',e=>{
    const d=state.dragging;if(!d)return;
    const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>5)d.moved=true;
    if(!d.moved)return;
    stage.classList.add('dragging');stage.setPointerCapture(e.pointerId);setClip([0,0,1,1]);
    applyCamera({x:d.c.x+dx,y:d.c.y+dy,s:d.c.s},true);updateViewLabel();
  });
  function endDrag(e){if(!state.dragging)return;const moved=state.dragging.moved;stage.classList.remove('dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(moved){const suppress=ev=>{ev.stopPropagation();ev.preventDefault();};stage.addEventListener('click',suppress,{capture:true,once:true});setTimeout(()=>stage.removeEventListener('click',suppress,{capture:true}),100);}setTimeout(()=>state.dragging=null,0);}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('dblclick',e=>{if(e.target.closest('button'))return;e.preventDefault();const r=stage.getBoundingClientRect();zoom(1.8,{x:e.clientX-r.left,y:e.clientY-r.top});});
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
    if(document.querySelector('dialog[open]'))return;
    if((e.key===' '||e.key==='Enter')&&e.target.closest('button,a'))return;
    const key=e.key.toLowerCase();
    const actions={'arrowright':()=>step(1),'pagedown':()=>step(1),' ':()=>step(1),'arrowleft':()=>step(-1),'pageup':()=>step(-1),'home':()=>go(0),'end':()=>go(scenes.length-1),'o':toggleOverview,'t':toggleSourceOnly,'n':toggleNotes,'m':()=>openDialog('page-dialog'),'h':()=>openDialog('help-dialog'),'?':()=>openDialog('help-dialog'),'f':toggleFullscreen,'+':()=>zoom(1.25),'=':()=>zoom(1.25),'-':()=>zoom(.8),'0':()=>fitScene(),'escape':()=>{if(state.sourceOnly)toggleSourceOnly();else if(state.freePage){state.freePage=null;render();}else{state.overview=true;fitScene();}}};
    if(actions[key]){e.preventDefault();actions[key]();}
  });
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!$('reader').hidden)fitScene(false);},100);});
  window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(scenes.some(s=>s.id===id))go(id);});
  buildNavigation();const initial=decodeURIComponent(location.hash.slice(1));go(scenes.some(s=>s.id===initial)?initial:0);
  // Preload the source pages once; all interactions then use these original page images.
  const preload=()=>{for(let p=1;p<=7;p++){const img=new Image();img.src=asset(`page-${p}.webp`);}};
  if('requestIdleCallback'in window)requestIdleCallback(preload);else setTimeout(preload,1000);
})();
