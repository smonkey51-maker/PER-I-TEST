/* Redesign ispirato a Euganeo: Looks con «I miei look / Ispirazione», aggiunta impegno in Agenda, scorciatoie. */
(() => {
  'use strict';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const tr = (it, e) => ((typeof appLang === 'function' ? appLang() : 'it') === 'en' ? e : it);

  /* ---------- Looks: due viste ---------- */
  const view = q('#view-looks');
  if (view && !q('#v2LookSeg')) {
    const seg = document.createElement('div');
    seg.id = 'v2LookSeg'; seg.className = 'v2-seg'; seg.setAttribute('role', 'tablist');
    seg.innerHTML = '<button type="button" role="tab" data-lseg="mine" aria-selected="true">' + tr('I miei look', 'My looks') + '</button><button type="button" role="tab" data-lseg="inspo" aria-selected="false">' + tr('Ispirazione', 'Inspiration') + '</button>';
    q('.view-head', view).after(seg);
    const panel = document.createElement('section');
    panel.id = 'v2Inspo'; panel.hidden = true;
    panel.innerHTML = '<p class="v2-hint">' + tr('Indica uno stile o una persona: ATELIER compone un outfit con i tuoi capi disponibili.', 'Name a style or a person: ATELIER builds an outfit from your available items.') + '</p>';
    seg.after(panel);
    const manual = q('.v3-inspiration .manual') || q('#inspoForm')?.closest('.manual');
    if (manual) panel.append(manual);
    seg.addEventListener('click', e => {
      const b = e.target.closest('[data-lseg]'); if (!b) return;
      qa('[data-lseg]', seg).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      const inspo = b.dataset.lseg === 'inspo';
      panel.hidden = !inspo;
      view.classList.toggle('is-inspo', inspo);
    });
    // il risultato dell'ispirazione compare in Oggi
    q('#inspoForm')?.addEventListener('submit', () => {
      const before = typeof idea !== 'undefined' && idea ? idea.title : null;
      let n = 0;
      const t = setInterval(() => {
        n++;
        if (typeof idea !== 'undefined' && idea && idea.person && idea.title !== before) { clearInterval(t); showTab('today'); }
        if (n > 80) clearInterval(t);
      }, 500);
    });
  }

  /* ---------- Agenda: aggiunta di un impegno di oggi ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'v2-sheet'; dlg.id = 'v2AddEvent'; dlg.setAttribute('aria-labelledby', 'v2AddEventTitle');
  dlg.innerHTML = '<div class="v2-sheet-body"><h2 id="v2AddEventTitle">' + tr('Aggiungi un impegno di oggi', 'Add an event for today') + '</h2>' +
    '<p class="v2-hint">' + tr('Serve ad ATELIER per scegliere l’outfit adatto.', 'It helps ATELIER pick the right outfit.') + '</p>' +
    '<div class="v2-chips">' + [['lavoro', 'Lavoro', 'Work'], ['serata', 'Serata', 'Evening'], ['cerimonia', 'Cerimonia', 'Ceremony'], ['sport', 'Sport', 'Sport'], ['viaggio', 'Viaggio', 'Travel'], ['casual', 'Tempo libero', 'Leisure']].map(([k, it, e]) => '<button type="button" class="chip" data-v2occ="' + k + '">' + tr(it, e) + '</button>').join('') + '</div>' +
    '<form id="v2EventForm" class="v2-form"><input id="v2EventText" maxlength="80" autocomplete="off" placeholder="' + tr('Es. cena con Anna', 'e.g. dinner with Anna') + '" aria-label="' + tr('Descrivi un impegno', 'Describe an event') + '"><button class="btn" type="submit">' + tr('Aggiungi', 'Add') + '</button></form></div>';
  document.body.append(dlg);
  q('#weekAdd')?.addEventListener('click', () => dlg.showModal());
  dlg.addEventListener('click', e => {
    if (e.target === dlg) { dlg.close(); return; }
    const c = e.target.closest('[data-v2occ]');
    if (c) { q('#agenda [data-occ="' + c.dataset.v2occ + '"]')?.click(); dlg.close(); toast(tr('Impegno aggiunto', 'Event added')); }
  });
  q('#v2EventForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const v = q('#v2EventText').value.trim();
    if (!v) return;
    q('#manualText').value = v; q('#manualForm').requestSubmit();
    q('#v2EventText').value = ''; dlg.close(); toast(tr('Impegno aggiunto', 'Event added'));
  });

  /* ---------- Scheda capo: «Crea look» ---------- */
  const detail = q('#detail');
  function addCreateLook() {
    const actions = q('#detailActions');
    if (!actions || q('#v2CreateLook')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'v2CreateLook'; b.className = 'btn';
    b.textContent = tr('Crea look', 'Create look');
    actions.prepend(b);
    b.addEventListener('click', () => {
      const name = q('#detailTitle')?.textContent || '';
      q('#detailClose')?.click();
      showTab('looks');
      setTimeout(() => { q('#newLook')?.click(); const f = q('#lookParts'); if (f && name) { f.value = name; f.dispatchEvent(new Event('input', { bubbles: true })); } q('#lookName')?.focus(); }, 120);
    });
  }
  addCreateLook();
  if (detail) new MutationObserver(addCreateLook).observe(detail, { attributes: true, attributeFilter: ['open'] });
})();
