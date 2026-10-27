/* ATELIER — sensazioni: vibrazione calibrata e transizioni da rivista.
   La vibrazione usa la Vibration API (Android; su iPhone il browser non la offre). */
(() => {
  'use strict';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const enabled = () => { try { return localStorage.getItem('atelier_haptics') !== '0'; } catch { return true; } };

  // Impulsi brevi e secchi: tocco leggero, apertura, conferma (doppio colpo), avviso
  const PATTERNS = { tap: 7, soft: 5, open: 9, confirm: [9, 45, 14], warn: [18, 60, 18] };
  window.haptic = kind => {
    if (!enabled()) return;
    try { navigator.vibrate?.(PATTERNS[kind] ?? PATTERNS.tap); } catch { /* non disponibile */ }
  };

  // Ogni gesto ha il suo feedback; i selettori sono in ordine di priorità
  const RULES = [
    ['#wearIdea, [data-wash], #detailWash, #washAll, #detailFav, #save', 'confirm'],
    ['#detailDelete, [data-manual-del], .discard', 'warn'],
    ['[data-open], .v3-piece, .card', 'open'],
    ['summary, .ios-day', 'soft'],
    ['.tab, #profileBtn, .chip, [data-filter], [data-availability], [data-regen], #anotherIdea, [data-go], [data-back], .btn, button', 'tap']
  ];
  document.addEventListener('click', e => {
    for (const [sel, kind] of RULES) if (e.target.closest(sel)) { haptic(kind); return; }
  }, true);

  // Interruttore nel Profilo
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-feel]');
    if (!f) return;
    try { localStorage.setItem(f.dataset.feel, f.checked ? '1' : '0'); } catch { /* storage non disponibile */ }
    if (f.checked) haptic('confirm');
  });

  // Transizione tra sezioni: dissolvenza calda con un lieve movimento verso l'alto (View Transitions)
  const baseShowTab = showTab;
  showTab = function (name) {
    if (!document.startViewTransition || reduced()) return baseShowTab(name);
    document.startViewTransition(() => baseShowTab(name));
  };
})();
