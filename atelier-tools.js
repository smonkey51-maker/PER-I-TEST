/* ATELIER — mobile utilities; local-only calculations, no new permissions. */
(() => {
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
 const button=(text,fn)=>{const b=el('button','btn secondary',text);b.type='button';b.onclick=fn;return b};
 const modal=(title)=>{const d=el('dialog','atelier-tool-dialog');d.append(el('h2','',title));document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();return d};
 const close=d=>d.append(button('Chiudi',()=>d.close()));
 const garments=async()=>typeof all==='function'?await all():[];
 const worn=g=>Array.isArray(g.indossato)?g.indossato.length:0;
 const label=g=>(g.tipo||'Capo')+(g.colore?' · '+g.colore:'');
 const image=(g)=>{const src=typeof photoSrc==='function'?photoSrc(g.id):'';if(!src)return el('span','atelier-mini-empty','ATELIER');const img=el('img');img.src=src;img.alt='';img.loading='lazy';return img};
 const tile=(g,action)=>{const b=el('button','atelier-tool-tile');b.type='button';b.append(image(g),el('span','',label(g)));b.onclick=action;return b};
 function renderStats(items){
   const root=document.querySelector('#atelierStats');if(!root)return;
   const total=items.length, used=items.filter(g=>worn(g)>0).length, uses=items.reduce((n,g)=>n+worn(g),0);
   root.replaceChildren();
   for(const [value,desc] of [[total,'Capi'],[used,'Indossati almeno una volta'],[uses,'Utilizzi registrati']]){
     const cell=el('div','atelier-stat');cell.append(el('strong','',String(value)),el('span','',desc));root.append(cell);
   }
   const least=items.filter(g=>!washing(g)).sort((a,b)=>worn(a)-worn(b)).slice(0,3);
   if(least.length){const p=el('p','small','Da riscoprire: '+least.map(g=>g.tipo||'Capo').join(', '));root.append(p)}
 }
 async function statsDialog(){
   const items=await garments(),d=modal('Il tuo guardaroba in numeri');
   const summary=el('div','atelier-stats');d.append(summary);const original=document.querySelector('#atelierStats');
   if(original){const clone=original.cloneNode(true);clone.removeAttribute('id');summary.replaceWith(clone)}
   d.append(el('h3','','I più indossati'));
   const top=items.filter(g=>worn(g)>0).sort((a,b)=>worn(b)-worn(a)).slice(0,5);
   const list=el('div','atelier-tool-grid');top.forEach(g=>list.append(tile(g,()=>{d.close();openDetail(g.id)})));
   if(!top.length)list.append(el('p','small','Le statistiche appariranno dopo i primi utilizzi registrati.'));
   d.append(list);close(d);
 }
 async function packing(){
   const d=modal('Prepara la valigia');
   d.append(el('p','small','Crea una selezione di capi per un viaggio. Il calcolo resta sul dispositivo.'));
   const line=el('div','atelier-tool-form');const days=el('input');days.type='number';days.min='1';days.max='21';days.value='4';days.setAttribute('aria-label','Giorni di viaggio');
   const title=el('label','','Giorni di viaggio');title.append(days);line.append(title);d.append(line);
   const result=el('div','atelier-tool-grid');d.append(result);
   d.append(button('Componi valigia',async()=>{
     const items=(await garments()).filter(g=>!washing(g));const n=Math.max(1,Math.min(21,Number(days.value)||4));
     const categories=typeof CATS!=='undefined'?CATS:[];
     const limits=[Math.min(n+1,7),Math.min(n+1,7),Math.min(n,4),2,2,2,1];
     const selected=[];categories.forEach((cat,i)=>{const matches=items.filter(g=>catOf(g)===cat).sort((a,b)=>worn(a)-worn(b));selected.push(...matches.slice(0,limits[i]||1))});
     result.replaceChildren();selected.forEach(g=>result.append(tile(g,()=>openDetail(g.id))));
     if(!selected.length)result.append(el('p','small','Aggiungi capi puliti al guardaroba per creare la valigia.'));
     const count=el('p','small',selected.length+' capi suggeriti · '+n+' giorni. Controlla meteo e occasioni della destinazione.');result.prepend(count);
   }));close(d);
 }
 function advice(g,other){
   const notes=[];if(g.colore&&other.colore&&g.colore.toLowerCase()===other.colore.toLowerCase())notes.push('colori coordinati');
   if(g.stagione&&other.stagione&&g.stagione.toLowerCase()===other.stagione.toLowerCase())notes.push('stagione coerente');
   if(g.stile&&other.stile&&g.stile===other.stile)notes.push('stile coerente');
   return notes;
 }
 async function outfitAssessment(){
   const d=modal('Analisi del look');const items=await garments();const ids=typeof idea!=='undefined'&&idea?.ids||[];
   const chosen=ids.map(id=>items.find(g=>g.id===id)).filter(Boolean);
   if(!chosen.length)d.append(el('p','small','Genera prima un outfit nella schermata Oggi.'));
   else{
     const grid=el('div','atelier-tool-grid');chosen.forEach(g=>grid.append(tile(g,()=>openDetail(g.id))));d.append(grid);
     const observations=[];for(let i=0;i<chosen.length;i++)for(let j=i+1;j<chosen.length;j++)observations.push(...advice(chosen[i],chosen[j]));
     const unique=[...new Set(observations)];
     d.append(el('p','',unique.length?'Elementi coerenti: '+unique.join(', ')+'.':'Combinazione possibile. Per una valutazione precisa servono dati su colori, materiali e occasioni.'));
     d.append(el('p','small','Valutazione indicativa basata sulle schede dei capi, non su analisi visiva AI.'));
   }close(d);
 }
 function install(){
   const home=document.querySelector('#view-today'),wardrobe=document.querySelector('#view-wardrobe');if(!home||!wardrobe)return;
   const card=el('section','atelier-utilities idea-card');card.append(el('h2','','Il tuo atelier'));
   const controls=el('div','atelier-tool-actions');
   controls.append(button('Analizza il look',outfitAssessment),button('Prepara la valigia',packing),button('Statistiche',statsDialog));
   card.append(controls);const content=document.querySelector('#todayContent');content?.append(card);
   const stats=el('div','atelier-stats');stats.id='atelierStats';wardrobe.append(stats);
   let busy=false;
   const update=async()=>{if(busy)return;busy=true;try{renderStats(await garments())}finally{busy=false}};
   update();const wardrobeList=document.querySelector('#wardrobe');
   if(wardrobeList)new MutationObserver(update).observe(wardrobeList,{childList:true});
   const stage=document.querySelector('#atelierStage');
   if(stage){
     const windowPane=el('div','atelier-weather-window');windowPane.setAttribute('aria-hidden','true');windowPane.append(el('div','atelier-weather-orb'),el('div','atelier-weather-cloud'));stage.prepend(windowPane);
     const syncWeather=()=>{const wx=typeof weather!=='undefined'?weather:null;stage.dataset.sky=!wx?'neutral':wx.rain>=50?'rain':wx.tmax<=12?'cold':'sun';const h=new Date().getHours();stage.dataset.light=h<7||h>=20?'night':h<11?'morning':h<17?'day':'evening'};
     syncWeather();const info=document.querySelector('#weatherInfo');if(info)new MutationObserver(syncWeather).observe(info,{childList:true});
     document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncWeather()});
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
