/* ATELIER v3 functionality: actual wardrobe data, no demo fixtures. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const safe = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const category = g => catOf(g);
  const ready = g => !washing(g);
  let availability = 'ready';
  let sortColor = false;
  const categoryLabels = {'Maglieria':'Sopra','Camicie e T-shirt':'Camicie','Pantaloni e jeans':'Sotto','Giacche e capispalla':'Capispalla','Scarpe':'Scarpe','Accessori':'Accessori','Altro':'Altro'};
  const selected = {top:null,bottom:null,shoes:null};

  // Preserve existing photo pipeline, with optional local uniform-background removal.
  const originalPhoto = photo;
  const backgroundToggle = document.createElement('label');
  backgroundToggle.className='v3-option';
  backgroundToggle.innerHTML='<input type="checkbox" id="v3Cutout" checked> Scontorna sfondi uniformi sul dispositivo';
  $('#dropzone')?.after(backgroundToggle);

  function canvasBlob(canvas,type='image/png',quality) {
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Immagine non elaborabile')),type,quality));
  }
  async function cutout(file) {
    const src=URL.createObjectURL(file);
    let image;
    try {
      image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
    } finally {URL.revokeObjectURL(src);}
    const w=480,h=600,c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    const scale=Math.min(w/image.width,h/image.height),iw=Math.round(image.width*scale),ih=Math.round(image.height*scale);
    const ox=Math.floor((w-iw)/2),oy=Math.floor((h-ih)/2);
    ctx.drawImage(image,ox,oy,iw,ih);
    const frame=ctx.getImageData(0,0,w,h),data=frame.data;
    // Sample original image corners. Do not remove complex backgrounds or similar-coloured clothes.
    const sample=(x,y)=>{const i=(y*w+x)*4;return [data[i],data[i+1],data[i+2]];};
    const corners=[[ox+3,oy+3],[ox+iw-4,oy+3],[ox+3,oy+ih-4],[ox+iw-4,oy+ih-4]]
      .filter(([x,y])=>x>=0&&y>=0&&x<w&&y<h).map(([x,y])=>sample(x,y));
    if(corners.length<4)return null;
    const bg=[0,1,2].map(k=>corners.reduce((a,v)=>a+v[k],0)/4);
    const distance=(a,b)=>Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2);
    if(Math.max(...corners.map(p=>distance(p,bg)))>28)return null;
    const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    const enqueue=i=>{if(i<0||i>=w*h||seen[i])return;seen[i]=1;queue[tail++]=i;};
    for(let x=ox;x<ox+iw;x++){enqueue(oy*w+x);enqueue((oy+ih-1)*w+x);}
    for(let y=oy;y<oy+ih;y++){enqueue(y*w+ox);enqueue(y*w+ox+iw-1);}
    let removed=0;
    while(head<tail){
      const p=queue[head++],x=p%w,y=Math.floor(p/w),j=p*4;
      if(x<ox||x>=ox+iw||y<oy||y>=oy+ih)continue;
      const d=distance([data[j],data[j+1],data[j+2]],bg);
      if(d>37)continue;
      data[j+3]=0;removed++;
      if(x>ox)enqueue(p-1);if(x<ox+iw-1)enqueue(p+1);
      if(y>oy)enqueue(p-w);if(y<oy+ih-1)enqueue(p+w);
    }
    const fraction=removed/(iw*ih);
    // Reject overly aggressive masks and pictures with negligible background.
    if(fraction<.07||fraction>.76)return null;
    ctx.putImageData(frame,0,0);
    return canvasBlob(c);
  }
  photo = async function(file){
    if(!$('#v3Cutout')?.checked)return originalPhoto(file);
    try {return await cutout(file) || await originalPhoto(file);} catch {return originalPhoto(file);}
  };

  // Wardrobe filtering and meaningful use statistics.
  const wardrobe=$('#view-wardrobe');
  const controls=document.createElement('div');
  controls.className='v3-refine';
  controls.innerHTML='<div class="v3-segments" role="group" aria-label="Disponibilità"><button data-availability="ready" aria-pressed="true">Pronti</button><button data-availability="wash" aria-pressed="false">In lavatrice</button><button data-availability="fav" aria-pressed="false">Preferiti</button><button data-availability="all" aria-pressed="false">Tutti</button></div><button id="v3SortColor" aria-pressed="false">Per colore</button>';
  $('#chips')?.after(controls);
  const insights=document.createElement('div');
  insights.id='v3Insights';insights.className='v3-insights';
  $('#wardrobe')?.after(insights);
  controls.addEventListener('click',e=>{
    const b=e.target.closest('[data-availability]');
    if(b){availability=b.dataset.availability;controls.querySelectorAll('[data-availability]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refreshWardrobe();return;}
    if(e.target.closest('#v3SortColor')){sortColor=!sortColor;$('#v3SortColor').setAttribute('aria-pressed',String(sortColor));refreshWardrobe();}
  });
  async function refreshWardrobe(){
    const items=await all(),fav=items.filter(g=>g.preferito),present=CATS.filter(c=>items.some(g=>category(g)===c));
    $('#count').textContent=items.length;
    $('#empty').classList.toggle('hidden',!!items.length);
    const chosen=filter==='Preferiti'?'Tutti':filter;
    $('#chips').innerHTML=['Tutti',...present].map(c=>'<button class="chip" data-filter="'+safe(c)+'" aria-pressed="'+(c===chosen)+'">'+safe(c==='Tutti'?'Tutto':categoryLabels[c]||c)+' <sup>'+(c==='Tutti'?items.length:items.filter(g=>category(g)===c).length)+'</sup></button>').join('');
    let list=items.filter(g=>(chosen==='Tutti'||category(g)===chosen)&&(availability==='all'||(availability==='ready'&&ready(g))||(availability==='wash'&&!ready(g))||(availability==='fav'&&g.preferito)));
    if(sortColor)list.sort((a,b)=>String(a.colore||'').localeCompare(String(b.colore||''),'it'));
    $('#wardrobe').innerHTML='<div class="v3-closet">'+list.map(g=>'<button class="v3-piece'+(washing(g)?' is-washing':'')+'" data-open="'+safe(g.id)+'"><span class="v3-stage">'+photoHtml(g.id,'v3-piece-img fade',g.tipo||'Capo')+'</span><strong>'+safe(g.tipo||'Capo')+'</strong><small>'+(washing(g)?'In lavatrice':((g.indossato||[]).length?(g.indossato.length===1?'Indossato 1 volta':'Indossato '+g.indossato.length+' volte'):'Mai indossato'))+'</small></button>').join('')+'</div>';
    const never=items.filter(g=>!washing(g)&&(!(g.indossato||[]).length||daysSinceWorn(g)>90)).length;
    const costs=items.filter(g=>Number(g.prezzo)>0&&(g.indossato||[]).length).map(g=>Number(g.prezzo)/g.indossato.length);
    insights.innerHTML='<div><strong>'+never+'</strong><span>capi non indossati negli ultimi 90 giorni</span></div><div><strong>'+(costs.length?(costs.reduce((a,b)=>a+b,0)/costs.length).toLocaleString('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}):'—')+'</strong><span>costo per utilizzo'+(costs.length?' dei capi con prezzo registrato':' · aggiungi i prezzi per calcolarlo')+'</span></div>';
  }

  // One-time, reversible migration for existing non-transparent photos.
  const cutoutActions=document.createElement('div');cutoutActions.className='v3-photo-actions';
  cutoutActions.innerHTML='<button id="v3CutoutExisting" type="button">Scontorna foto esistenti</button><button id="v3RestorePhotos" type="button">Ripristina originali</button><p id="v3CutoutStatus" role="status"></p>';
  insights.after(cutoutActions);
  $('#v3CutoutExisting').onclick=async()=>{
    const button=$('#v3CutoutExisting'),status=$('#v3CutoutStatus');button.disabled=true;
    try{
      const photos=await all('photos');let count=0;
      for(let i=0;i<photos.length;i++){
        const entry=photos[i];if(!entry.blob||entry.originalBlob)continue;
        status.textContent='Scontorno '+(i+1)+' di '+photos.length+'…';
        try{
          const converted=await cutout(entry.blob);
          if(!converted)continue;
          await put({...entry,blob:converted,originalBlob:entry.blob},'photos');
          forgetPhoto(entry.id);count++;
        }catch{/* Leave original unchanged. */}
      }
      status.textContent=count?count+' foto scontornate. Gli originali sono conservati su questo dispositivo.':'Nessuna foto con sfondo uniforme da scontornare.';
      await renderAll();if(count)await window.atelierDriveSync?.();
    }catch(e){status.textContent='Scontorno non riuscito: '+e.message;}
    finally{button.disabled=false;}
  };
  $('#v3RestorePhotos').onclick=async()=>{
    const status=$('#v3CutoutStatus');let count=0;
    for(const entry of await all('photos')){
      if(!entry.originalBlob)continue;
      await put({id:entry.id,blob:entry.originalBlob},'photos');forgetPhoto(entry.id);count++;
    }
    status.textContent=count?count+' fotografie originali ripristinate.':'Non ci sono fotografie da ripristinare.';
    if(count){await renderAll();await window.atelierDriveSync?.();}
  };

  // Real outfit swapping: choose an available garment in the same category, preserve the rest.
  const swap=document.createElement('section');swap.id='v3Swap';swap.className='v3-swap';
  swap.innerHTML='<div class="v3-block-head"><h3>Cambia un pezzo</h3><span>Scorri</span></div><div id="v3SwapRows"></div>';
  $('#todayContent>.idea-card:first-child>.actions')?.after(swap);
  const groups=[
    {key:'top',name:'Sopra',cats:['Maglieria','Camicie e T-shirt']},
    {key:'bottom',name:'Sotto',cats:['Pantaloni e jeans']},
    {key:'shoes',name:'Scarpe',cats:['Scarpe']}
  ];
  async function renderSwap(){
    if(!idea?.ids||idea.missing){swap.hidden=true;return;}
    swap.hidden=false;
    const items=(await all()).filter(ready),map=new Map(items.map(g=>[g.id,g]));
    const current=idea.ids.map(id=>map.get(id)).filter(Boolean);
    $('#v3SwapRows').innerHTML=groups.map(group=>{
      const options=items.filter(g=>group.cats.includes(category(g)));
      const active=current.find(g=>group.cats.includes(category(g)))?.id;
      return '<div class="v3-swap-row"><span>'+group.name+'</span><div class="v3-swap-strip">'+options.map(g=>'<button data-swap-id="'+safe(g.id)+'" data-swap-group="'+group.key+'" aria-pressed="'+(active===g.id)+'" aria-label="'+safe(g.tipo||'Capo')+'">'+photoHtml(g.id,'v3-swap-img',g.tipo||'Capo')+'</button>').join('')+'</div></div>';
    }).join('');
  }
  $('#v3SwapRows').addEventListener('click',async e=>{
    const b=e.target.closest('[data-swap-id]');if(!b||!idea?.ids)return;
    const garments=await all(),byId=new Map(garments.map(g=>[g.id,g]));
    const group=groups.find(x=>x.key===b.dataset.swapGroup);if(!group)return;
    const old=idea.ids.find(id=>group.cats.includes(category(byId.get(id)||{})));
    if(old===b.dataset.swapId)return;
    if(old)idea.ids=idea.ids.map(id=>id===old?b.dataset.swapId:id);
    else idea.ids=[...idea.ids,b.dataset.swapId];
    idea.title=idea.ids.map(id=>byId.get(id)?.tipo||'Capo').join(', ');
    second=null;shownIdea='';
    await renderAll();
  });

  const laundryNote=document.createElement('div');
  laundryNote.id='v3LaundryNote';laundryNote.className='v3-laundry-note';
  swap.after(laundryNote);
  laundryNote.addEventListener('click',e=>{if(e.target.closest('button'))$('#washAll')?.click();});
  async function refreshLaundry(){
    const dirty=(await all()).filter(washing);
    laundryNote.hidden=!dirty.length;
    laundryNote.innerHTML=dirty.length?'<span>'+dirty.length+' capi in lavatrice, esclusi dai suggerimenti</span><button>Segna lavati</button>':'';
  }

  const inspiration=$('#inspoForm')?.closest('.manual');
  if(inspiration){const details=document.createElement('details');details.className='v3-inspiration';const summary=document.createElement('summary');summary.textContent='Ispirazione di stile';inspiration.before(details);details.append(summary,inspiration);}

  // Product link: import accessible direct images; fall back to a real editable draft.
  const add=$('#view-add');
  const modes=document.createElement('div');modes.className='v3-add-modes';
  modes.innerHTML='<button type="button" id="v3Photos"><b>Scegli le foto</b><span>Fino a 40 fotografie · scontorno degli sfondi uniformi</span><i>→</i></button><button type="button" id="v3Link"><b>Incolla un link</b><span>Importa un’immagine accessibile oppure compila i dati</span><i>→</i></button><button type="button" id="v3Manual"><b>Scrivi a mano</b><span>Per un capo senza fotografia</span><i>→</i></button><form id="v3LinkForm" hidden><label for="v3ProductUrl">Link del prodotto o di una fotografia</label><input type="url" id="v3ProductUrl" required placeholder="https://..."><button class="btn" type="submit">Importa</button><p id="v3LinkStatus" role="status"></p></form>';
  add.querySelector('.view-head')?.after(modes);
  $('#v3Photos').onclick=()=>$('#photos').click();
  $('#v3Manual').onclick=()=>$('#noPhoto').click();
  $('#v3Link').onclick=()=>{$('#v3LinkForm').hidden=!$('#v3LinkForm').hidden;if(!$('#v3LinkForm').hidden)$('#v3ProductUrl').focus();};
  $('#v3LinkForm').addEventListener('submit',async e=>{
    e.preventDefault();const input=$('#v3ProductUrl'),out=$('#v3LinkStatus');
    let url;try{url=new URL(input.value);if(!['https:','http:'].includes(url.protocol))throw Error();}catch{out.textContent='Inserisci un URL http o https valido.';return;}
    out.textContent='Leggo i dati del prodotto…';
    try{
      if(!window.atelierToken?.())throw Error('Accedi con Google per importare automaticamente dal negozio.');
      const response=await fetch('/api/product',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+window.atelierToken()},body:JSON.stringify({url:url.href})});
      const product=await response.json();
      if(!response.ok)throw Error(product.error||'Prodotto non accessibile');
      let file=null;
      if(product.imageData){
        const blob=await(await fetch(product.imageData)).blob();
        file=new File([blob],'prodotto.'+(blob.type.split('/')[1]||'png'),{type:blob.type});
      }
      if(file){
        const dt=new DataTransfer();dt.items.add(file);
        $('#photos').files=dt.files;$('#photos').dispatchEvent(new Event('change'));
        await prepare(false);
      }else $('#noPhoto').click();
      const draft=drafts.filter(Boolean).at(-1);
      if(draft){
        draft.tipo=(product.title||'Capo').slice(0,80);
        draft.marca=product.brand||'';
        draft.prezzo=product.price||'';
        draft.origine=url.href;
        draft.state='Importato dal negozio · verifica i dati';
        renderDrafts();updateSave();
      }
      out.textContent='Dati importati. Verifica la scheda e premi «Salva i capi».';
      $('#review').scrollIntoView({behavior:'smooth',block:'center'});
    }catch(error){
      $('#noPhoto').click();
      const draft=drafts.filter(Boolean).at(-1);
      if(draft){draft.tipo=(decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1)||'Capo').replace(/[-_]+/g,' ').replace(/\\.[^.]+$/,'').slice(0,70)||'Capo');draft.origine=url.href;renderDrafts();updateSave();}
      out.textContent=error.message+' Ho preparato una scheda manuale.';
    }
  });

  const coreDraftHtml=draftHtml;
  draftHtml=function(d,i){
    const base=coreDraftHtml(d,i);
    const fields='<label>Marca<input data-index="'+i+'" data-field="marca" value="'+safe(d.marca||'')+'" placeholder="Facoltativa"></label>'+
      '<label>Prezzo (€)<input type="number" min="0" step="0.01" data-index="'+i+'" data-field="prezzo" value="'+safe(d.prezzo||'')+'" placeholder="Facoltativo"></label>';
    return base.replace('</details></div></article>','</details>'+fields+'</div></article>');
  };

  // Persist optional product details without altering existing garment fields or sync schema.
  const originalPut=put;
  put=async function(item,store='garments'){
    if(store==='garments'&&item?.id){
      const draft=drafts.find(d=>d?.id===item.id);
      if(draft){item={...item,marca:draft.marca||'',prezzo:draft.prezzo||'',origine:draft.origine||''};}
    }
    return originalPut(item,store);
  };
  const originalDetail=openDetail;
  openDetail=async function(id){
    await originalDetail(id);
    const garment=(await all()).find(g=>g.id===id);
    if(!garment)return;
    const form=$('#editForm');
    const fields=$('#detailFields');
    const extra=document.createElement('div');extra.className='v3-detail-extras';
    extra.innerHTML='<label>Marca<input name="marca" value="'+safe(garment.marca||'')+'"></label><label>Prezzo (€)<input name="prezzo" type="number" min="0" step="0.01" value="'+safe(garment.prezzo||'')+'"></label>';
    form.querySelector('.actions')?.before(extra);
    for(const [label,value] of [['Marca',garment.marca],['Prezzo',garment.prezzo?garment.prezzo+' €':''],['Origine',garment.origine]]){
      if(!value)continue;
      const dt=document.createElement('dt');dt.textContent=label;
      const dd=document.createElement('dd');
      if(label==='Origine'){const a=document.createElement('a');a.href=value;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Apri il prodotto';dd.append(a);}
      else dd.textContent=value;
      fields.append(dt,dd);
    }
  };

  // Live header and add-page hero use actual weather and the user's own garments.
  const liveWeather=document.createElement('span');
  liveWeather.id='v3HeaderWeather';liveWeather.className='v3-header-weather';
  document.querySelector('.brand')?.after(liveWeather);
  const addHero=document.createElement('div');addHero.id='v3AddHero';
  add.querySelector('.view-head')?.after(addHero);
  async function refreshEditorial(){
    const city=place?.name||'';
    liveWeather.textContent=weather?(wxText(weather)+(city?' · '+city:'')):(city||'Imposta il meteo');
    const garments=await all();
    const images=garments.filter(g=>photoSrc(g.id)).slice(0,3);
    addHero.innerHTML=images.map(g=>'<img src="'+photoSrc(g.id)+'" alt="'+safe(g.tipo||'Capo')+'">').join('');
    addHero.hidden=!images.length;
  }

  // Re-render UI after core renders, retaining core storage and calendar behavior.
  const coreRender=renderAll;
  let refreshPending=false;
  renderAll=async function(){
    await coreRender();
    if(refreshPending)return;
    refreshPending=true;
    try{await refreshWardrobe();await renderSwap();await refreshEditorial();await refreshLaundry();}finally{refreshPending=false;}
  };
  document.addEventListener('DOMContentLoaded',()=>renderAll().catch(console.error),{once:true});
})();
