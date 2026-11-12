/* Su telefono le cinque sezioni principali stanno in un'unica pagina che scorre; le schede della barra portano alla sezione. */
(() => {
  'use strict';
  const MAIN = ['today', 'week', 'wardrobe', 'looks', 'add'];
  const mq = matchMedia('(max-width: 820px)');
  const view = n => document.getElementById('view-' + n);
  const coreShowTab = showTab;
  let current = 'today';
  let lock = 0;

  const markActive = name => document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));

  function apply(name, scroll) {
    coreShowTab(name);
    const one = mq.matches && MAIN.includes(name);
    document.body.classList.toggle('onepage', one);
    if (!one) return;
    MAIN.forEach(n => view(n)?.classList.remove('hidden'));
    current = name;
    markActive(name);
    try { if (typeof refreshEvents === 'function') refreshEvents(); if (typeof refreshWeather === 'function') refreshWeather(); } catch { /* facoltativo */ }
    if (scroll && name !== 'today') {
      lock = Date.now() + 900;
      setTimeout(() => view(name)?.scrollIntoView({ behavior: 'smooth', block: "start" }), 80);
    } else if (scroll) {
      lock = Date.now() + 900;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showTab = name => apply(name, true);

  // La scheda evidenziata segue la sezione che si sta leggendo
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('onepage') || ticking || Date.now() < lock) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const probe = (document.querySelector('.top')?.offsetHeight || 60) + 40;
      let best = MAIN[0];
      for (const n of MAIN) { const r = view(n)?.getBoundingClientRect(); if (r && r.top <= probe) best = n; }
      if (best !== current) { current = best; markActive(best); }
    });
  }, { passive: true });

  mq.addEventListener?.('change', () => apply(current, false));
  apply(current, false);
})();
