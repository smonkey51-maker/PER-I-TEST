/* ATELIER — Studio: Profilo Sartoriale, Diario di Stile, Pezzi Iconici, suggerimenti sul clima,
   stagioni a riquadri, segni del consulente AI e ritaglio AI degli sfondi complessi.
   Usa le funzioni e lo stato di app.js; i dati del profilo restano su questo dispositivo. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const PROFILE_KEY = 'atelier_profile';
  const CUT_DAILY = 40;
  const profile = () => readJson(PROFILE_KEY, {});
  const aiOn = key => localStorage.getItem(key) !== '0';
  const chevron = '<svg class="row-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  /* ---------- Navigazione: profilo e diario non sono nella barra in basso ---------- */

  const coreShowTab = showTab;
  showTab = function (name) {
    coreShowTab(name);
    $('#profileBtn')?.classList.toggle('active', name === 'profile' || name === 'diary');
    if (name === 'profile') renderProfile();
    if (name === 'diary') renderDiary();
  };
  $('#profileBtn')?.addEventListener('click', () => showTab('profile'));
  document.addEventListener('click', e => {
    const back = e.target.closest('[data-back]');
    if (back) showTab(back.dataset.back);
    const go = e.target.closest('[data-go-section]');
    if (!go) return;
    if (go.dataset.goSection === 'diary') showTab('diary');
    if (go.dataset.goSection === 'iconic') { showTab('wardrobe'); setTimeout(() => $('[data-availability="fav"]')?.click(), 0); }
  });

  /* ---------- Profilo Sartoriale ---------- */

  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const FITS = [['slim', 'Slim'], ['regular', 'Regular'], ['relaxed', 'Relaxed']];
  const card = (title, body) => '<section class="studio-card"><h2>' + title + '</h2>' + body + '</section>';

  function renderProfile() {
    const box = $('#profileBody');
    if (!box || $('#view-profile').classList.contains('hidden')) return;
    const p = profile();
    const signed = !!window.atelierToken?.();
    const email = localStorage.getItem('atelier_google_email') || '';
    const account = signed
      ? '<p class="small">Collegato come ' + esc(email || 'account Google') + '. I capi si sincronizzano con Google Drive.</p><div class="studio-actions"><button class="btn secondary" data-account="sync">Sincronizza ora</button><button class="btn secondary" data-account="out">Esci</button></div>'
      : '<p class="small">Accedi con Google per ritrovare i capi su ogni dispositivo e usare il consulente di stile AI.</p><div class="studio-actions"><button class="btn" data-account="in">Accedi con Google</button></div>';
    const where = place ? '<p class="studio-value">' + (weather ? wxIcon(weather, 'studio-wx', true) : '') + esc(place.name) + '</p>' : '<p class="small">Nessun luogo impostato: il meteo non orienta ancora gli outfit.</p>';
    box.innerHTML =
      card('Account', account) +
      card('Luoghi per il meteo', where +
        '<form class="studio-row" id="profileCity"><input name="city" maxlength="60" autocomplete="off" placeholder="Scrivi la città" aria-label="Città"><button class="btn secondary" type="submit">Imposta</button></form>' +
        '<button class="link-btn" type="button" id="profileLocate">Usa la mia posizione</button>') +
      card('Misure', '<div class="studio-grid">' +
        '<label>Altezza (cm)<input type="number" inputmode="numeric" min="120" max="230" data-profile="altezza" value="' + esc(p.altezza || '') + '"></label>' +
        '<label>Taglia sopra<select data-profile="tagliaSopra"><option value="">—</option>' + SIZES.map(s => '<option' + (p.tagliaSopra === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></label>' +
        '<label>Taglia pantaloni<input inputmode="numeric" maxlength="6" placeholder="Es. 48" data-profile="tagliaSotto" value="' + esc(p.tagliaSotto || '') + '"></label>' +
        '<label>Numero di scarpe<input inputmode="decimal" maxlength="5" placeholder="Es. 42" data-profile="scarpe" value="' + esc(p.scarpe || '') + '"></label></div>' +
        '<p class="small">Restano su questo dispositivo.</p>') +
      card('Fit preferito', '<div class="studio-seg" role="group" aria-label="Fit preferito">' + FITS.map(([k, v]) => '<button type="button" data-fit="' + k + '" aria-pressed="' + (p.fit === k) + '">' + v + '</button>').join('') + '</div>' +
        '<p class="small">Orienta le immagini dei capi senza foto quando la vestibilità non è indicata.</p>') +
      card('Il tuo stile', '<button class="studio-link" data-go-section="diary"><span><b>Il Diario di Stile</b><small>La cronologia delle tue scelte estetiche nel tempo.</small></span>' + chevron + '</button>' +
        '<button class="studio-link" data-go-section="iconic"><span><b>I Pezzi Iconici</b><small>I capi chiave attorno a cui costruire la tua identità.</small></span>' + chevron + '</button>') +
      card('Sensazioni', '<label class="studio-toggle"><input type="checkbox" data-feel="atelier_haptics"' + (aiOn('atelier_haptics') ? ' checked' : '') + '><span><b>Vibrazione leggera</b><small>Un tocco secco quando scegli, indossi o archivi un capo. Funziona su Android.</small></span></label>') +
      card(AI_MARK + ' Consulente di stile', '<label class="studio-toggle"><input type="checkbox" data-ai="atelier_ai_illustrate"' + (aiOn('atelier_ai_illustrate') ? ' checked' : '') + '><span><b>Immagini per i capi senza foto</b><small>Una foto prodotto creata dalla descrizione, meno di un centesimo l’una.</small></span></label>' +
        '<label class="studio-toggle"><input type="checkbox" data-ai="atelier_ai_cutout"' + (aiOn('atelier_ai_cutout') ? ' checked' : '') + '><span><b>Ritaglio AI degli sfondi complessi</b><small>Per le foto su letti, pavimenti o sfondi non uniformi; pochi centesimi a foto.</small></span></label>');
  }

  document.addEventListener('change', e => {
    const f = e.target.closest('[data-profile]');
    if (f) { const p = profile(); p[f.dataset.profile] = f.value.trim(); writeJson(PROFILE_KEY, p); }
    const ai = e.target.closest('[data-ai]');
    if (ai) { localStorage.setItem(ai.dataset.ai, ai.checked ? '1' : '0'); if (ai.checked) { scheduleIllustrations(); scheduleCutouts(); } }
  });
  document.addEventListener('click', e => {
    const fit = e.target.closest('[data-fit]');
    if (fit) {
      const p = profile(); p.fit = p.fit === fit.dataset.fit ? '' : fit.dataset.fit; writeJson(PROFILE_KEY, p);
      document.querySelectorAll('[data-fit]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fit === p.fit)));
    }
    const acc = e.target.closest('[data-account]');
    if (acc) $({ in: '#connectDrive', sync: '#syncDrive', out: '#disconnectDrive' }[acc.dataset.account])?.click();
    if (e.target.closest('#profileLocate')) $('#useLocation')?.click();
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'profileCity') return;
    e.preventDefault();
    const city = e.target.city.value.trim();
    if (!city) return;
    $('#weatherCity').value = city;
    $('#weatherForm').requestSubmit();
  });

  /* ---------- Il Diario di Stile ---------- */

  async function renderDiary() {
    const box = $('#diaryBody');
    if (!box) return;
    const garments = await all();
    const days = new Map();
    for (const g of garments) for (const d of g.indossato || []) { if (!days.has(d)) days.set(d, []); days.get(d).push(g); }
    const dates = [...days.keys()].sort().reverse();
    if (!dates.length) {
      box.innerHTML = '<div class="studio-card diary-empty"><p>Quando premi «Indosso questo», il look del giorno entra nel Diario.</p></div>';
      return;
    }
    const top = [...garments].sort((a, b) => (b.indossato || []).length - (a.indossato || []).length)[0];
    const locale = appLocale();
    let html = '<div class="diary-stats"><div><strong>' + dates.length + '</strong><span>Giorni nel Diario</span></div>' +
      '<div><strong>' + garments.filter(g => (g.indossato || []).length).length + '</strong><span>Capi indossati</span></div>' +
      (top && (top.indossato || []).length ? '<div class="diary-top"><span>Il più scelto</span><b>' + esc(top.tipo || 'Capo') + '</b></div>' : '') + '</div>';
    let month = '';
    for (const d of dates) {
      const date = new Date(d + 'T12:00:00');
      const m = cap(date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
      if (m !== month) { month = m; html += '<h2 class="diary-month">' + esc(m) + '</h2>'; }
      const items = days.get(d);
      html += '<article class="diary-day"><div class="diary-date"><strong>' + date.getDate() + '</strong><small>' + esc(date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')) + '</small></div>' +
        '<div class="diary-look">' + items.slice(0, 5).map(g => '<button class="diary-piece" data-open="' + esc(g.id) + '" aria-label="' + esc(g.tipo || 'Capo') + '">' + photoHtml(g.id, 'diary-img fade', g.tipo || 'Capo') + '</button>').join('') + '</div>' +
        '<p class="diary-names">' + esc(items.map(g => g.tipo || 'Capo').join(' · ')) + '</p></article>';
    }
    box.innerHTML = html;
    revealImages();
  }
  $('#diaryBody')?.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openDetail(b.dataset.open); });

  /* ---------- Pezzi Iconici: il sottotitolo del Caveau segue il filtro ---------- */

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-availability]');
    if (!b) return;
    const sub = $('#caveauSub');
    if (sub) sub.textContent = b.dataset.availability === 'fav' ? 'I Pezzi Iconici: i capi chiave attorno a cui costruire la tua identità.' : 'La tua collezione privata digitalizzata.';
  });

  /* ---------- Suggerimenti sul clima e sugli impegni ---------- */

  function suggestions() {
    const out = [];
    if (weather && wxNow) {
      out.push({ freddo: 'Giornata fredda: strati caldi e un capospalla pesante.', fresco: 'Giornata fresca: uno strato leggero sopra e una giacca a portata di mano.', mite: 'Giornata ideale per uno strato leggero.', caldo: 'Fa caldo: tessuti leggeri e traspiranti, niente capospalla.' }[wxNow.band]);
      if (wxNow.rainy) out.push('Pioggia probabile: capospalla e scarpe che non temono l’acqua.');
      if (weather.tmax - weather.tmin >= 9) out.push('Escursione di ' + (weather.tmax - weather.tmin) + '°: vestiti a strati per la sera.');
    } else {
      out.push('Imposta la città nel Profilo Sartoriale: i suggerimenti seguiranno il clima.');
    }
    const tags = (typeof lastTags !== 'undefined' ? lastTags : []).map(t => t.tag);
    if (tags.includes('lavoro')) out.push('Impegno di lavoro: il look privilegia una sartoria sobria e autorevole.');
    if (tags.includes('serata') || tags.includes('cerimonia')) out.push('Stasera hai un impegno: tieni a portata un capo più curato.');
    if (tags.includes('sport')) out.push('Sport in agenda: prepara a parte un cambio comodo.');
    return out.slice(0, 3);
  }
  function renderSuggestions() {
    const ctx = $('.atelier-context');
    if (!ctx) return;
    let box = $('#suggestions');
    if (!box) {
      box = document.createElement('div');
      box.id = 'suggestions';
      box.className = 'idea-card suggest';
      ctx.insertBefore(box, $('#agenda'));
    }
    box.innerHTML = '<h2 class="suggest-title">' + AI_MARK + ' Suggerimenti</h2><ul>' + suggestions().map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
  }

  /* ---------- Segni del consulente AI ---------- */

  function decorate() {
    const head = $('#todayContent > .idea-card:first-child > h2');
    if (head && !head.querySelector('.ai-mark')) {
      head.insertAdjacentHTML('afterbegin', AI_MARK + ' ');
      head.insertAdjacentHTML('afterend', '<p class="compose-sub">L’intelligenza predittiva sincronizzata sul clima attuale.</p>');
    }
    const another = $('#anotherIdea');
    if (another && !another.querySelector('.ai-mark')) another.insertAdjacentHTML('afterbegin', AI_MARK + ' ');
    const insp = $('.v3-inspiration > summary');
    if (insp && !insp.querySelector('.ai-mark')) insp.insertAdjacentHTML('afterbegin', AI_MARK + ' ');
  }
  // Nel Caveau le foto create dall'AI portano la stella
  function markAiPieces() {
    for (const el of document.querySelectorAll('#wardrobe [data-open]')) {
      const g = garmentById.get(el.dataset.open);
      const stage = el.querySelector('.v3-stage') || el;
      const has = stage.querySelector(':scope > .ai-badge');
      if (g?.fotoIllustrativa && photoSrc(g.id) && !has) stage.insertAdjacentHTML('beforeend', '<span class="ai-badge" title="Immagine creata dall’AI">' + AI_MARK + '</span>');
      else if (!(g?.fotoIllustrativa && photoSrc(g.id)) && has) has.remove();
    }
  }

  /* ---------- Stagioni a riquadri nei moduli dei capi ---------- */

  const SEASONS = [
    ['primavera', 'Primavera', '<path d="M6 18c0-7 5-12 13-12 0 8-5 13-12 13"/><path d="M6 18l7-7"/>'],
    ['estate', 'Estate', '<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>'],
    ['autunno', 'Autunno', '<path d="M12 21v-5M12 16l-6-3 2-2-3-3 4 .5L10 5l2 3 2-3 1 3.5 4-.5-3 3 2 2z"/>'],
    ['inverno', 'Inverno', '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>']
  ];
  const seasonsOf = v => norm(v || '').split(/[,/;]| e /).map(s => s.trim()).filter(Boolean);
  function enhanceSeasons(root = document) {
    for (const input of root.querySelectorAll('input[name="stagione"]:not([data-seasons]), input[data-field="stagione"]:not([data-seasons])')) {
      input.dataset.seasons = '1';
      input.classList.add('season-source');
      const row = document.createElement('div');
      row.className = 'season-chips';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'Stagione');
      const sync = () => {
        const on = seasonsOf(input.value);
        row.querySelectorAll('[data-season]').forEach(b => b.setAttribute('aria-pressed', String(on.some(s => s.startsWith(b.dataset.season.slice(0, 4))) || on.includes('tutte'))));
      };
      row.innerHTML = SEASONS.map(([k, label, icon]) => '<button type="button" class="season-chip s-' + k + '" data-season="' + k + '" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true">' + icon + '</svg><span>' + label + '</span></button>').join('');
      row.addEventListener('click', e => {
        const b = e.target.closest('[data-season]');
        if (!b) return;
        e.preventDefault();
        let on = seasonsOf(input.value).filter(s => s !== 'tutte' && !/^non determinabile$/.test(s));
        const k = b.dataset.season;
        on = on.some(s => s.startsWith(k.slice(0, 4))) ? on.filter(s => !s.startsWith(k.slice(0, 4))) : [...on, k];
        input.value = SEASONS.map(([s]) => s).filter(s => on.some(x => x.startsWith(s.slice(0, 4)))).join(', ');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        sync();
      });
      input.after(row);
      sync();
    }
  }

  /* ---------- Ritaglio AI degli sfondi complessi ---------- */

  // Le foto che lo scontorno sul dispositivo non riesce a isolare (escono in JPEG) vanno in coda per l'AI
  const pendingCut = new WeakSet();
  const corePhoto = photo;
  photo = async function (file) {
    const blob = await corePhoto(file);
    if (aiOn('atelier_ai_cutout') && blob?.type !== 'image/png') pendingCut.add(blob);
    return blob;
  };
  const corePut = put;
  put = async function (item, store = 'garments') {
    if (store === 'photos' && item?.blob && pendingCut.has(item.blob)) item = { ...item, cutPending: true };
    return corePut(item, store);
  };

  let cutting = false, cutTimer = null, cutWarned = false;
  function scheduleCutouts() { clearTimeout(cutTimer); cutTimer = setTimeout(runCutouts, 2500); }
  const toDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  async function toPng(dataUrl) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    const w = 480, h = 600, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const s = Math.min(w / img.width, h / img.height);
    c.getContext('2d').drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
    return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(Error('Immagine non elaborabile'))), 'image/png'));
  }
  async function runCutouts() {
    if (cutting || !aiOn('atelier_ai_cutout') || !window.atelierToken?.() || !window.atelierSynced?.() || !navigator.onLine) return;
    cutting = true;
    let done = 0;
    try {
      const day = todayStr();
      const quota = readJson('atelier_cutout_quota', {});
      let used = quota.day === day ? quota.n : 0;
      const garments = new Map((await all()).map(g => [g.id, g]));
      const rows = (await all('photos')).filter(r => r.cutPending && garments.has(r.id) && !garments.get(r.id).fotoIllustrativa && Date.now() - (r.cutFailedAt || 0) > 864e5);
      for (const row of rows) {
        if (used >= CUT_DAILY) break;
        const r = await fetch('/api/cutout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.atelierToken?.() },
          body: JSON.stringify({ image: await toDataUrl(row.blob) })
        });
        writeJson('atelier_cutout_quota', { day, n: ++used });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.image) {
          if (!cutWarned) { cutWarned = true; toast(j.error || 'Ritaglio AI non riuscito.'); }
          if (r.status === 503 || r.status === 401) break;
          await corePut({ ...row, cutFailedAt: Date.now() }, 'photos');
          continue;
        }
        // La foto potrebbe essere cambiata nel frattempo: si ritaglia solo quella mandata
        const now = (await all('photos')).find(p => p.id === row.id);
        if (!now || (now.at || 0) !== (row.at || 0)) continue;
        const { cutPending, cutFailedAt, ...rest } = row;
        await corePut({ ...rest, blob: await toPng(j.image), originalBlob: row.originalBlob || row.blob, at: Date.now() }, 'photos');
        forgetPhoto(row.id);
        done++;
      }
    } catch { /* si riprova al prossimo aggiornamento */ } finally {
      cutting = false;
    }
    if (!done) return;
    await renderAll();
    toast(done === 1 ? 'Sfondo rimosso da 1 foto' : 'Sfondo rimosso da ' + done + ' foto');
    await window.atelierDriveSync?.();
  }

  // Opzione nella pagina Aggiungi e ritaglio delle foto già nel Caveau
  function addOptions() {
    const local = $('.v3-option');
    if (local && !$('#aiCutOption')) {
      local.insertAdjacentHTML('afterend', '<label class="v3-option" id="aiCutOption"><input type="checkbox" data-ai="atelier_ai_cutout"' + (aiOn('atelier_ai_cutout') ? ' checked' : '') + '> ' + AI_MARK + ' Ritaglio AI per sfondi complessi (letti, pavimenti), pochi centesimi a foto</label>');
    }
    const actions = $('.v3-photo-actions');
    if (actions && !$('#aiCutExisting')) {
      actions.insertAdjacentHTML('afterbegin', '<button id="aiCutExisting" type="button">' + AI_MARK + ' Ritaglio AI delle foto esistenti</button>');
      $('#aiCutExisting').onclick = async () => {
        const garments = new Map((await all()).map(g => [g.id, g]));
        const rows = (await all('photos')).filter(r => r.blob?.type !== 'image/png' && !r.cutPending && garments.has(r.id) && !garments.get(r.id).fotoIllustrativa);
        if (!rows.length) { toast('Tutte le foto hanno già lo sfondo rimosso.'); return; }
        if (!window.atelierToken?.()) { toast('Accedi con Google per il ritaglio AI.'); return; }
        if (!confirm(rows.length === 1 ? 'Ritagliare con l’AI 1 foto? Costa pochi centesimi.' : 'Ritagliare con l’AI ' + rows.length + ' foto? Costa pochi centesimi a foto (massimo ' + CUT_DAILY + ' al giorno).')) return;
        localStorage.setItem('atelier_ai_cutout', '1');
        for (const r of rows) await corePut({ ...r, cutPending: true, cutFailedAt: undefined }, 'photos');
        toast('Ritaglio AI avviato: le foto si aggiornano man mano.');
        scheduleCutouts();
      };
    }
  }

  /* ---------- Aggiornamenti ---------- */

  const coreRenderAll = renderAll;
  renderAll = async function () {
    await coreRenderAll();
    decorate();
    renderSuggestions();
    markAiPieces();
    enhanceSeasons();
    addOptions();
    scheduleCutouts();
    if (!$('#view-profile').classList.contains('hidden')) renderProfile();
  };
  new MutationObserver(() => { markAiPieces(); enhanceSeasons(); }).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(() => renderProfile()).observe($('#accountDescription'), { childList: true, characterData: true, subtree: true });
  document.addEventListener('atelier:languagechange', () => { renderProfile(); if (!$('#view-diary').classList.contains('hidden')) renderDiary(); });

  const start = () => {
    decorate(); renderSuggestions(); addOptions(); enhanceSeasons();
    const open = TABS.find(t => !$('#view-' + t).classList.contains('hidden'));
    if (open === 'profile' || open === 'diary') showTab(open);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 60), { once: true });
  else setTimeout(start, 60);
})();
