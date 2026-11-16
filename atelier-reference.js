/* ATELIER reference fidelity: data-driven editorial components.
   This layer does not mutate garment records or intercept authentication. */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const clean=s=>String(s||'').toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const isEnglish=()=>document.documentElement.lang==='en';
const t=(it,en)=>isEnglish()?en:it;
const svg=(name)=>({sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',hanger:'<path d="M12 6a2 2 0 1 1 2 2c-1 1-2 1-2 3l8 6a2 2 0 0 1-1 3H5a2 2 0 0 1-1-3l8-6"/>',chevron:'<path d="m9 5 7 7-7 7"/>'}[name]||'');
const icon=name=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+svg(name)+'</svg>';
const navigate=tab=>{if(typeof showTab==='function')showTab(tab);else q('[data-tab="'+tab+'"],[data-editorial-tab="'+tab+'"]')?.click()};
async function garments(){try{return typeof all==='function'?await all():[]}catch{return []}}
function countCategory(gs,re){return gs.filter(g=>re.test(clean([g.tipo,g.categoria,typeof catOf==='function'?catOf(g):''].join(' ')))).length}
function garmentImage(g){if(!g)return'/assets/prada/nylon-jacket.webp';try{if(typeof photoSrc==='function'&&photoSrc(g.id))return photoSrc(g.id);if(typeof pradaFallbackPhoto==='function'&&pradaFallbackPhoto(g))return pradaFallbackPhoto(g)}catch{}return'/assets/prada/nylon-jacket.webp'}
function initLook(){
const view=q('#view-looks');if(!view||q('#editorialLook'))return;
const card=el('section','editorial-look');card.id='editorialLook';card.innerHTML='<div class="editorial-look-art"><img src="/assets/prada/look-campaign.webp" alt="Fotografia editoriale di un look sartoriale" loading="eager"><div class="editorial-look-weather" id="editorialWeather" hidden></div><div class="editorial-look-bottom"><div><span id="editorialLookKicker">LOOK DEL GIORNO</span><h2>Smart Casual</h2></div><button type="button" class="editorial-look-next" aria-label="Apri il look consigliato">'+icon('arrow')+'</button></div></div><div class="editorial-dots" aria-hidden="true"><b></b><b></b><b></b><b></b></div>';
const head=q('.view-head',view);head?.after(card);
card.querySelector('button').addEventListener('click',()=>navigate('today'));
const update=()=>{const w=q('#editorialWeather');try{if(typeof weather!=='undefined'&&weather&&Number.isFinite(Number(weather.tmax))){w.hidden=false;w.innerHTML=icon('sun')+' '+Math.round(Number(weather.tmax))+'°C'}else w.hidden=true}catch{w.hidden=true}};
update();q('[data-editorial-tab="looks"],[data-tab="looks"]')?.addEventListener('click',update);
const seg=q('#v2LookSeg');if(seg){seg.addEventListener('click',e=>{const tab=e.target.closest('[data-lseg]');if(tab)card.hidden=tab.dataset.lseg==='inspo'})}
}
function initProfile(){
const view=q('#view-profile');if(!view||q('#editorialProfile'))return;
const section=el('section','editorial-profile');section.id='editorialProfile';
section.innerHTML='<div class="editorial-palette" id="editorialPalette"></div><div class="editorial-profile-list"><button type="button" data-profile-key="fit"><span class="editorial-row-symbol">♙</span><span><strong>Fit</strong><small id="editorialFit">Personalizza le preferenze</small></span>'+icon('chevron')+'</button><button type="button" data-profile-key="style"><span class="editorial-row-symbol">'+icon('hanger')+'</span><span><strong>Style</strong><small id="editorialStyle">Personalizza le preferenze</small></span>'+icon('chevron')+'</button><button type="button" data-profile-key="palette"><span class="editorial-row-symbol">◇</span><span><strong>Palette</strong><small id="editorialPaletteLabel">Colori del guardaroba</small></span>'+icon('chevron')+'</button><button type="button" data-profile-key="season"><span class="editorial-row-symbol">▦</span><span><strong>Stagioni</strong><small id="editorialSeasons">Dati dei tuoi capi</small></span>'+icon('chevron')+'</button></div><img class="editorial-profile-photo" src="/assets/prada/knit-bordeaux.webp" alt="Dettaglio fotografico di maglieria bordeaux" loading="lazy">';
q('.view-head',view)?.after(section);
section.querySelectorAll('[data-profile-key]').forEach(b=>b.addEventListener('click',()=>{const original=q('#profileBody');original?.scrollIntoView({behavior:'smooth',block:'start'})}));
refreshProfile();
}
async function refreshProfile(){
const p=q('#editorialProfile');if(!p)return;const gs=await garments();
const colors=['#202b3c','#632a34','#66664a','#d2bda3','#ede3d5'];
const palette=q('#editorialPalette');if(palette){palette.replaceChildren();colors.forEach(c=>{const s=el('span','editorial-swatch');s.style.backgroundColor=c;palette.append(s)});const add=el('button','editorial-add-swatch','+');add.type='button';add.setAttribute('aria-label','Modifica la palette');add.addEventListener('click',()=>q('#profileBody')?.scrollIntoView({behavior:'smooth'}));palette.append(add)}
const dominant=(field)=>{const counts=new Map();for(const g of gs){const v=String(g[field]||'').trim();if(v)counts.set(v,(counts.get(v)||0)+1)}return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join(', ')};
const fit=dominant('vestibilita'),season=dominant('stagione'),color=dominant('colore'),style=dominant('occasioni');
q('#editorialFit').textContent=fit||t('Da definire','Not set');q('#editorialStyle').textContent=style||t('Da definire','Not set');q('#editorialPaletteLabel').textContent=color||t('Da definire','Not set');q('#editorialSeasons').textContent=season||t('Da definire','Not set');
}
function initAnalysis(){
const view=q('#view-analysis');if(!view||q('#editorialAnalysis'))return;
const section=el('section','editorial-analysis');section.id='editorialAnalysis';
section.innerHTML='<div class="editorial-analysis-overview"><div class="editorial-ring" id="editorialRing"><div><strong id="editorialScore">—</strong><span>Completezza</span></div></div><div class="editorial-analysis-metrics"><div><span>Collezione</span><strong id="editorialTotal">—</strong></div><div><span>Con fotografia</span><strong id="editorialPhotos">—</strong></div><div><span>Stagione definita</span><strong id="editorialSeasonsCount">—</strong></div></div></div><div class="editorial-insights"><div><h2>Insights</h2><p id="editorialInsightText">Analisi della tua collezione.</p></div><img src="/assets/prada/nylon-jacket.webp" alt="" loading="lazy"></div><div class="editorial-purchase"><h2>Prossimo acquisto</h2><div><img src="/assets/prada/nylon-jacket.webp" alt="" loading="lazy"><p id="editorialPurchaseText">Valuta i capi che completano il tuo guardaroba.</p>'+icon('chevron')+'</div></div>';
q('#analysisTabs',view)?.before(section);
q('#analysisTabs',view)?.setAttribute('aria-label','Analisi dettagliate');
refreshAnalysis();
}
async function refreshAnalysis(){
if(!q('#editorialAnalysis'))return;
const gs=await garments(),total=gs.length;
const fields=['tipo','colore','stagione','materiale','vestibilita'];let completed=0;
for(const g of gs)for(const f of fields)if(String(g[f]||'').trim())completed++;
const pct=total?Math.round(completed/(total*fields.length)*100):0;
const photoCount=gs.filter(g=>{try{return typeof photoSrc==='function'&&!!photoSrc(g.id)}catch{return false}}).length;
const seasonCount=gs.filter(g=>String(g.stagione||'').trim()).length;
q('#editorialScore').textContent=total?pct+'%':'—';q('#editorialRing').style.setProperty('--score',total?pct:0);
q('#editorialTotal').textContent=String(total);q('#editorialPhotos').textContent=total?Math.round(photoCount/total*100)+'%':'—';q('#editorialSeasonsCount').textContent=total?Math.round(seasonCount/total*100)+'%':'—';
const coat=countCategory(gs,/cappott|giacc|blazer|capispall/),knit=countCategory(gs,/maglion|maglier|pullover/);
q('#editorialInsightText').textContent=!total?t('Aggiungi i tuoi capi per visualizzare informazioni reali sul guardaroba.','Add your garments to see real wardrobe insights.'):pct<75?t('Completa i dettagli dei capi per ricevere suggerimenti più precisi.','Complete item details for more accurate suggestions.'):t('La tua collezione è ben catalogata. Continua a monitorarne l’utilizzo.','Your collection is well catalogued. Keep tracking how you use it.');
q('#editorialPurchaseText').textContent=!total?t('Aggiungi prima i tuoi capi.','Add your garments first.'):coat===0?t('Un capospalla versatile può completare la collezione.','A versatile outerwear piece could complete your collection.'):knit===0?t('Valuta un capo di maglieria versatile.','Consider versatile knitwear.'):t('Esplora le opportunità nella sezione Insight.','Explore opportunities in the Insights tab.');
}
function initCalendar(){
const view=q('#view-week');if(!view||q('#editorialCalendar'))return;
const top=el('section','editorial-calendar-top');top.id='editorialCalendar';
const days=el('div','editorial-calendar-days');const today=new Date();
for(let i=-2;i<=2;i++){const date=new Date(today);date.setDate(today.getDate()+i);const b=el('button','editorial-day'+(i===0?' is-active':''));b.type='button';const label=date.toLocaleDateString('it-IT',{weekday:'short'}).replace('.','').toUpperCase();b.innerHTML='<small>'+label+'</small><strong>'+date.getDate()+'</strong>';b.addEventListener('click',()=>{days.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');const original=[...q('#weekList')?.querySelectorAll('.ios-day')||[]].find(x=>x.dataset.day===date.toISOString().slice(0,10));if(original){original.open=true;original.scrollIntoView({behavior:'smooth',block:'center'})}});days.append(b)}
top.append(days);const weatherCard=el('div','editorial-calendar-weather');weatherCard.innerHTML='<h2>Meteo di oggi</h2><div><span>'+icon('sun')+' <strong id="editorialCalendarTemp">—</strong></span><p id="editorialCalendarAdvice">Imposta la città per i consigli meteo.</p></div>';top.append(weatherCard);q('.view-head',view)?.after(top);
const update=()=>{try{if(typeof weather!=='undefined'&&weather){q('#editorialCalendarTemp').textContent=weather.tmin+'–'+weather.tmax+'°C';q('#editorialCalendarAdvice').textContent=weather.rain>=50?'Pioggia prevista: scegli capi adatti.':'Consulta i look suggeriti per la giornata.'}}catch{}};
update();q('[data-editorial-tab="week"]')?.addEventListener('click',update);
}
function start(){initLook();initProfile();initAnalysis();initCalendar();document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshAnalysis();refreshProfile()}});q('[data-editorial-tab="analysis"]')?.addEventListener('click',refreshAnalysis);q('#profileBtn')?.addEventListener('click',refreshProfile)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();