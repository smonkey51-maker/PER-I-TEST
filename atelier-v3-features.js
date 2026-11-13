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
    const inside=(x,y)=>x>=ox&&x<ox+iw&&y>=oy&&y<oy+ih;

    // 1) Modello del fondale: superficie quadratica per canale, adattata ai pixel del bordo (segue sfumature e vignettature)
    const nx=x=>(x-ox)/Math.max(iw-1,1)*2-1,ny=y=>(y-oy)/Math.max(ih-1,1)*2-1;
    const feat=(x,y)=>{const u=nx(x),v=ny(y);return [1,u,v,u*u,u*v,v*v];};
    const ring=[];
    const R=6;
    for(let y=oy;y<oy+ih;y+=2)for(let x=ox;x<ox+iw;x+=2){if(x-ox<R||ox+iw-1-x<R||y-oy<R||oy+ih-1-y<R)ring.push([x,y]);}
    if(ring.length<60)return null;
    const solve=(A,b)=>{const n=b.length;for(let i=0;i<n;i++){let m=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];if(Math.abs(A[i][i])<1e-9)return null;for(let r=i+1;r<n;r++){const f=A[r][i]/A[i][i];for(let k=i;k<n;k++)A[r][k]-=f*A[i][k];b[r]-=f*b[i];}}const x=new Array(n).fill(0);for(let i=n-1;i>=0;i--){let t=b[i];for(let k=i+1;k<n;k++)t-=A[i][k]*x[k];x[i]=t/A[i][i];}return x;};
    const fit=pts=>{const out=[];for(let ch=0;ch<3;ch++){const A=Array.from({length:6},()=>new Array(6).fill(0)),b=new Array(6).fill(0);for(const [x,y] of pts){const f=feat(x,y),v=data[(y*w+x)*4+ch];for(let r=0;r<6;r++){b[r]+=f[r]*v;for(let k=0;k<6;k++)A[r][k]+=f[r]*f[k];}}const sol=solve(A,b);if(!sol)return null;out.push(sol);}return out;};
    const model=(co,x,y)=>{const f=feat(x,y);return co.map(a=>a[0]*f[0]+a[1]*f[1]+a[2]*f[2]+a[3]*f[3]+a[4]*f[4]+a[5]*f[5]);};
    const dist=(x,y,co)=>{const m=model(co,x,y),i=(y*w+x)*4;return Math.sqrt((data[i]-m[0])**2+(data[i+1]-m[1])**2+(data[i+2]-m[2])**2);};
    let pts=ring,co=fit(pts);
    if(!co)return null;
    for(let it=0;it<2;it++){ // scarta i pixel del bordo che non sono sfondo (parte del capo, etichette) e riadatta
      const ds=pts.map(([x,y])=>dist(x,y,co)),sorted=[...ds].sort((a,b)=>a-b),med=sorted[Math.floor(sorted.length/2)];
      const keep=pts.filter((_,k)=>ds[k]<=Math.max(10,med*3));
      if(keep.length<60)return null;
      pts=keep;co=fit(pts);if(!co)return null;
    }
    const resid=pts.map(([x,y])=>dist(x,y,co)),rms=Math.sqrt(resid.reduce((a,v)=>a+v*v,0)/resid.length);
    if(rms>20)return null; // il bordo non è uno sfondo uniforme o sfumato: lascia l'originale
    const T=Math.min(34,Math.max(15,rms*3));

    // 2) Maschera del capo = pixel che si staccano dal fondale; alleggerita dal rumore
    let mask=new Uint8Array(w*h);
    for(let y=oy;y<oy+ih;y++)for(let x=ox;x<ox+iw;x++)if(dist(x,y,co)>T)mask[y*w+x]=1;
    const smooth=m=>{const out=new Uint8Array(w*h);for(let y=oy+2;y<oy+ih-2;y++)for(let x=ox+2;x<ox+iw-2;x++){let n=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)n+=m[(y+dy)*w+x+dx];out[y*w+x]=n>=13?1:0;}return out;};
    mask=smooth(mask);

    // 3) Componenti connesse: si tiene la più grande e quelle ≥10% (es. le due scarpe), si scartano le chiazze isolate
    const label=new Int32Array(w*h),areas=[0];let nl=0;
    const stack=new Int32Array(w*h);
    for(let y=oy;y<oy+ih;y++)for(let x=ox;x<ox+iw;x++){
      const p=y*w+x;if(!mask[p]||label[p])continue;
      nl++;let sp=0,area=0;stack[sp++]=p;label[p]=nl;
      while(sp){const q=stack[--sp];area++;const qx=q%w,qy=(q-qx)/w;
        if(qx>ox&&mask[q-1]&&!label[q-1]){label[q-1]=nl;stack[sp++]=q-1;}
        if(qx<ox+iw-1&&mask[q+1]&&!label[q+1]){label[q+1]=nl;stack[sp++]=q+1;}
        if(qy>oy&&mask[q-w]&&!label[q-w]){label[q-w]=nl;stack[sp++]=q-w;}
        if(qy<oy+ih-1&&mask[q+w]&&!label[q+w]){label[q+w]=nl;stack[sp++]=q+w;}}
      areas.push(area);
    }
    if(!nl)return null;
    const biggest=Math.max(...areas.slice(1));
    if(biggest<iw*ih*.04)return null;
    const keepLabel=areas.map((a,i)=>i>0&&a>=biggest*.1);
    const fg=new Uint8Array(w*h);
    for(let p=0;p<w*h;p++)if(label[p]&&keepLabel[label[p]])fg[p]=1;

    // 4) Buchi interni (tessuto simile allo sfondo) riempiti: tutto ciò che non è raggiungibile dal bordo è capo
    const reach=new Uint8Array(w*h);let sp=0;
    const seed=p=>{if(!fg[p]&&!reach[p]){reach[p]=1;stack[sp++]=p;}};
    for(let x=ox;x<ox+iw;x++){seed(oy*w+x);seed((oy+ih-1)*w+x);}
    for(let y=oy;y<oy+ih;y++){seed(y*w+ox);seed(y*w+ox+iw-1);}
    while(sp){const q=stack[--sp];const qx=q%w,qy=(q-qx)/w;
      if(qx>ox)seed(q-1);if(qx<ox+iw-1)seed(q+1);if(qy>oy)seed(q-w);if(qy<oy+ih-1)seed(q+w);}
    const solid=new Uint8Array(w*h);let count=0;
    for(let y=oy;y<oy+ih;y++)for(let x=ox;x<ox+iw;x++){const p=y*w+x;if(!reach[p]){solid[p]=1;count++;}}
    const fraction=count/(iw*ih);
    if(fraction<.05||fraction>.88)return null;
    // se il capo occupa quasi tutto il bordo il modello del fondale non regge: si lascia l'originale
    let edge=0,edgeN=0;for(const [x,y] of ring){edgeN++;if(solid[y*w+x])edge++;}
    if(edge/edgeN>.12)return null;

    // 5) Bordo morbido (1px erosione per togliere l'alone + sfumatura), fuori dal capo trasparente
    const eroded=new Uint8Array(w*h);
    for(let y=oy+1;y<oy+ih-1;y++)for(let x=ox+1;x<ox+iw-1;x++){const p=y*w+x;if(solid[p]&&solid[p-1]&&solid[p+1]&&solid[p-w]&&solid[p+w])eroded[p]=1;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=y*w+x;let a=0;
      if(inside(x,y)){let n=0,t=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=(y+dy)*w+x+dx;if(q>=0&&q<w*h){n+=eroded[q];t++;}}a=n/t;}
      data[p*4+3]=Math.round(255*(a>.99?1:a));
    }
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
  controls.innerHTML='<div class="v3-segments" role="group" aria-label="Disponibilità"><button data-availability="ready" aria-pressed="true">Disponibili</button><button data-availability="wash" aria-pressed="false">In lavatrice</button><button data-availability="fav" aria-pressed="false">Pezzi Iconici</button><button data-availability="all" aria-pressed="false">Tutti</button></div><button id="v3SortColor" aria-pressed="false">Per colore</button>';
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
    const pieceHtml=g=>'<button class="v3-piece'+(washing(g)?' is-washing':'')+(!washing(g)&&(idleDays(g)??0)>=IDLE_DAYS?' is-idle':'')+'" data-open="'+safe(g.id)+'"><span class="v3-stage">'+photoHtml(g.id,'v3-piece-img fade',g.tipo||'Capo')+'</span><strong>'+safe(g.tipo||'Capo')+'</strong><small>'+(washing(g)?careLabel(g):((g.indossato||[]).length&&daysSinceWorn(g)>=IDLE_DAYS?'Fermo da '+daysSinceWorn(g)+' giorni':(g.indossato||[]).length?(g.indossato.length===1?'Indossato 1 volta':'Indossato '+g.indossato.length+' volte'):'Mai indossato'))+'</small></button>';
    // Raggruppati per tipologia, ogni gruppo in una riga scorrevole
    const groups=CATS.filter(c=>list.some(g=>category(g)===c));
    $('#wardrobe').innerHTML=groups.map(c=>{const part=list.filter(g=>category(g)===c);return '<section class="min-group"><h3>'+safe(categoryLabels[c]||c)+' <span>'+part.length+'</span></h3><div class="v3-closet min-row">'+part.map(pieceHtml).join('')+'</div></section>';}).join('');
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
          await put({...entry,blob:converted,originalBlob:entry.blob,at:Date.now()},'photos');
          forgetPhoto(entry.id);count++;
        }catch{/* Leave original unchanged. */}
      }
      status.textContent=count?count+' foto scontornate. Gli originali sono conservati su questo dispositivo.':'Nessuna foto con sfondo uniforme da scontornare.';
      await renderAll();if(count)await window.atelierDriveSync?.();
    }catch(e){status.textContent='Scontorno non riuscito: '+e.message;}
    finally{button.disabled=false;}
  };
  // Automatico: una volta per foto, in silenzio; «Ripristina originali» annulla
  (async()=>{
    let tried;try{tried=new Set(JSON.parse(localStorage.getItem('atelier_cut_tried')||'[]'));}catch{tried=new Set();}
    await new Promise(r=>setTimeout(r,2500));
    // Versione dell'algoritmo: la precedente poteva cancellare parti di capi dal colore simile allo sfondo
    const CUT_VER='4';
    if(localStorage.getItem('atelier_cut_ver')!==CUT_VER){
      try{
        let back=0;
        for(const entry of await all('photos')){
          if(!entry.originalBlob)continue;
          await put({id:entry.id,blob:entry.originalBlob,at:Date.now()},'photos');forgetPhoto(entry.id);back++;
        }
        tried=new Set();
        localStorage.removeItem('atelier_cut_tried');localStorage.setItem('atelier_cut_ver',CUT_VER);
        if(back){await renderAll();window.atelierDriveSync?.();}
      }catch{/* si riprova al prossimo avvio */}
    }
    let changed=0;
    try{
      for(const entry of await all('photos')){
        if(!entry.blob||entry.originalBlob||tried.has(entry.id))continue;
        tried.add(entry.id);
        try{
          const converted=await cutout(entry.blob);
          if(!converted)continue;
          await put({...entry,blob:converted,originalBlob:entry.blob,at:Date.now()},'photos');
          forgetPhoto(entry.id);changed++;
        }catch{/* resta l'originale */}
      }
    }catch{/* facoltativo */}
    try{localStorage.setItem('atelier_cut_tried',JSON.stringify([...tried].slice(-500)));}catch{}
    if(changed){await renderAll();window.atelierDriveSync?.();}
  })();
  $('#v3RestorePhotos').onclick=async()=>{
    const status=$('#v3CutoutStatus');let count=0;
    for(const entry of await all('photos')){
      if(!entry.originalBlob)continue;
      await put({id:entry.id,blob:entry.originalBlob,at:Date.now()},'photos');forgetPhoto(entry.id);count++;
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
  modes.innerHTML='<button type="button" id="v3Photos"><b>Scatta o scegli foto</b><span>Fino a 40 fotografie · scontorno degli sfondi uniformi</span><i>→</i></button><button type="button" id="v3Link"><b>Importa da link</b><span>Da un negozio o da una foto online</span><i>→</i></button><button type="button" id="v3Manual"><b>Aggiungi manualmente</b><span>Inserisci i dati a mano</span><i>→</i></button><form id="v3LinkForm" hidden><label for="v3ProductUrl">Link del prodotto o di una fotografia</label><input type="url" id="v3ProductUrl" required placeholder="https://..."><button class="btn" type="submit">Importa</button><p id="v3LinkStatus" role="status"></p></form>';
  add.querySelector('.view-head')?.after(modes);
  $('#v3Photos').onclick=()=>$('#photos').click();
  $('#photos').addEventListener('change',()=>add.classList.toggle('has-photos',!!$('#photos').files?.length));
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
    liveWeather.innerHTML=weather?wxIcon(weather,'',true)+'<span>'+(weather.now??weather.tmax)+'°</span>':'';
    liveWeather.title=weather?(wxText(weather)+(city?' · '+city:'')):'';
    const garments=await all();
    const images=garments.filter(g=>photoSrc(g.id)).slice(0,3);
    addHero.innerHTML=images.map(g=>'<img src="'+photoSrc(g.id)+'" alt="'+safe(g.tipo||'Capo')+'">').join('');
    addHero.hidden=!images.length;
  }

  // Re-render UI after core renders, retaining core storage and calendar behavior.
  const coreRender=renderAll;
  let refreshPending=false,refreshAgain=false;
  renderAll=async function(){
    await coreRender();
    // A render that lands while another is refreshing must not leave the core markup on screen
    if(refreshPending){refreshAgain=true;return;}
    refreshPending=true;
    try{do{refreshAgain=false;await refreshWardrobe();await renderSwap();await refreshEditorial();await refreshLaundry();}while(refreshAgain);}finally{refreshPending=false;}
  };
  document.addEventListener('DOMContentLoaded',()=>renderAll().catch(console.error),{once:true});
})();
