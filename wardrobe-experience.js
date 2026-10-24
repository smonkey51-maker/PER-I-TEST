/* Mobile-first visual layer: no changes to persistence or AI. */
(() => {
  const init = () => {
    const target = document.querySelector('#view-wardrobe');
    if (!target || document.querySelector('#atelierStage')) return;
    const stage = document.createElement('section');
    stage.id = 'atelierStage';
    stage.className = 'wardrobe-stage';
    stage.setAttribute('aria-label','Armadio interattivo');
    stage.innerHTML = '<div class="wardrobe-stage__heading"><h2>Il tuo armadio</h2><span>Scorri i capi</span></div><div class="wardrobe-rail" id="atelierRail"></div>';
    const home = document.querySelector('#view-today');
    const greeting = home.querySelector('.greet');
    greeting.after(stage);
    stage.querySelector('h2').textContent = 'Il tuo armadio';
    const headline = document.createElement('p'); headline.className='atelier-home-kicker';headline.textContent='IL TUO STILE, OGGI';greeting.prepend(headline);
    const todayContent = document.querySelector('#todayContent');
    const ideaCard = todayContent?.querySelector('.idea-card');
    if(ideaCard){ideaCard.classList.add('atelier-outfit-card');const actions=ideaCard.querySelector('.actions');if(actions){const change=document.createElement('button');change.className='btn secondary';change.type='button';change.textContent='Cambia un capo';change.id='atelierSwap';actions.append(change);change.addEventListener('click',openSwap)}}
    let lastSignature = '';
    const sync = () => {
      if (typeof all !== 'function') return;
      const wx = typeof weather !== 'undefined' ? weather : null;
      stage.dataset.sky = !wx ? 'neutral' : wx.rain >= 50 ? 'rain' : wx.tmax <= 12 ? 'cold' : 'sun';
      all().then(items => {
        const signature = items.map(x => x.id + ':' + (x.updatedAt || '')).join('|');
        if(signature === lastSignature) return;
        lastSignature = signature;
        const rail = document.querySelector('#atelierRail');
        const selected = items.slice(0,40);
        rail.replaceChildren();
        for(const item of selected){
          const b = document.createElement('button');
          b.type='button';b.className='wardrobe-hanger';b.setAttribute('aria-label','Apri '+(item.tipo||'capo'));
          const src = typeof photoSrc === 'function' ? photoSrc(item.id) : '';
          if(src){const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';b.append(img)}
          else{const placeholder=document.createElement('div');placeholder.className='ph';placeholder.textContent='ATELIER';b.append(placeholder)}
          const name=document.createElement('span');name.className='wardrobe-hanger__name';name.textContent=item.tipo||'Capo';b.append(name);
          b.addEventListener('click',()=>{if(typeof openDetail==='function')openDetail(item.id)});
          rail.append(b);
        }
        if(!selected.length){const p=document.createElement('p');p.className='small';p.style.padding='0 18px';p.textContent='Aggiungi un capo per riempire il tuo armadio.';rail.append(p)}
      }).catch(()=>{});
    };
    sync();
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',sync));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
    const observer = new MutationObserver(()=>{if(!home.classList.contains('hidden'))sync()});
    observer.observe(document.querySelector('#wardrobe'),{childList:true,subtree:false});
    const weatherObserver = new MutationObserver(sync);
    weatherObserver.observe(document.querySelector('#weatherInfo'),{childList:true});
    function openSwap(){
      if(typeof idea==='undefined'||!idea?.ids?.length){return}
      const old=document.querySelector('#atelierSwapDialog');if(old)old.remove();
      const dlg=document.createElement('dialog');dlg.id='atelierSwapDialog';dlg.className='atelier-swap-dialog';
      const title=document.createElement('h2');title.textContent='Cambia un capo';dlg.append(title);
      const hint=document.createElement('p');hint.className='small';hint.textContent='Scegli il capo da sostituire, poi una delle alternative disponibili.';dlg.append(hint);
      const current=document.createElement('div');current.className='atelier-swap-options';dlg.append(current);
      const close=document.createElement('button');close.type='button';close.className='btn secondary';close.textContent='Chiudi';close.onclick=()=>dlg.close();dlg.append(close);
      document.body.append(dlg);
      const showCurrent=async()=>{
        current.replaceChildren();const items=await all();const byId=new Map(items.map(x=>[x.id,x]));
        for(const id of idea.ids){const item=byId.get(id);if(!item)continue;
          const b=document.createElement('button');b.className='atelier-swap-item';b.append(swapPreview(item));
          b.onclick=()=>showAlternatives(item,items,current,showCurrent);current.append(b)}
      };showCurrent();dlg.showModal();dlg.addEventListener('close',()=>dlg.remove(),{once:true});
    }
    function swapPreview(item){
      const wrap=document.createElement('span');wrap.className='atelier-swap-preview';
      const src=typeof photoSrc==='function'?photoSrc(item.id):'';
      if(src){const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';wrap.append(img)}
      const label=document.createElement('span');label.textContent=(item.tipo||'Capo')+(item.colore?' · '+item.colore:'');wrap.append(label);
      return wrap;
    }
    function showAlternatives(original,items,container,back){
      container.replaceChildren();
      const backBtn=document.createElement('button');backBtn.className='btn secondary';backBtn.textContent='← Indietro';backBtn.onclick=back;container.append(backBtn);
      const alternatives=items.filter(x=>x.id!==original.id && !washing(x) && catOf(x)===catOf(original) && !idea.ids.includes(x.id));
      if(!alternatives.length){const p=document.createElement('p');p.textContent='Nessuna alternativa lavata nella stessa categoria.';container.append(p);return}
      for(const candidate of alternatives){const b=document.createElement('button');b.className='atelier-swap-item';b.append(swapPreview(candidate));
        b.onclick=async()=>{idea.ids=idea.ids.map(id=>id===original.id?candidate.id:id);if(typeof second!=='undefined')second=null;document.querySelector('#atelierSwapDialog')?.close();await renderAll()};container.append(b)}
    }

  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
