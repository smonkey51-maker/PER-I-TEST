/* ATELIER — tema: Automatico (segue il telefono), Scuro o Chiaro. La scelta resta su questo dispositivo.
   L'attributo data-theme sul <html> viene impostato subito da uno script in <head>, per evitare il lampo. */
(() => {
  'use strict';
  const KEY = 'atelier_theme';
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  const choice = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };

  function apply() {
    const c = choice();
    const light = c === 'light' || (c === 'auto' && !!mq?.matches);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', light ? '#f4f1ea' : '#0f0f0e');
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
