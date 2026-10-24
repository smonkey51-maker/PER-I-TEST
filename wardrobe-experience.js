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
    target.insertBefore(stage,target.querySelector('#chips'));
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
    const observer = new MutationObserver(()=>{if(!target.classList.contains('hidden'))sync()});
    observer.observe(document.querySelector('#wardrobe'),{childList:true,subtree:false});
    const weatherObserver = new MutationObserver(sync);
    weatherObserver.observe(document.querySelector('#weatherInfo'),{childList:true});
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const intro=document.createElement('div');intro.className='wardrobe-intro';intro.setAttribute('aria-hidden','true');
      intro.innerHTML='<div class="wardrobe-intro__door"></div><div class="wardrobe-intro__door"></div>';
      document.body.append(intro);
      requestAnimationFrame(()=>requestAnimationFrame(()=>intro.classList.add('is-open')));
      intro.addEventListener('transitionend',()=>intro.remove(),{once:true});
      setTimeout(()=>intro.remove(),2200);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
