/* Editorial additions; original app remains source of truth. */
(()=>{function init(){const today=document.getElementById('view-today'),wardrobe=document.getElementById('view-wardrobe');if(!today||!wardrobe)return;
if(!document.querySelector('.atelier-editorial-hero')){const hero=document.createElement('section');hero.className='atelier-editorial-hero';hero.setAttribute('aria-label','ATELIER, il tuo guardaroba intelligente');hero.innerHTML='<div class="atelier-hero-top"><span>ATELIER</span><span>PERSONAL WARDROBE</span></div><h2>Il tuo<br>Guardaroba<br>Intelligente</h2><p>Capi, look e consigli su misura, per ogni occasione.</p><button type="button">Esplora il guardaroba <span aria-hidden="true">→</span></button>';hero.querySelector('button').addEventListener('click',()=>document.querySelector('.tab[data-tab="wardrobe"]')?.click());today.insertBefore(hero,today.firstChild)}
if(!document.querySelector('.atelier-wardrobe-editorial')){const section=document.createElement('section');section.className='atelier-wardrobe-editorial';section.innerHTML='<h2>La tua collezione</h2><div class="atelier-category-grid"></div>';const entries=[['Maglieria','/assets/prada/knit-bordeaux.webp'],['Camicie','/assets/prada/poplin-shirt.webp'],['Capispalla','/assets/prada/nylon-jacket.webp'],['Pantaloni','/assets/prada/tailored-trousers.webp'],['Scarpe','/assets/prada/sneakers-cream.webp'],['Accessori','/assets/prada/leather-loafers.webp']];const grid=section.querySelector('.atelier-category-grid');for(const [label,src] of entries){const b=document.createElement('button');b.type='button';b.className='atelier-category';const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';const span=document.createElement('span');span.textContent=label;b.append(img,span);b.dataset.category=label;b.addEventListener('click',()=>{const chips=[...document.querySelectorAll('#chips button')];const match=chips.find(c=>c.textContent.toLowerCase().includes(label.toLowerCase().slice(0,-1)));if(match){match.click();document.getElementById('wardrobe')?.scrollIntoView({behavior:'smooth',block:'start'})}else{document.getElementById('chips')?.scrollIntoView({behavior:'smooth',block:'start'})}});grid.append(b)}const chips=document.getElementById('chips');chips?.parentNode?.insertBefore(section,chips)}
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();

/* Six-screen navigation: reuse original application panels, never duplicate data. */
(()=>{function ready(){
const nav=document.querySelector('.tabs');if(!nav||nav.dataset.editorialSix)return;nav.dataset.editorialSix='1';
const make=(tab,label,icon)=>{const b=document.createElement('button');b.type='button';b.className='tab atelier-extra-tab';b.dataset.editorialTab=tab;b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.innerHTML='<span class="nav-icon" aria-hidden="true">'+icon+'</span><span class="nav-text">'+label+'</span>';b.addEventListener('click',()=>{if(typeof showTab==='function')showTab(tab);else{document.querySelectorAll('main > section[role="tabpanel"]').forEach(s=>s.classList.toggle('hidden',s.id!=='view-'+tab))}update()});return b};
const chart='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V11h3v9M10.5 20V5h3v15M17 20v-8h3v8"/></svg>';
const cal='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
const analysis=make('analysis','Analisi',chart);nav.querySelector('[data-tab="week"]')?.remove();nav.append(analysis);const calendar=make('week','Calendario',cal);nav.append(calendar);
const profile=document.querySelector('#view-profile .view-head h1');if(profile)profile.textContent='Il tuo profilo di stile';
const analytics=document.querySelector('#view-analysis .view-head h1');if(analytics)analytics.textContent='Analisi';
const week=document.querySelector('#view-week .view-head h1');if(week)week.textContent='Calendario';
const logo=document.querySelector('.brand');if(logo){logo.textContent='ATELIER';logo.setAttribute('aria-label','ATELIER')}
const tabs=[...nav.querySelectorAll('.tab')];
function update(){for(const b of tabs){const key=b.dataset.editorialTab||b.dataset.tab;const panel=document.getElementById('view-'+key);const active=!!panel&&!panel.classList.contains('hidden');b.setAttribute('aria-selected',String(active));} }
const observer=new MutationObserver(update);for(const p of document.querySelectorAll('main > section[role="tabpanel"]'))observer.observe(p,{attributes:true,attributeFilter:['class']});update();
const profileButton=document.getElementById('profileBtn');if(profileButton){profileButton.setAttribute('aria-label','Profilo di stile e account')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()})();

/* Exact five-destination information architecture of the approved reference. */
(()=>{const run=()=>{
const nav=document.querySelector('.tabs');if(!nav)return;
const labels={today:'Home',wardrobe:'Guardaroba',looks:'Look',analysis:'Analisi',week:'Calendario'};
const icons={
today:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>',
wardrobe:'<path d="M12 7.2V6a2 2 0 1 1 2 2M12 7.2 3.4 14.1a1 1 0 0 0 .6 1.9h16a1 1 0 0 0 .6-1.9z"/>',
looks:'<rect x="8" y="3" width="13" height="13" rx="2"/><path d="M16 19.5H5.5A2.5 2.5 0 0 1 3 17V7"/>',
analysis:'<path d="M4 20V12h3v8M10.5 20V5h3v15M17 20v-9h3v9"/>',
week:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>'};
const ordered=['today','wardrobe','looks','analysis','week'];
for(const key of ordered){let b=nav.querySelector('[data-editorial-tab="'+key+'"],[data-tab="'+key+'"]');if(!b)continue;nav.append(b);const t=b.querySelector('.nav-text');if(t)t.textContent=labels[key];const ico=b.querySelector('.nav-icon');if(ico)ico.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>'}
document.documentElement.classList.add('atelier-reference-layout');
const home=document.querySelector('.atelier-editorial-hero h2');if(home)home.innerHTML='<span class="hero-kicker">Il tuo</span>Guardaroba<br>Intelligente';
const wardrobe=document.querySelector('#view-wardrobe .view-head h1');if(wardrobe)wardrobe.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent='Guardaroba '});
const look=document.querySelector('#view-looks .view-head h1');if(look)look.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent='Look '});
const profile=document.querySelector('#view-profile .view-head h1');if(profile)profile.textContent='Il tuo profilo di stile';
const profileButton=document.querySelector('#profileBtn');if(profileButton)profileButton.setAttribute('title','Profilo di stile');
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()})();

/* Counts are read from the actual IndexedDB collection, never mock values. */
(()=>{async function update(){const buttons=[...document.querySelectorAll('.atelier-category[data-category]')];if(!buttons.length||typeof all!=='function')return;try{const gs=await all();const rules={Maglieria:/maglier|maglion|pullover|felp/,Camicie:/camic|t.shirt|polo/,Capispalla:/capispall|giacc|blazer|cappott/,Pantaloni:/pantalon|jeans|denim|gurkha/,Scarpe:/scarp|sneaker|mocassin|stival/,Accessori:/accessor|cintur|bors|sciarp|cappell/};for(const b of buttons){const re=rules[b.dataset.category];const n=gs.filter(g=>re.test(String([g.tipo,g.categoria,typeof catOf==='function'?catOf(g):''].join(' ')).toLowerCase())).length;let count=b.querySelector('.atelier-category-count');if(!count){count=document.createElement('small');count.className='atelier-category-count';b.append(count)}count.textContent=n+' '+(n===1?'capo':'capi')}}catch{}}const run=()=>{update();document.querySelector('[data-tab="wardrobe"]')?.addEventListener('click',update);const w=document.getElementById('wardrobe');if(w){let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(update,150)}).observe(w,{childList:true})}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()})();
