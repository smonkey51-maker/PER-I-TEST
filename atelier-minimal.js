/* Interazioni del livello minimal: look apribili, gruppi del guardaroba richiudibili con ricerca, lingua nel Profilo. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* Look: un tocco apre/chiude la composizione */
  document.addEventListener('click', e => {
    const look = e.target.closest('#looks .look');
    if (!look || e.target.closest('button, .look-menu, a, input')) return;
    const open = look.classList.toggle('is-open');
    look.setAttribute('aria-expanded', String(open));
  });

  /* Guardaroba: gruppi richiudibili + ricerca */
  const collapsed = new Set();
  let query = '';
  function applyGroups() {
    document.querySelectorAll('#wardrobe .min-group').forEach(g => {
      const name = g.querySelector('h3')?.firstChild?.textContent.trim() || '';
      g.classList.toggle('is-collapsed', collapsed.has(name));
      let shown = 0;
      g.querySelectorAll('.v3-piece').forEach(p => {
        const id = p.dataset.open;
        const hit = (!query || (window.__v2Search ? window.__v2Search(id, query) : norm(p.textContent).includes(query))) && (window.__v2Filter ? window.__v2Filter(id) : true);
        p.hidden = !hit; if (hit) shown++;
      });
      g.hidden = (!!query || !!window.__v2FilterOn?.()) && !shown;
      const n = g.querySelector('h3 span'); if (n) n.textContent = shown;
      if (query || window.__v2FilterOn?.()) g.classList.remove('is-collapsed');
    });
  }
  document.addEventListener('click', e => {
    const h = e.target.closest('#wardrobe .min-group h3');
    if (!h) return;
    const name = h.firstChild?.textContent.trim() || '';
    collapsed.has(name) ? collapsed.delete(name) : collapsed.add(name);
    applyGroups();
  });
  function initWardrobe() {
    const wardrobe = $('#wardrobe');
    if (!wardrobe || $('#wardSearch')) return;
    const input = document.createElement('input');
    input.id = 'wardSearch'; input.type = 'search'; input.autocomplete = 'off';
    input.placeholder = 'Cerca un capo, colore, materiale…'; input.setAttribute('aria-label', 'Cerca nei capi');
    const row = document.createElement('div'); row.className = 'v2-searchrow';
    const fb = document.createElement('button'); fb.id = 'v2FilterBtn'; fb.type = 'button'; fb.setAttribute('aria-label', 'Filtri');
    fb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>';
    row.append(input, fb); $('#chips')?.before(row);
    input.addEventListener('input', () => { query = norm(input.value.trim()); applyGroups(); });
    new MutationObserver(() => { if (!applying) { applying = true; applyGroups(); applying = false; } }).observe(wardrobe, { childList: true });
  }
  let applying = false;
  window.__v2Refresh = applyGroups;

  /* Lingua: nelle preferenze del Profilo (il selettore nell'header è nascosto) */
  function langCard() {
    const body = $('#profileBody');
    if (!body || $('#langCard', body)) return;
    const card = document.createElement('section');
    card.className = 'studio-card'; card.id = 'langCard';
    card.innerHTML = '<h2>Lingua</h2><div class="studio-seg" role="group" aria-label="Lingua"><button type="button" data-lang="it">Italiano</button><button type="button" data-lang="en">English</button></div>';
    body.append(card);
    const stat = document.createElement('section');
    stat.className = 'studio-card'; stat.id = 'statCard';
    stat.innerHTML = '<h2>Statistiche</h2><button type="button" class="studio-link" data-v2-go="analysis"><span><b>Utilizzo, colori e stagioni</b><small>Calcolati sui capi e sugli utilizzi registrati.</small></span><svg class="row-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
    body.prepend(stat);
    sync();
  }
  function sync() {
    const cur = window.atelierLanguage?.() || 'it';
    document.querySelectorAll('#langCard [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === cur)));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('#langCard [data-lang]');
    if (!b) return;
    if ((window.atelierLanguage?.() || 'it') !== b.dataset.lang) $('#atelierLanguage')?.click();
    setTimeout(sync, 0);
  });
  document.addEventListener('atelier:languagechange', sync);
  document.addEventListener('click', e => { const g = e.target.closest('[data-v2-go]'); if (g) showTab(g.dataset.v2Go); });

  function init() {
    initWardrobe();
    const body = $('#profileBody');
    if (body) new MutationObserver(langCard).observe(body, { childList: true });
    langCard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
