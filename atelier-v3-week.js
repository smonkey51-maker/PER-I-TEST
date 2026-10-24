/* Compact real-data weekly planner in the supplied mockup's visual language. */
(() => {
  const escV=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  renderWeek=function(byId){
    const source=[...plans.values()];
    let html='';
    if(!place)html+='<p class="small">Imposta la città nella sezione Oggi per includere il meteo.</p>';
    if(allEvents===null)html+='<p class="small">Collega Google Calendar per includere i tuoi impegni.</p>';
    html+=source.map(p=>{
      const date=new Date(p.key+'T12:00:00');
      const day=date.toLocaleDateString('it-IT',{weekday:'short'});
      const ids=p.outfit.missing?[]:p.outfit.ids.filter(id=>byId.has(id)&&!washing(byId.get(id)));
      const items=ids.map(id=>byId.get(id)).filter(Boolean);
      const title=p.outfit.missing?'Nessun outfit completo disponibile':items.map(g=>g.tipo||'Capo').slice(0,2).join(' e ');
      const images=items.slice(0,3).map(g=>photoSrc(g.id)?'<img src="'+photoSrc(g.id)+'" alt="'+escV(g.tipo||'Capo')+'">':'').join('');
      const dirty=items.filter(washing);
      const description=[p.wx?wxText(p.wx):null,firstEventLine(p)].filter(Boolean).join(' · ');
      return '<article class="v3-weekday"><div class="v3-date">'+date.getDate()+'<small>'+escV(day)+'</small></div><div class="v3-mini">'+images+'</div><div class="v3-week-info"><strong>'+escV(title)+'</strong><span>'+escV(description)+'</span>'+(dirty.length?'<span class="warn">'+dirty.length+' capi in lavatrice</span>':'')+'<button data-regen="'+escV(p.key)+'">Cambia outfit</button></div></article>';
    }).join('');
    $('#weekList').innerHTML=html;
  };
})();
