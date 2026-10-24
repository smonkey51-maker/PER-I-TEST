/* iOS-style layout: today's outfit first, then weather and plans; week labels follow the language. */
(() => {
  let tries = 0;
  function place() {
    const context = document.querySelector('.atelier-context');
    const outfit = document.querySelector('#todayContent > .idea-card:first-child');
    if (!context || !outfit) { if (tries++ < 40) setTimeout(place, 50); return; }
    if (outfit.nextElementSibling !== context) outfit.after(context);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(place, 0), { once: true });
  else setTimeout(place, 0);
  document.addEventListener('atelier:languagechange', () => { if (typeof renderAll === 'function') renderAll(); });
})();
