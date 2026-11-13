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

  /* ---------- Header: menu ---------- */
  const menu = q('#v2Menu'), menuBtn = q('#menuBtn');
  function closeMenu() { menu.classList.add('hidden'); menuBtn?.setAttribute('aria-expanded', 'false'); }
  menuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.classList.toggle('hidden') === false;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => { if (!e.target.closest('#v2Menu, #menuBtn')) closeMenu(); });
  menu?.addEventListener('click', e => {
    const b = e.target.closest('[data-menu]');
    if (!b) return;
    closeMenu();
    showTab(b.dataset.menu);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
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
    const n = items.length || qa('figure', strip).length;
    let style = '';
    if (items.length) {
      const c = {};
      items.forEach(g => { const s = STYLES[garmentStyle(g)]; c[s] = (c[s] || 0) + 1; });
      style = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
    }
    const meta = document.createElement('p');
    meta.className = 'v2-meta';
    meta.textContent = [style, n + ' ' + tr(n === 1 ? 'capo' : 'capi', n === 1 ? 'item' : 'items'), tr('Dal tuo guardaroba', 'From your wardrobe')].filter(Boolean).join(' · ');
    q('h3', idea).after(meta);
    if (items.length && !q('#v2Save')) {
      const b = document.createElement('button');
      b.id = 'v2Save'; b.type = 'button'; b.className = 'v2-save';
      b.setAttribute('aria-label', tr('Salva nei Look', 'Save to Looks'));
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/></svg>';
      idea.append(b);
    }
  }
  // Ricorda gli id dell'outfit mostrato (usati per metadati e salvataggio)
  new MutationObserver(() => {
    const strip = q('#idea .strip');
    if (!strip) return;
    window.__v2LastIdeaIds = currentIdeaIds();
    decorateIdea();
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

  /* Domani: una riga compatta che apre la Settimana */
  function ensureTomorrow() {
    const card = q('#todayContent > .idea-card:first-child');
    if (!card) return;
    let row = q('#v2Tomorrow');
    if (!row) { row = document.createElement('button'); row.id = 'v2Tomorrow'; row.type = 'button'; row.className = 'v2-tomorrow'; card.after(row); row.addEventListener('click', () => showTab('week')); }
    const p = typeof plans !== 'undefined' ? plans.get(dayKey(1)) : null;
    if (!p) { row.classList.add('hidden'); return; }
    row.classList.remove('hidden');
    const ids = p.outfit.missing ? [] : p.outfit.ids;
    const parts = [p.wx ? p.wx.tmin + '–' + p.wx.tmax + '°C' : tr('Meteo non disponibile', 'Weather unavailable'),
      allEvents === null ? tr('Calendario non collegato', 'Calendar not connected') : firstEventLine(p)];
    row.innerHTML = '<span class="v2-tm-thumbs">' + ids.slice(0, 3).map(id => thumb(id)).join('') + '</span>' +
      '<span class="v2-tm-text"><strong>' + esc(tr('Domani', 'Tomorrow')) + '</strong><small>' + esc(parts.join(' · ')) + '</small></span><i class="v2-chev" aria-hidden="true"></i>';
  }

  /* ---------- Settimana: selettore dei giorni ---------- */
  let selDay = null;
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
    const first = dayInfo(list[0].key), last = dayInfo(list[list.length - 1].key);
    const range = q('#weekRange'); if (range) range.textContent = first.n + ' – ' + last.n + ' ' + new Date(list[list.length - 1].key + 'T12:00:00').toLocaleDateString(appLocale(), { month: 'long' });
    const sel = plans.get(selDay), si = dayInfo(selDay);
    let html = '';
    if (allEvents === null) html += '<p class="v2-note">' + esc(tr('Calendario non collegato: gli impegni non sono inclusi. Collega Google dal Profilo.', 'Calendar not connected: events are not included. Connect Google from Profile.')) + '</p>';
    if (!place) html += '<p class="v2-note">' + esc(tr('Meteo non disponibile: imposta la città nel Profilo.', 'Weather unavailable: set your city in Profile.')) + '</p>';
    if (plansRepeat) html += '<p class="v2-note">' + esc(tr('Con i capi disponibili alcuni outfit si ripetono.', 'With the available items some outfits repeat.')) + '</p>';
    html += '<div class="v2-days" role="tablist" aria-label="' + esc(tr('Giorni', 'Days')) + '">' + list.map((p, i) => {
      const d = dayInfo(p.key);
      return '<button type="button" role="tab" class="v2-day' + (p.key === selDay ? ' is-sel' : '') + (i === 0 ? ' is-today' : '') + '" data-day="' + esc(p.key) + '" aria-selected="' + (p.key === selDay) + '"><small>' + esc(cap(d.wd)) + '</small><b>' + d.n + '</b></button>';
    }).join('') + '</div>';
    // giorno selezionato: look grande, meteo, impegno e azioni
    const ids = sel.outfit.missing ? [] : sel.outfit.ids;
    const names = ids.map(id => byId.get(id)?.tipo).filter(Boolean);
    html += '<article class="v2-daycard"><div class="v2-daycard-top"><span class="v2-daylabel">' + esc((selDay === list[0].key ? tr('Oggi', 'Today') + ' · ' : '') + cap(si.long) + ' ' + si.short) + '</span>' +
      '<span class="v2-daywx">' + (sel.wx ? wxIcon(sel.wx, 'v2-wx-ico') : '') + esc(wxShort(sel)) + '</span></div>' +
      '<div class="v2-hero">' + (ids.length ? ids.slice(0, 4).map(id => '<figure>' + thumb(id, 'v2-hero-img') + '</figure>').join('') : '<p class="v2-empty">' + esc(tr('Nessun look disponibile per questo giorno.', 'No look available for this day.')) + '</p>') + '</div>' +
      '<p class="v2-names">' + esc(names.slice(0, 4).join(' · ')) + '</p>' +
      '<p class="v2-sub">' + esc(eventText(sel)) + ' · ' + esc(dayStatus(sel, byId)) + '</p>' +
      '<div class="v2-actions"><button type="button" class="btn secondary" data-regen="' + esc(sel.key) + '">' + esc(tr('Rigenera', 'Regenerate')) + '</button>' +
      '</div></article>';
    // altri giorni: righe compatte
    html += '<div class="v2-rows">' + list.filter(p => p.key !== selDay).map(p => {
      const d = dayInfo(p.key);
      return '<button type="button" class="v2-row" data-day="' + esc(p.key) + '"><span class="v2-row-thumbs">' + rowThumbs(p, byId, 3) + '</span>' +
        '<span class="v2-row-text"><strong>' + esc(p.key === list[1]?.key ? tr('Domani', 'Tomorrow') : cap(d.long)) + '</strong><small>' + esc(wxShort(p) + ' · ' + eventText(p)) + '</small></span><i class="v2-chev" aria-hidden="true"></i></button>';
    }).join('') + '</div>';
    box.innerHTML = html;
  };
  document.addEventListener('click', e => {
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
      q('.v2-incomplete', el)?.remove();
      if (i && i.missing.length) {
        const b = document.createElement('span');
        b.className = 'v2-incomplete';
        b.textContent = tr('Incompleto', 'Incomplete') + ' · ' + tr('manca: ', 'missing: ') + i.missing.join(', ');
        el.append(b);
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
    let html = '';
    if (anTab === 'use') {
      const used = gs.filter(g => wearCount(g, 30) > 0).length;
      const idle = total - used;
      const pct = Math.round(used / total * 100);
      const C = 2 * Math.PI * 46;
      html += '<div class="v2-usage"><div class="v2-donut" role="img" aria-label="' + esc(anyWear ? tr('Utilizzo capi: ' + pct + '%', 'Item usage: ' + pct + '%') : tr('Dati insufficienti', 'Insufficient data')) + '"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" class="v2-ring"/>' +
        (anyWear ? '<circle cx="55" cy="55" r="46" class="v2-ring-on" stroke-dasharray="' + (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 55 55)"/>' : '') + '</svg>' +
        '<div class="v2-donut-t">' + (anyWear ? '<b>' + pct + '%</b><small>' + esc(tr('Utilizzo capi', 'Item usage')) + '</small>' : '<b>—</b><small>' + esc(tr('Dati insufficienti', 'Insufficient data')) + '</small>') + '</div></div>' +
        '<ul class="v2-stats"><li><b>' + total + '</b><span>' + esc(tr('Capi totali', 'Total items')) + '</span></li>' +
        '<li><b>' + (anyWear ? used : '—') + '</b><span>' + esc(tr('Usati negli ultimi 30 giorni', 'Worn in the last 30 days')) + '</span></li>' +
        '<li><b>' + (anyWear ? idle : '—') + '</b><span>' + esc(tr('Poco utilizzati', 'Rarely used')) + '</span></li></ul></div>';
      html += '<p class="v2-foot">' + esc(anyWear ? tr('Calcolato sugli utilizzi che hai registrato con «Indosso questo».', 'Calculated from the uses you logged with “Wear this”.') : tr('Registra cosa indossi con «Indosso questo»: servono dati per calcolare l’utilizzo.', 'Log what you wear with “Wear this”: data is needed to compute usage.')) + '</p>';
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
        if (d != null && d >= 30) items.push({ g, why: tr('Non lo indossi da ' + d + ' giorni.', 'Not worn for ' + d + ' days.') });
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
    if (name === 'wardrobe') { reindex().then(() => window.__v2Refresh?.()); }
  };
  document.addEventListener('atelier:languagechange', () => { renderAnalysis(); ensureWeatherRow(); });

  reindex();
  setTimeout(() => { try { ensureWeatherRow(); ensureTomorrow(); classifyLooks(); } catch { /* facoltativo */ } }, 1500);
})();
