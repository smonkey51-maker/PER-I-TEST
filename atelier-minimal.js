/* Look compatti: toccando una riga si apre la composizione completa. */
(() => {
  'use strict';
  document.addEventListener('click', e => {
    const look = e.target.closest('#looks .look');
    if (!look || e.target.closest('button, .look-menu, a, input')) return;
    const open = look.classList.toggle('is-open');
    look.setAttribute('aria-expanded', String(open));
  });
})();
