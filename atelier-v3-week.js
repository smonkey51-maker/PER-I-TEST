/* Weekly planner as compact rows: day, outfit thumbnails, weather; tap a row for details. */
(() => {
  const escV=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const openDays=new Set();
  renderWeek=function(byId){
    const source=[...plans.values()];
    let html='';
    if(!place)html+='<p class="small">Imposta la città nella sezione Oggi per includere il meteo.</p>';
    if(allEvents===null)html+='<p class="small">Collega Google Calendar per includere i tuoi impegni.</p>';
    if(plansRepeat)html+='<p class="small">Con i capi lavati di adesso non ci sono abbastanza combinazioni diverse per tutti i giorni: alcuni outfit si ripetono. Aggiungi capi o segna come lavati quelli in lavatrice.</p>';
    html+='<div class="ios-week">'+source.map(p=>{
      const date=new Date(p.key+'T12:00:00');
      const day=date.toLocaleDateString(appLocale(),{weekday:'short'}).replace('.','');
      const short=date.toLocaleDateString(appLocale(),{day:'numeric',month:'short'}).replace('.','');
      const toItems=list=>list.map(id=>byId.get(id)).filter(Boolean);
      const items=p.outfit.missing?[]:toItems(p.outfit.ids);
      const afterItems=!p.outfit.missing&&p.after&&!p.after.same?toItems(p.after.ids):[];
      const dirtyNames=[...new Set([...items,...afterItems])].filter(washing).map(g=>(g.tipo||'Capo').toLowerCase());
      const title=p.outfit.missing?'Nessun outfit completo disponibile':items.map(g=>g.tipo||'Capo').slice(0,2).join(appLang()==='en'?' and ':' e ');
      const thumb=g=>(photoSrc(g.id)||illusSrc(g.id))?'<img src="'+(photoSrc(g.id)||illusSrc(g.id))+'" alt=""'+(washing(g)?' style="opacity:.45"':'')+'>':'<i aria-hidden="true"></i>';
      const thumbs=items.slice(0,4).map(thumb).join('');
      const names=list=>list.map(g=>(g.tipo||'Capo').toLowerCase()).join(', ');
      const rv=p.revived&&byId.get(p.revived.id);
      const revivedBlock=rv?'<span class="ios-after">'+escV((appLang()==='en'?'Dusting off: ':'Rispolvero: ')+(rv.tipo||'Capo').toLowerCase()+(appLang()==='en'?', idle for ':', fermo da ')+p.revived.days+(appLang()==='en'?' days':' giorni'))+'</span>':'';
      const afterBlock=afterItems.length?'<span class="ios-after"><strong>'+(appLang()==='en'?'After work':'Dopo il lavoro')+'</strong> '+escV(names(afterItems))+'</span>':'';
      const description=[p.wx?wxText(p.wx):null,firstEventLine(p)].filter(Boolean).join(' · ');
      return '<details class="ios-day" data-day="'+escV(p.key)+'"'+(openDays.has(p.key)?' open':'')+'><summary>'+
        '<span class="ios-day-name"><strong>'+escV(day.charAt(0).toUpperCase()+day.slice(1))+'</strong><small>'+escV(short)+'</small></span>'+
        '<span class="ios-day-thumbs">'+thumbs+'</span>'+(p.wx?wxIcon(p.wx,'ios-day-wx'):'')+'<span class="ios-chev" aria-hidden="true"></span></summary>'+
        '<div class="ios-day-body"><strong>'+escV(title)+'</strong><span>'+escV(description)+'</span>'+afterBlock+revivedBlock+(dirtyNames.length?'<span class="warn">'+(appLang()==='en'?'In the wash: ':'In lavatrice: ')+escV(dirtyNames.join(', '))+'</span>':'')+
        '<button class="btn secondary" data-regen="'+escV(p.key)+'">Cambia outfit</button></div></details>';
    }).join('')+'</div>';
    $('#weekList').innerHTML=html;
  };
  // Open days stay open when the list is redrawn
  $('#weekList').addEventListener('toggle',e=>{
    const d=e.target.closest?.('.ios-day');
    if(d)d.open?openDays.add(d.dataset.day):openDays.delete(d.dataset.day);
  },true);
})();
