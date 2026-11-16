/* ATELIER — tema: Automatico (segue il telefono), Scuro o Chiaro. La scelta resta su questo dispositivo.
   L'attributo data-theme sul <html> viene impostato subito da uno script in <head>, per evitare il lampo. */
(() => {
  'use strict';
  const KEY = 'atelier_theme';
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  const choice = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };

  /* Colore delle barre del telefono: segue i colori che l'app mostra davvero in quel momento.
     In alto: il colore della barra superiore dell'app (o, se non c'è, dello sfondo); la scelta dell'utente (Chiaro/Scuro)
     prevale su quella del telefono, quindi i meta theme-color vengono aggiornati tutti insieme. */
  const probe = document.createElement('i');
  probe.style.cssText = 'position:fixed;left:-9px;top:-9px;width:1px;height:1px;visibility:hidden;pointer-events:none';
  const toHex = rgb => {
    const m = String(rgb).match(/[\d.]+/g);
    if (!m || m.length < 3 || (m.length > 3 && +m[3] < .5)) return null;
    return '#' + m.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join('');
  };
  function topColor(light) {
    try {
      const band = document.querySelector('.top');
      if (band) {
        const cs = getComputedStyle(band, '::before');
        if (cs.display !== 'none') { const h = toHex(cs.backgroundColor); if (h) return h; }
      }
      const h = toHex(getComputedStyle(document.body).backgroundColor);
      if (h) return h;
    } catch { /* uso del colore di riserva */ }
    return light ? '#f5f1ea' : '#211a17';
  }
  function syncBars(light) {
    if (light === undefined) light = document.documentElement.dataset.theme === 'light';
    const color = topColor(light);
    document.querySelectorAll('meta[name=theme-color]').forEach(m => { m.removeAttribute('media'); m.setAttribute('content', color); });
  }
  window.atelierSyncBars = syncBars;
  // la barra superiore cambia colore con il tema e con lo scorrimento: si riallinea
  new MutationObserver(() => syncBars()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(() => syncBars()).observe(document.body || document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pageshow', () => syncBars());

  function apply() {
    const c = choice();
    const light = c === 'light' || (c === 'auto' && !!mq?.matches);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    syncBars(light);
    document.querySelectorAll('[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === c)));
  }
  window.atelierApplyTheme = apply;
  mq?.addEventListener?.('change', apply);

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-theme-choice]');
    if (!b) return;
    try { localStorage.setItem(KEY, b.dataset.themeChoice); } catch { /* storage non disponibile */ }
    apply();
  });
  apply();
})();
