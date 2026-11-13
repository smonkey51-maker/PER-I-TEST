/* ATELIER 2.0 — Editorial Minimalism.
   Layer sopra la logica esistente: header con menu, Ispirazione (meteo, metadati, domani), Settimana a selettore,
   Guardaroba (filtri, dettaglio a schede), Look (filtri, incompleti), vista Analisi.
   Usa solo dati reali dell'app: niente cifre inventate, stati espliciti quando i dati mancano. */
(() => {
  'use strict';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const lang = () => (typeof appLang === 'function' ? appLang() : 'it');
  const en = () => lang() === 'en';
  const tr = (it, e) => (en() ? e : it);
  const nrm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const isKnown = v => (typeof known === 'function' ? known(v) : v);
  const thumb = (id, cls) => photoHtml(id, cls || 'v2-thumb', '');

  q('#wardAdd')?.addEventListener('click', () => showTab('add'));

  /* ---------- Ispirazione ---------- */
  function wxLine() {
    if (typeof weather === 'undefined' || !weather) return null;
    const rain = weather.rain >= 50 ? tr('Pioggia ', 'Rain ') + weather.rain + '%' : tr('Pioggia ', 'Rain ') + weather.rain + '%';
    return { ico: wxIcon(weather, 'v2-wx-ico'), text: weather.tmin + '–' + weather.tmax + '°C · ' + rain };
  }
  function ensureWeatherRow() {
    const greet = q('#view-today .greet');
    if (!greet) return;
    let row = q('#v2WxRow');
    if (!row) { row = document.createElement('p'); row.id = 'v2WxRow'; row.className = 'v2-wxrow'; q('h1', greet).after(row); }
    const w = wxLine();
    row.innerHTML = w ? w.ico + '<span>' + esc(w.text) + '</span>'
      : '<span>' + esc(tr('Meteo non disponibile · imposta la città nel Profilo', 'Weather unavailable · set your city in Profile')) + '</span>';
  }

  async function decorateIdea() {
    const idea = q('#idea');
    if (!idea || !q('h3', idea) || q('.v2-meta', idea)) return;
    const strip = q('.strip', idea);
    const ids = qa('figure img, figure .ph', strip || idea).length;
    if (!strip || !ids) return;
    let items = [];
    try {
      const gs = await all();
      const byId = new Map(gs.map(g => [g.id, g]));
      items = (window.__v2LastIdeaIds || []).map(id => byId.get(id)).filter(Boolean);
    } catch { /* senza metadati */ }
    const names = items.map(g => (g.tipo || '').toLowerCase()).filter(Boolean);
    const sentence = names.length ? cap(names.length > 1 ? names.slice(0, -1).join(', ') + tr(' e ', ' and ') + names[names.length - 1] : names[0]) + '.' : '';
    const h = q('h3', idea);
    h.textContent = tr('Il look consigliato', 'Your recommended look');
    const meta = document.createElement('p');
    meta.className = 'v2-meta'; meta.textContent = sentence;
    h.after(meta);
    const why = document.createElement('p');
    why.id = 'v2Reason'; why.className = 'v2-why';
    meta.after(why);
    reasonFor().then(t => { why.textContent = t; }).catch(() => {});
  }

  new MutationObserver(() => {
    const strip = q('#idea .strip');
    if (!strip) return;
    window.__v2LastIdeaIds = currentIdeaIds();
    decorateIdea();
    try { ensureStylist(); } catch { /* facoltativo */ }
  }).observe(q('#idea') || document.body, { childList: true });

  function currentIdeaIds() {
    try { if (typeof idea !== 'undefined' && idea && Array.isArray(idea.ids) && !idea.missing) return idea.ids; } catch { /* non disponibile */ }
    return [];
  }

  document.addEventListener('click', async e => {
    if (!e.target.closest('#v2Save')) return;
    const ids = currentIdeaIds();
    if (!ids.length) { toast(tr('Nessun look da salvare', 'No look to save')); return; }
    try {
      const gs = await all(), byId = new Map(gs.map(g => [g.id, g]));
      const looks = await all('looks');
      const key = [...ids].sort().join(',');
      if (looks.some(l => [...(l.capi || [])].sort().join(',') === key)) { toast(tr('È già nei tuoi Look', 'Already in your Looks')); return; }
      const nome = q('#idea h3')?.textContent || tr('Look di oggi', "Today's look");
      await put({ id: 'look-' + Date.now(), nome, composizione: ids.map(id => byId.get(id)?.tipo).filter(Boolean).join(' · '), capi: ids, createdAt: Date.now() }, 'looks');
      toast(tr('Salvato nei Look', 'Saved to Looks'));
      renderAll?.();
    } catch { toast(tr('Salvataggio non riuscito', 'Could not save')); }
  });

  /* In programma (domani) e Da rivedere: solo se hanno contenuto */
  async function ensureTomorrow() {
    const card = q('#todayContent > .idea-card:first-child');
    if (!card) return;
    let up = q('#v2Upcoming'), rev = q('#v2Review');
    if (!up) { up = document.createElement('section'); up.id = 'v2Upcoming'; up.className = 'v2-sec'; card.after(up); }
    if (!rev) { rev = document.createElement('section'); rev.id = 'v2Review'; rev.className = 'v2-sec'; up.after(rev); }
    const p = typeof plans !== 'undefined' ? plans.get(dayKey(1)) : null;
    const has = p && (p.wx || (allEvents !== null && p.events.length) || isConfirmed(p));
    if (!has) up.innerHTML = '';
    else {
      const ids = p.outfit.missing ? [] : p.outfit.ids;
      const parts = [p.wx ? p.wx.tmin + '–' + p.wx.tmax + '°C' : '', allEvents === null ? '' : firstEventLine(p), isConfirmed(p) ? tr('Confermato', 'Confirmed') : ''].filter(Boolean);
      up.innerHTML = '<h3>' + esc(tr('In programma', 'Coming up')) + '</h3><button type="button" class="v2-tomorrow" data-go-week><span class="v2-tm-thumbs">' + ids.slice(0, 3).map(id => thumb(id)).join('') + '</span>' +
        '<span class="v2-tm-text"><strong>' + esc(tr('Domani', 'Tomorrow')) + '</strong><small>' + esc(parts.join(' · ')) + '</small></span><i class="v2-chev" aria-hidden="true"></i></button>';
    }
    try {
      const gs = await all();
      const old = gs.filter(g => !washing(g)).map(g => ({ g, d: daysSinceWorn(g) })).filter(x => x.d != null && x.d >= 30).sort((a, b) => b.d - a.d).slice(0, 6);
      rev.innerHTML = old.length ? '<h3>' + esc(tr('Da rivedere', 'Worth a second look')) + '</h3><div class="v2-review">' + old.map(({ g, d }) => '<button type="button" data-open="' + esc(g.id) + '" aria-label="' + esc((g.tipo || '') + ', ' + tr('fermo da ' + d + ' giorni', 'idle for ' + d + ' days')) + '"><span>' + thumb(g.id, 'v2-hero-img') + '</span><small>' + esc(tr(d + ' giorni', d + ' days')) + '</small></button>').join('') + '</div>' : '';
    } catch { rev.innerHTML = ''; }
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-go-week]')) showTab('week'); });

  /* ---------- Settimana: selettore dei giorni ---------- */
  let selDay = null;
  const CONF_KEY = 'atelier_plan_confirmed';
  const readConf = () => { try { return JSON.parse(localStorage.getItem(CONF_KEY) || '{}'); } catch { return {}; } };
  const writeConf = o => { try { localStorage.setItem(CONF_KEY, JSON.stringify(o)); } catch { /* storage non disponibile */ } };
  const sameIds = (a, b) => a && b && [...a].sort().join(',') === [...b].sort().join(',');
  const isConfirmed = p => !p.outfit.missing && sameIds(readConf()[p.key], p.outfit.ids);
  const dayInfo = key => {
    const d = new Date(key + 'T12:00:00'), loc = appLocale();
    return {
      wd: d.toLocaleDateString(loc, { weekday: 'short' }).replace('.', ''),
      long: d.toLocaleDateString(loc, { weekday: 'long' }),
      n: d.getDate(),
      short: d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }).replace('.', '')
    };
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function rowThumbs(p, byId, max) {
    const ids = p.outfit.missing ? [] : p.outfit.ids;
    return ids.slice(0, max).map(id => thumb(id)).join('');
  }
  function dayStatus(p, byId) {
    if (p.outfit.missing) return tr('Nessun outfit completo disponibile', 'No complete outfit available');
    const dirty = p.outfit.ids.map(id => byId.get(id)).filter(g => g && washing(g));
    return dirty.length ? tr('In lavatrice: ', 'In the wash: ') + dirty.map(g => (g.tipo || '').toLowerCase()).join(', ') : tr('Capi disponibili', 'Items available');
  }
  const eventText = p => (allEvents === null ? tr('Calendario non collegato', 'Calendar not connected') : firstEventLine(p));
  const wxShort = p => (p.wx ? p.wx.tmin + '–' + p.wx.tmax + '°C' : tr('Meteo non disponibile', 'Weather unavailable'));

  renderWeek = function (byId) {
    const list = [...plans.values()];
    const box = q('#weekList');
    if (!list.length) { box.innerHTML = ''; return; }
    if (!selDay || !plans.has(selDay)) selDay = list[0].key;
    const sel = plans.get(selDay), d0 = new Date(selDay + 'T12:00:00');
    const range = q('#weekRange'); if (range) range.textContent = cap(d0.toLocaleDateString(appLocale(), { month: 'long', year: 'numeric' }));
    const ids = sel.outfit.missing ? [] : sel.outfit.ids;
    const conf = isConfirmed(sel);
    let html = '';
    if (allEvents === null) html += '<p class="v2-note">' + esc(tr('Calendario non collegato: gli impegni non sono inclusi. Collega Google dal Profilo.', 'Calendar not connected: events are not included. Connect Google from Profile.')) + '</p>';
    html += '<div class="v2-cal" role="tablist" aria-label="' + esc(tr('Giorni', 'Days')) + '">' + list.map(p => {
      const d = new Date(p.key + 'T12:00:00');
      const dot = (allEvents !== null && p.events.length) || isConfirmed(p);
      return '<button type="button" role="tab" class="v2-calday' + (p.key === selDay ? ' is-sel' : '') + '" data-day="' + esc(p.key) + '" aria-selected="' + (p.key === selDay) + '"><small>' + esc(d.toLocaleDateString(appLocale(), { weekday: 'narrow' }).toUpperCase()) + '</small><b>' + d.getDate() + '</b><i class="' + (dot ? 'on' : '') + '" aria-hidden="true"></i></button>';
    }).join('') + '</div>';
    html += '<h2 class="v2-daytitle">' + esc((selDay === list[0].key ? tr('Oggi', 'Today') + ' · ' : '') + cap(d0.toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' }))) + '</h2>';
    html += '<section class="v2-agenda">' +
      '<p class="v2-aw">' + (sel.wx ? wxIcon(sel.wx, 'v2-wx-ico') + '<span>' + esc(wxText(sel.wx)) + '</span>' : '<span>' + esc(tr('Meteo non disponibile', 'Weather unavailable')) + '</span>') + '</p>' +
      (allEvents === null ? '' : sel.events.length
        ? '<ul class="v2-events">' + sel.events.map(ev => '<li><strong>' + esc(ev.title) + '</strong><small>' + esc(ev.allDay ? tr('Tutto il giorno', 'All day') : eventTime(ev)) + '</small></li>').join('') + '</ul>'
        : '<p class="v2-sub">' + esc(tr('Nessun impegno', 'No events')) + '</p>') +
      '</section>';
    html += '<h3 class="v2-h3">' + esc(tr('Look suggerito', 'Suggested look')) + '</h3>';
    html += '<div class="v2-suggest">' + (ids.length ? ids.slice(0, 4).map((id, i) => '<button type="button" class="v2-swap" data-swap="' + esc(sel.key) + '" data-i="' + i + '" aria-label="' + esc(tr('Sostituisci ', 'Swap ') + (byId.get(id)?.tipo || '')) + '">' + thumb(id, 'v2-hero-img') + '</button>').join('') : '<p class="v2-empty">' + esc(tr('Nessun look disponibile per questo giorno.', 'No look available for this day.')) + '</p>') + '</div>';
    if (ids.length) html += '<p class="v2-sub">' + esc(ids.map(id => byId.get(id)?.tipo).filter(Boolean).slice(0, 4).join(' · ')) + '</p><p class="v2-state ' + (conf ? 'is-conf' : '') + '">' + esc(conf ? tr('✓ Outfit confermato', '✓ Outfit confirmed') : tr('Suggerimento · tocca un capo per sostituirlo', 'Suggestion · tap an item to swap it')) + '</p>';
    if (ids.length) html += '<button type="button" class="btn v2-wide' + (conf ? ' secondary' : '') + '" data-conf="' + esc(sel.key) + '">' + esc(conf ? tr('Annulla conferma', 'Undo confirm') : tr("Aggiungi all'agenda", 'Add to agenda')) + '</button>';
    html += '<button type="button" class="v2-textbtn" data-regen="' + esc(sel.key) + '">' + esc(tr('Cambia look', 'Change look')) + '</button>';
    box.innerHTML = html;
  };

  async function swapItem(key, i) {
    const gs = await all(), byId = new Map(gs.map(g => [g.id, g]));
    const p = plans.get(key);
    const cur = p && byId.get(p.outfit.ids[i]);
    if (!cur) return;
    const used = new Set(p.outfit.ids), rainy = (p.wx?.rain || 0) >= 50;
    const alts = gs.filter(g => !washing(g) && !used.has(g.id) && catOf(g) === catOf(cur) && !(rainy && typeof delicateShoe === 'function' && delicateShoe(g)));
    if (!alts.length) { toast(tr('Nessun altro capo disponibile per sostituirlo', 'No other available item to swap in')); return; }
    const next = alts[Math.floor(Math.random() * alts.length)];
    p.outfit.ids = p.outfit.ids.map((id, k) => (k === i ? next.id : id));
    renderWeek(new Map(gs.map(g => [g.id, g])));
    toast(tr('Sostituito: ', 'Swapped: ') + (next.tipo || ''));
  }
  document.addEventListener('click', e => {
    const sw = e.target.closest('[data-swap]');
    if (sw) { swapItem(sw.dataset.swap, +sw.dataset.i); return; }
    const cf = e.target.closest('[data-conf]');
    if (cf) {
      const p = plans.get(cf.dataset.conf), conf = readConf();
      if (p) { isConfirmed(p) ? delete conf[p.key] : (conf[p.key] = [...p.outfit.ids]); writeConf(conf); all().then(gs => renderWeek(new Map(gs.map(g => [g.id, g]))));
        toast(isConfirmed(p) ? tr('Outfit confermato', 'Outfit confirmed') : tr('Conferma annullata', 'Confirmation undone')); }
      return;
    }
    const d = e.target.closest('#weekList [data-day]');
    if (d) { selDay = d.dataset.day; renderAll?.(); return; }
  });

  // Aggiorna Ispirazione e Settimana quando i piani cambiano
  const basePlans = typeof renderPlans === 'function' ? renderPlans : null;
  if (basePlans) {
    renderPlans = function (g) { const r = basePlans.call(this, g); try { ensureWeatherRow(); ensureTomorrow(); } catch { /* facoltativo */ } return r; };
  }
  new MutationObserver(() => { try { ensureWeatherRow(); } catch { /* facoltativo */ } }).observe(q('#view-today'), { childList: true, subtree: false });

  /* ---------- Guardaroba: filtri ---------- */
  const filters = { colors: new Set(), seasons: new Set() };
  let gIndex = new Map();
  async function reindex() {
    try { gIndex = new Map((await all()).map(g => [g.id, g])); } catch { /* vuoto */ }
  }
  window.__v2Filter = id => {
    const g = gIndex.get(id);
    if (!g) return true;
    if (filters.colors.size && !filters.colors.has(nrm(g.colore))) return false;
    if (filters.seasons.size) {
      const s = nrm(g.stagione);
      if (![...filters.seasons].some(x => s.includes(x) || s.includes('tutto') || s.includes('all'))) return false;
    }
    return true;
  };
  window.__v2FilterOn = () => filters.colors.size + filters.seasons.size > 0;
  window.__v2Search = (id, qy) => {
    const g = gIndex.get(id);
    if (!g) return true;
    const hay = nrm([g.tipo, g.colore, g.materiale, g.texture, g.stagione, g.occasioni, g.vestibilita, catOf(g)].filter(Boolean).join(' '));
    return qy.split(/\s+/).every(w => hay.includes(w));
  };

  document.addEventListener('click', async e => {
    if (!e.target.closest('#v2FilterBtn')) return;
    await reindex(); renderFilterSheet(); dlg.showModal();
  });

  /* Pannello filtri (colore, stagione) */
  const dlg = document.createElement('dialog');
  dlg.id = 'v2Filter'; dlg.className = 'v2-sheet'; dlg.setAttribute('aria-labelledby', 'v2FilterTitle');
  document.body.append(dlg);
  function renderFilterSheet() {
    const colors = [...new Set([...gIndex.values()].map(g => isKnown(g.colore) ? nrm(g.colore) : '').filter(Boolean))];
    const seasons = [['primavera', 'Primavera', 'Spring'], ['estate', 'Estate', 'Summer'], ['autunno', 'Autunno', 'Autumn'], ['inverno', 'Inverno', 'Winter']];
    dlg.innerHTML = '<div class="v2-sheet-body"><h2 id="v2FilterTitle">' + esc(tr('Filtri', 'Filters')) + '</h2>' +
      '<h3>' + esc(tr('Colore', 'Colour')) + '</h3><div class="v2-chips">' + (colors.length ? colors.map(c => '<button type="button" class="chip" data-fc="' + esc(c) + '" aria-pressed="' + filters.colors.has(c) + '">' + esc(c) + '</button>').join('') : '<span class="v2-empty">' + esc(tr('Nessun colore registrato', 'No colours recorded')) + '</span>') + '</div>' +
      '<h3>' + esc(tr('Stagione', 'Season')) + '</h3><div class="v2-chips">' + seasons.map(([k, it, e]) => '<button type="button" class="chip" data-fs="' + k + '" aria-pressed="' + filters.seasons.has(k) + '">' + esc(tr(it, e)) + '</button>').join('') + '</div>' +
      '<div class="v2-actions"><button type="button" class="btn secondary" id="v2FReset">' + esc(tr('Azzera', 'Reset')) + '</button><button type="button" class="btn" id="v2FApply">' + esc(tr('Applica', 'Apply')) + '</button></div></div>';
  }
  dlg.addEventListener('click', e => {
    const c = e.target.closest('[data-fc]'), s = e.target.closest('[data-fs]');
    if (c) { const k = c.dataset.fc; filters.colors.has(k) ? filters.colors.delete(k) : filters.colors.add(k); c.setAttribute('aria-pressed', String(filters.colors.has(k))); }
    if (s) { const k = s.dataset.fs; filters.seasons.has(k) ? filters.seasons.delete(k) : filters.seasons.add(k); s.setAttribute('aria-pressed', String(filters.seasons.has(k))); }
    if (e.target.closest('#v2FReset')) { filters.colors.clear(); filters.seasons.clear(); renderFilterSheet(); }
    if (e.target.closest('#v2FApply') || e.target === dlg) { dlg.close(); syncFilterBadge(); window.__v2Refresh?.(); }
  });
  function syncFilterBadge() { q('#v2FilterBtn')?.classList.toggle('is-on', filters.colors.size + filters.seasons.size > 0); }

  /* ---------- Look: incompleti e filtri ---------- */
  const TOP = /Maglieria|Camicie/, BOTTOM = /Pantaloni/, SHOE = /Scarpe/;
  const lookState = { casual: false, formal: false, ready: false };
  async function classifyLooks() {
    let looks = [], gs = [];
    try { looks = await all('looks'); gs = await all(); } catch { return; }
    const byId = new Map(gs.map(g => [g.id, g]));
    const info = new Map();
    looks.forEach(l => {
      const items = (l.capi || []).map(id => byId.get(id)).filter(Boolean);
      const cats = items.map(g => catOf(g));
      const missing = [];
      if (items.length) {
        if (!cats.some(c => TOP.test(c))) missing.push(tr('capo sopra', 'top'));
        if (!cats.some(c => BOTTOM.test(c))) missing.push(tr('pantaloni', 'trousers'));
        if (!cats.some(c => SHOE.test(c))) missing.push(tr('scarpe', 'shoes'));
      }
      const sober = items.filter(g => garmentStyle(g) === 'sobrio').length;
      info.set(l.id, { missing, formal: items.length > 0 && sober * 2 >= items.length, ready: items.length > 0 && items.every(g => !washing(g)), n: items.length });
    });
    window.__v2LookInfo = info;
    qa('#looks .look').forEach(el => {
      const id = el.querySelector('[data-look-fav]')?.dataset.lookFav;
      const i = info.get(id);
      q('.v2-incomplete', el)?.remove(); q('.v2-count', el)?.remove();
      if (i) { const c = document.createElement('span'); c.className = 'v2-count'; c.textContent = i.n + ' ' + tr(i.n === 1 ? 'capo' : 'capi', i.n === 1 ? 'item' : 'items'); q('h3', el)?.after(c); }
      if (i && i.missing.length) {
        const b = document.createElement('span');
        b.className = 'v2-incomplete';
        b.textContent = tr('Incompleto', 'Incomplete') + ' · ' + tr('manca: ', 'missing: ') + i.missing.join(', ');
        el.append(b);
      }
      if (id && !q('.v2-lookactions', el)) {
        const a = document.createElement('div');
        a.className = 'v2-lookactions';
        a.innerHTML = '<button type="button" class="btn" data-lk-wear="' + esc(id) + '">' + esc(tr('Indossa', 'Wear')) + '</button><button type="button" class="btn secondary" data-lk-dup="' + esc(id) + '">' + esc(tr('Duplica', 'Duplicate')) + '</button>';
        el.append(a);
      }
      el.dataset.kind = i ? (i.formal ? 'formal' : 'casual') : '';
      el.dataset.ready = i?.ready ? '1' : '';
    });
    applyLookFilters();
  }
  function applyLookFilters() {
    qa('#looks .look').forEach(el => {
      let hide = el.classList.contains('hidden-by-base');
      if (lookState.casual && el.dataset.kind !== 'casual') hide = true;
      if (lookState.formal && el.dataset.kind !== 'formal') hide = true;
      if (lookState.ready && !el.dataset.ready) hide = true;
      el.classList.toggle('v2-hide', hide);
    });
  }
  const lookChips = q('#view-looks .chips');
  if (lookChips && !q('#v2LookChips')) {
    lookChips.id = 'v2LookChips';
    lookChips.insertAdjacentHTML('beforeend',
      '<button type="button" class="chip" data-lk="casual" aria-pressed="false">Casual</button>' +
      '<button type="button" class="chip" data-lk="formal" aria-pressed="false">' + tr('Formale', 'Formal') + '</button>' +
      '<button type="button" class="chip" data-lk="ready" aria-pressed="false">' + tr('Disponibili', 'Available') + '</button>');
    lookChips.addEventListener('click', e => {
      const b = e.target.closest('[data-lk]');
      if (!b) return;
      const k = b.dataset.lk, on = b.getAttribute('aria-pressed') !== 'true';
      if (k === 'casual' && on) { lookState.formal = false; q('[data-lk=formal]').setAttribute('aria-pressed', 'false'); }
      if (k === 'formal' && on) { lookState.casual = false; q('[data-lk=casual]').setAttribute('aria-pressed', 'false'); }
      lookState[k] = on; b.setAttribute('aria-pressed', String(on));
      applyLookFilters();
    });
  }
  // dopo i filtri di base (ricerca, preferiti)
  q('#lookSearch')?.addEventListener('input', () => setTimeout(applyLookFilters, 0));
  q('#lookFavFilter')?.addEventListener('click', () => setTimeout(applyLookFilters, 0));
  const baseFilterLooks = typeof filterLooks === 'function' ? filterLooks : null;
  if (baseFilterLooks) {
    filterLooks = function (...a) { const r = baseFilterLooks.apply(this, a); qa('#looks .look').forEach(el => el.classList.toggle('hidden-by-base', el.classList.contains('hidden'))); applyLookFilters(); return r; };
  }
  new MutationObserver(() => classifyLooks()).observe(q('#looks'), { childList: true });

  /* ---------- Dettaglio capo a schede ---------- */
  const detail = q('#detail');
  async function enhanceDetail() {
    if (!detail?.open) return;
    q('#v2DetailTabs', detail)?.remove(); q('#v2DetailPanels', detail)?.remove();
    const body = q('.dialog-body', detail);
    const id = typeof detailId !== 'undefined' ? detailId : null;
    if (!body || !id) return;
    await reindex();
    const g = gIndex.get(id);
    if (!g) return;
    if (!q('.v2-back', detail)) {
      const back = document.createElement('button');
      back.type = 'button'; back.className = 'v2-back'; back.setAttribute('aria-label', tr('Indietro', 'Back'));
      back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
      back.addEventListener('click', () => q('#detailClose')?.click());
      detail.prepend(back);
    }
    const tabs = document.createElement('div');
    tabs.id = 'v2DetailTabs'; tabs.className = 'v2-seg'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = ['det:Dettagli:Details', 'match:Abbinamenti:Matches', 'use:Utilizzo:Usage'].map((t, i) => { const [k, it, e] = t.split(':'); return '<button type="button" role="tab" data-dt="' + k + '" aria-selected="' + (i === 0) + '">' + esc(tr(it, e)) + '</button>'; }).join('');
    const panels = document.createElement('div');
    panels.id = 'v2DetailPanels';
    const looks = (await all('looks')).filter(l => (l.capi || []).includes(id));
    const worn = (g.indossato || []).slice().sort().reverse();
    panels.innerHTML = '<div data-dp="match" hidden>' + (looks.length
      ? looks.map(l => '<div class="v2-linkrow"><span class="v2-row-thumbs">' + (l.capi || []).slice(0, 3).map(x => thumb(x)).join('') + '</span><strong>' + esc(l.nome) + '</strong></div>').join('')
      : '<p class="v2-empty">' + esc(tr('Questo capo non è ancora in nessun look.', 'This item is not in any look yet.')) + '</p>') + '</div>' +
      '<div data-dp="use" hidden><p class="v2-stat"><b>' + worn.length + '</b> ' + esc(tr(worn.length === 1 ? 'utilizzo registrato' : 'utilizzi registrati', worn.length === 1 ? 'recorded use' : 'recorded uses')) + '</p>' +
      (worn.length ? '<ul class="v2-list">' + worn.slice(0, 10).map(d => '<li>' + esc(new Date(d + 'T12:00:00').toLocaleDateString(appLocale(), { day: 'numeric', month: 'long', year: 'numeric' })) + '</li>').join('') + '</ul>' : '<p class="v2-empty">' + esc(tr('Nessun utilizzo registrato.', 'No recorded use.')) + '</p>') + '</div>';
    q('#detailFields', body).before(tabs);
    q('#detailFields', body).after(panels);
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[data-dt]'); if (!b) return;
      qa('[data-dt]', tabs).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      q('#detailFields', body).hidden = b.dataset.dt !== 'det';
      qa('[data-dp]', panels).forEach(p => { p.hidden = p.dataset.dp !== b.dataset.dt; });
    });
  }
  if (detail) new MutationObserver(() => { if (detail.open) setTimeout(enhanceDetail, 30); }).observe(detail, { attributes: true, attributeFilter: ['open'] });

  /* ---------- Analisi ---------- */
  let anTab = 'use';
  let anDays = 30;
  const DAY = 86400000;
  const within = (d, days) => (Date.now() - new Date(d + 'T12:00:00').getTime()) <= days * DAY;
  const wearCount = (g, days) => (g.indossato || []).filter(d => !days || within(d, days)).length;
  async function renderAnalysis() {
    const body = q('#analysisBody');
    if (!body) return;
    let gs = [];
    try { gs = await all(); } catch { body.innerHTML = '<p class="v2-empty">' + esc(tr('Impossibile leggere i dati.', 'Could not read the data.')) + ' <button class="btn secondary" id="anRetry">' + esc(tr('Riprova', 'Retry')) + '</button></p>'; return; }
    if (!gs.length) { body.innerHTML = '<div class="v2-emptystate"><h2>' + esc(tr('Ancora nessun dato', 'No data yet')) + '</h2><p>' + esc(tr('Aggiungi qualche capo e registra cosa indossi: qui compariranno utilizzo, colori e stagioni.', 'Add some items and log what you wear: usage, colours and seasons will show here.')) + '</p><button class="btn" data-menu-add>' + esc(tr('Aggiungi un capo', 'Add an item')) + '</button></div>'; return; }
    const total = gs.length;
    const anyWear = gs.some(g => (g.indossato || []).length);
    const from = new Date(Date.now() - anDays * DAY).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' }), to = new Date().toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' });
    let html = '<div class="v2-period"><span>' + esc(tr('Periodo analizzato: ', 'Period analysed: ') + from + ' – ' + to) + '</span><select id="anDays" aria-label="' + esc(tr('Periodo', 'Period')) + '"><option value="30"' + (anDays === 30 ? ' selected' : '') + '>' + esc(tr('30 giorni', '30 days')) + '</option><option value="90"' + (anDays === 90 ? ' selected' : '') + '>' + esc(tr('90 giorni', '90 days')) + '</option></select></div>';
    if (anTab === 'use') {
      const used = gs.filter(g => wearCount(g, anDays) > 0).length;
      const idle = total - used;
      const pct = Math.round(used / total * 100);
      const C = 2 * Math.PI * 46;
      html += '<div class="v2-usage"><div class="v2-donut" role="img" aria-label="' + esc(anyWear ? tr('Utilizzo capi: ' + pct + '%', 'Item usage: ' + pct + '%') : tr('Dati insufficienti', 'Insufficient data')) + '"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" class="v2-ring"/>' +
        (anyWear ? '<circle cx="55" cy="55" r="46" class="v2-ring-on" stroke-dasharray="' + (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 55 55)"/>' : '') + '</svg>' +
        '<div class="v2-donut-t">' + (anyWear ? '<b>' + pct + '%</b><small>' + esc(tr('Utilizzo capi', 'Item usage')) + '</small>' : '<b>—</b><small>' + esc(tr('Dati insufficienti', 'Insufficient data')) + '</small>') + '</div></div>' +
        '<ul class="v2-stats"><li><b>' + total + '</b><span>' + esc(tr('Capi totali', 'Total items')) + '</span></li>' +
        '<li><b>' + (anyWear ? used : '—') + '</b><span>' + esc(tr('Usati negli ultimi ' + anDays + ' giorni', 'Worn in the last ' + anDays + ' days')) + '</span></li>' +
        '<li><b>' + (anyWear ? idle : '—') + '</b><span>' + esc(tr('Poco utilizzati', 'Rarely used')) + '</span></li></ul></div>';
      html += '<p class="v2-foot">' + esc(anyWear ? tr(used + ' capi su ' + total + ' indossati negli ultimi ' + anDays + ' giorni, dagli utilizzi registrati con «Indosso questo».', used + ' of ' + total + ' items worn in the last ' + anDays + ' days, from uses logged with “Wear this”.') : tr('Registra cosa indossi con «Indosso questo»: servono dati per calcolare l’utilizzo.', 'Log what you wear with “Wear this”: data is needed to compute usage.')) + '</p>';
      const top = gs.filter(g => (g.indossato || []).length).sort((a, b) => (b.indossato.length) - (a.indossato.length)).slice(0, 3);
      html += '<section class="v2-block"><h2>' + esc(tr('I più indossati', 'Most worn')) + '</h2>' + (top.length
        ? '<div class="v2-top">' + top.map(g => '<button type="button" data-open="' + esc(g.id) + '"><span class="v2-top-img">' + thumb(g.id, 'v2-hero-img') + '</span><small>' + esc(g.tipo || '') + ' · ' + g.indossato.length + '×</small></button>').join('') + '</div>'
        : '<p class="v2-empty">' + esc(tr('Nessun utilizzo registrato.', 'No recorded use.')) + '</p>') + '</section>';
      html += '<button type="button" class="btn v2-wide" data-an-go="insight">' + esc(tr('Suggerimenti personalizzati', 'Personalised suggestions')) + '</button>';
    } else if (anTab === 'colors' || anTab === 'seasons') {
      const counts = new Map();
      if (anTab === 'colors') gs.forEach(g => { const c = isKnown(g.colore) ? nrm(g.colore) : ''; counts.set(c || '?', (counts.get(c || '?') || 0) + 1); });
      else {
        const S = [['primavera', 'Primavera', 'Spring'], ['estate', 'Estate', 'Summer'], ['autunno', 'Autunno', 'Autumn'], ['inverno', 'Inverno', 'Winter']];
        S.forEach(([k, it, e]) => counts.set(tr(it, e), gs.filter(g => { const s = nrm(g.stagione); return s.includes(k) || s.includes('tutto') || s.includes('all'); }).length));
        const unk = gs.filter(g => !isKnown(g.stagione)).length; if (unk) counts.set(tr('Non indicata', 'Not specified'), unk);
      }
      const max = Math.max(...counts.values(), 1);
      html += '<ul class="v2-bars">' + [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => '<li><span>' + esc(k === '?' ? tr('Non indicato', 'Not specified') : k) + '</span><i style="--w:' + (n / max * 100).toFixed(0) + '%"></i><b>' + n + '</b></li>').join('') + '</ul>' +
        '<p class="v2-foot">' + esc(tr('Conteggio dei capi per ' + (anTab === 'colors' ? 'colore' : 'stagione') + ', dai dati dei capi.', 'Item count by ' + (anTab === 'colors' ? 'colour' : 'season') + ', from the item data.')) + '</p>';
    } else {
      const items = [];
      gs.filter(g => !washing(g)).forEach(g => {
        const d = daysSinceWorn(g);
        if (d != null && d >= anDays) items.push({ g, why: tr('Non lo indossi da ' + d + ' giorni.', 'Not worn for ' + d + ' days.') });
      });
      const never = anyWear ? gs.filter(g => !(g.indossato || []).length && !washing(g)) : [];
      never.slice(0, 5).forEach(g => items.push({ g, why: tr('Nessun utilizzo registrato.', 'No recorded use.') }));
      html += '<section class="v2-block"><h2>' + esc(tr('Capi da riscoprire', 'Items to rediscover')) + '</h2>' + (items.length
        ? '<ul class="v2-insights">' + items.slice(0, 8).map(({ g, why }) => '<li><button type="button" data-open="' + esc(g.id) + '"><span class="v2-row-thumbs">' + thumb(g.id) + '</span><span><strong>' + esc(g.tipo || '') + '</strong><small>' + esc(why) + '</small></span></button></li>').join('') + '</ul>'
        : '<p class="v2-empty">' + esc(anyWear ? tr('Nessun capo sottoutilizzato: ottimo.', 'No underused items: great.') : tr('Dati insufficienti: registra gli utilizzi per vedere i capi da riscoprire.', 'Insufficient data: log your wears to see items to rediscover.')) + '</p>') + '</section>';
      let gaps = [];
      try { gaps = typeof wardrobeGaps === 'function' && total >= 3 ? wardrobeGaps(gs) : []; } catch { gaps = []; }
      html += '<section class="v2-block"><h2>' + esc(tr('Come ampliare le combinazioni', 'Ways to expand your outfits')) + '</h2>' + (total < 3
        ? '<p class="v2-empty">' + esc(tr('Servono almeno tre capi per valutare le combinazioni.', 'At least three items are needed to assess combinations.')) + '</p>'
        : gaps.length ? '<ul class="v2-list">' + gaps.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + '<p class="v2-foot">' + esc(tr('Indicazioni dai tuoi abbinamenti attuali, non un invito ad acquistare.', 'Based on your current pairings, not a nudge to buy.')) + '</p>'
          : '<p class="v2-empty">' + esc(tr('Il guardaroba è ben bilanciato per il tuo stile.', 'Your wardrobe is well balanced for your style.')) + '</p>') + '</section>';
    }
    body.innerHTML = html;
  }
  q('#analysisTabs')?.addEventListener('click', e => {
    const b = e.target.closest('[data-an]'); if (!b) return;
    anTab = b.dataset.an;
    qa('#analysisTabs [data-an]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderAnalysis();
  });
  document.addEventListener('change', e => { if (e.target.id === 'anDays') { anDays = +e.target.value; renderAnalysis(); } });
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-an-go]');
    if (go) { anTab = go.dataset.anGo; qa('#analysisTabs [data-an]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.an === anTab))); renderAnalysis(); }
    if (e.target.closest('[data-menu-add]')) showTab('add');
    if (e.target.closest('#anRetry')) renderAnalysis();
  });
  const baseShow = showTab;
  showTab = function (name) {
    baseShow(name);
    if (name === 'analysis') renderAnalysis();
    setTimeout(syncTabs, 90);
    if (name === 'wardrobe') { reindex().then(() => window.__v2Refresh?.()); }
  };
  document.addEventListener('atelier:languagechange', () => { renderAnalysis(); ensureWeatherRow(); });

  function syncTabs() {
    const open = ['today', 'week', 'wardrobe', 'looks', 'analysis', 'profile', 'diary', 'add'].find(v => !q('#view-' + v)?.classList.contains('hidden') && getComputedStyle(q('#view-' + v)).display !== 'none');
    const group = { add: 'wardrobe', analysis: '', profile: '', diary: '' }[open] ?? open;
    qa('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === group)));
  }
  setTimeout(syncTabs, 200);

  /* ---------- Stylist contestuale (Ispirazione) ---------- */
  async function reasonFor() {
    const ids = currentIdeaIds();
    if (!ids.length) return '';
    const gs = await all(), byId = new Map(gs.map(g => [g.id, g]));
    const items = ids.map(id => byId.get(id)).filter(Boolean);
    const parts = [];
    const w = typeof weather !== 'undefined' ? weather : null;
    parts.push(w ? tr('Adatto a ', 'Suited to ') + w.tmin + '–' + w.tmax + ' °C' : tr('Meteo non disponibile: scelto in base a stagione e disponibilità', 'Weather unavailable: chosen by season and availability'));
    if (w && w.rain >= 50) {
      const outer = items.find(g => catOf(g) === 'Giacche e capispalla');
      const shoe = items.find(g => catOf(g) === 'Scarpe');
      if (outer) parts.push(tr('capospalla incluso', 'outerwear included'));
      else if (!gs.some(g => catOf(g) === 'Giacche e capispalla' && !washing(g))) parts.push(tr('consiglio: aggiungi un capospalla impermeabile (non è nel tuo guardaroba)', 'tip: add a waterproof jacket (not in your wardrobe)'));
      if (shoe) parts.push(typeof delicateShoe === 'function' && delicateShoe(shoe) ? tr('attenzione: scarpe delicate con la pioggia', 'note: delicate shoes in the rain') : tr('scarpe adatte alla pioggia', 'shoes suitable for rain'));
    }
    parts.push(tr('solo capi disponibili', 'available items only'));
    return parts.join('; ') + '.';
  }
  async function ensureStylist() {
    const why = q('#v2Reason');
    if (why) why.textContent = await reasonFor();
  }
  async function restyle(kind) {
    if (typeof idea === 'undefined' || !idea || idea.missing) return;
    const gs = await all(), byId = new Map(gs.map(g => [g.id, g]));
    const rainy = typeof wxNow !== 'undefined' && wxNow?.rainy;
    const ok = g => !washing(g) && !(rainy && typeof delicateShoe === 'function' && delicateShoe(g));
    const ids = [...idea.ids];
    let changed = 0;
    const swapCat = (re, pred) => {
      ids.forEach((id, i) => {
        const cur = byId.get(id);
        if (!cur || !re.test(catOf(cur)) || pred.keep?.(cur)) return;
        const alts = gs.filter(g => ok(g) && !ids.includes(g.id) && catOf(g) === catOf(cur) && pred.want(g));
        if (alts.length) { ids[i] = alts[Math.floor(Math.random() * alts.length)].id; changed++; }
      });
    };
    if (kind === 'shoes') swapCat(/Scarpe/, { want: () => true });
    if (kind === 'formal') swapCat(/Maglieria|Camicie|Pantaloni|Scarpe/, { keep: g => garmentStyle(g) === 'sobrio', want: g => garmentStyle(g) === 'sobrio' });
    if (kind === 'casual') swapCat(/Maglieria|Camicie|Pantaloni|Scarpe/, { keep: g => garmentStyle(g) !== 'sobrio', want: g => garmentStyle(g) !== 'sobrio' });
    if (!changed) { toast(kind === 'shoes' ? tr('Non hai altre scarpe disponibili', 'No other shoes available') : tr('Non hai altri capi disponibili in quello stile', 'No other available items in that style')); return; }
    idea.ids = ids; second = null;
    await renderAll();
    toast(tr('Look aggiornato', 'Look updated'));
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) restyle(b.dataset.st); });

  /* ---------- Look: indossa e duplica ---------- */
  document.addEventListener('click', async e => {
    const w = e.target.closest('[data-lk-wear]'), d = e.target.closest('[data-lk-dup]');
    if (!w && !d) return;
    const id = (w || d).dataset.lkWear || (w || d).dataset.lkDup;
    const looks = await all('looks'), look = looks.find(l => l.id === id);
    if (!look) return;
    if (d) { await put({ ...look, id: 'look-' + Date.now(), nome: look.nome + tr(' (copia)', ' (copy)'), preferito: false, createdAt: Date.now() }, 'looks'); toast(tr('Look duplicato', 'Look duplicated')); renderAll?.(); return; }
    const gs = await all(), byId = new Map(gs.map(g => [g.id, g]));
    const items = (look.capi || []).map(x => byId.get(x)).filter(Boolean);
    const dirty = items.filter(washing);
    if (!items.length) { toast(tr('Questo look non ha capi nel guardaroba', 'This look has no wardrobe items')); return; }
    if (dirty.length) { toast(tr('In lavatrice: ', 'In the wash: ') + dirty.map(g => g.tipo).join(', ')); return; }
    const today = todayStr();
    for (const g of items) if (!(g.indossato || []).includes(today)) await put({ ...g, indossato: [...(g.indossato || []), today].slice(-60) });
    toast(tr('Look indossato oggi', 'Look worn today'));
    renderAll?.();
  });

  reindex();
  setTimeout(() => { try { ensureWeatherRow(); ensureTomorrow(); classifyLooks(); } catch { /* facoltativo */ } }, 1500);
})();
