/* ATELIER — pianificazione: domani, prossimi giorni, cosa manca nel guardaroba (usa le funzioni di app.js) */

const PLAN_DAYS = 7; // da domani
let plans = new Map(); // data (AAAA-MM-GG) → piano del giorno
let plansSig = '';

const dayKey = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return ymd(d); };
const dayLabel = key => cap(new Date(key + 'T12:00:00').toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' }));

// Piano di un giorno: occasioni, fasi (lavoro / dopo il lavoro), meteo previsto e outfit
// Gli outfit sono composti solo da capi attualmente disponibili: nessuna disponibilità futura presunta.
function buildPlan(offset, garments, avoid) {
  const key = dayKey(offset);
  garments = garments.filter(g => !washing(g));
  const events = eventsOnDay(allEvents, key);
  const matched = dayOccasions(events);
  const phases = dayPhases(matched);
  const tags = uniqueTags((phases ? matched.filter(m => !phases.afterEvents.has(m.ev)) : matched).map(m => m.occ));
  const wx = weekWx[offset] || null;
  const savedWx = wxNow;
  wxNow = wx ? wxProfile(wx) : null;
  avoidIds = avoid;
  let outfit, after = null;
  try {
    outfit = generateOutfit(garments, tags);
    if (!outfit.missing && phases) after = deriveOutfit(garments, outfit.ids, phases.afterTags);
  } finally {
    wxNow = savedWx;
    avoidIds = new Set();
  }
  return { key, offset, events, matched, phases, tags, wx, outfit, after };
}

function idsOfPlan(p) {
  return p.outfit.missing ? [] : [...p.outfit.ids, ...(p.after?.ids || [])];
}

// Genera i piani solo se cambiano capi, eventi o meteo, così non si rimescolano a ogni aggiornamento
function ensurePlans(garments) {
  const sig = garments.map(g => g.id + ':' + (washing(g) ? 'lavatrice' : 'pronto')).join(',') + '|' + JSON.stringify(allEvents) + '|' + JSON.stringify(weekWx);
  if (sig === plansSig && plans.size) return;
  plansSig = sig;
  plans = new Map();
  const used = new Set();
  for (let o = 1; o <= PLAN_DAYS; o++) {
    const p = buildPlan(o, garments, new Set(used));
    plans.set(p.key, p);
    idsOfPlan(p).forEach(id => used.add(id));
  }
}

function planStrip(ids, byId) {
  return '<div class="strip">' + ids.map((id, i) => {
    const g = byId.get(id);
    return '<figure style="--i:' + i + '">' + photoHtml(id, 'strip-img fade', g.tipo || 'Capo') + (photoSrc(id) ? '<figcaption>' + esc(g.tipo || 'Capo') + '</figcaption>' : '') + '</figure>';
  }).join('') + '</div>';
}

const planNames = (ids, byId) => ids.map(id => (byId.get(id).tipo || 'capo').toLowerCase()).join(', ');

// Capi del piano ancora in lavatrice: vanno lavati prima di quel giorno
function washWarning(p, byId, when) {
  const dirty = [...new Set(idsOfPlan(p))].filter(id => byId.get(id) && washing(byId.get(id)));
  return dirty.length ? '<p class="warn">In lavatrice: ' + esc(planNames(dirty, byId)) + '. Lavali ' + esc(when) + '.</p>' : '';
}

function planOutfitsHtml(p, byId, when) {
  if (p.outfit.missing) return '<p class="muted">Per comporre un outfit servono ' + esc(p.outfit.missing.join(', ')) + '.</p>';
  let html = '';
  if (p.phases) html += '<p class="phase">Per il lavoro' + (p.phases.workEnd ? ', fino alle ' + hhmm(p.phases.workEnd) : '') + '</p>';
  html += planStrip(p.outfit.ids, byId);
  if (p.outfit.warn) html += '<p class="warn">' + esc(p.outfit.warn) + '</p>';
  if (p.after) {
    const nx = p.phases.next;
    html += '<div class="phase-block"><h4>Dopo il lavoro</h4><p class="phase">' + esc(nx.title) + (nx.manual ? '' : ', ' + esc(eventTime(nx))) + '</p>' +
      (p.after.same
        ? '<p class="small">Puoi tenere lo stesso outfit: non hai altri capi adatti da cambiare.</p>'
        : '<p class="small">Tieni ' + esc(planNames(p.after.kept, byId)) + '; cambia con ' + esc(planNames(p.after.changed, byId)) + '.</p>' + planStrip(p.after.ids, byId)) +
      '</div>';
  }
  return html + washWarning(p, byId, when);
}

function firstEventLine(p) {
  const timed = p.events.filter(e => !e.manual && !e.allDay);
  const first = timed[0];
  if (first) return first.title + ', alle ' + eventTime(first);
  const day = p.events[0];
  return day ? day.title : 'Nessun impegno';
}

function renderTomorrow(byId) {
  const box = $('#tomorrow');
  const p = plans.get(dayKey(1));
  box.classList.toggle('hidden', !p || allEvents === null);
  if (!p || allEvents === null) return;
  box.innerHTML = '<h2>Domani</h2><p class="phase">' + esc(firstEventLine(p)) + '</p>' +
    (p.wx ? '<p class="small">Meteo: ' + esc(wxText(p.wx)) + '</p>' : '') +
    planOutfitsHtml(p, byId, 'entro stasera') +
    '<div class="actions"><button class="btn secondary" data-regen="' + p.key + '">Un\'altra idea</button>' +
    '<button class="btn secondary" data-go="week">Vedi i prossimi giorni</button></div>';
}

function dayCardHtml(p, byId) {
  const labels = new Map();
  for (const m of p.matched) labels.set(m.ev, [...(labels.get(m.ev) || []), m.occ.tag]);
  const list = p.events.length
    ? '<ul class="agenda-list">' + p.events.map(ev => '<li><span class="time">' + esc(eventTime(ev)) + '</span><span>' + esc(ev.title) + '</span>' +
        (labels.has(ev) ? '<span class="occ">' + esc(labels.get(ev).join(', ')) + '</span>' : '') + '</li>').join('') + '</ul>'
    : '<p class="small">Nessun impegno.</p>';
  return '<article class="idea-card day-card"><h3>' + esc(dayLabel(p.key)) + '</h3>' +
    (p.wx ? '<p class="small">Meteo: ' + esc(wxText(p.wx)) + '</p>' : '') + list +
    planOutfitsHtml(p, byId, 'prima di ' + new Date(p.key + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long' })) +
    '<div class="actions"><button class="btn secondary" data-regen="' + p.key + '">Un\'altra idea</button></div></article>';
}

function renderWeek(byId) {
  let html = '';
  if (allEvents === null) {
    html += '<p class="muted">Collega Google Calendar (dalla sezione «Oggi») per avere gli outfit in base ai tuoi impegni. Intanto ecco un\'idea per ogni giorno.</p>';
  }
  if (!place) html += '<p class="small">Indica dove sei in «Oggi» per tener conto anche del meteo.</p>';
  html += [...plans.values()].map(p => dayCardHtml(p, byId)).join('');
  $('#weekList').innerHTML = html;
}

/* ---------- Cosa manca nel guardaroba ---------- */

const SHOES_FORMAL = startsWith(['mocassin', 'stringat', 'derby', 'oxford', 'loafer', 'chelsea', 'francesin']);
const SHOES_CASUAL = startsWith(['sneaker', 'ginnastica', 'running', 'tela\\b', 'converse', 'vans']);

function wardrobeGaps(garments) {
  const by = c => garments.filter(g => catOf(g) === c);
  const txt = g => [g.tipo, g.materiale, g.compatibilita].filter(Boolean).join(' ').toLowerCase();
  const tops = [...by('Maglieria'), ...by('Camicie e T-shirt')];
  const bottoms = by('Pantaloni e jeans');
  const shoes = by('Scarpe');
  const outers = by('Giacche e capispalla');
  const out = [];
  const few = (n, min, what, hint) => { if (n < min) out.push('Hai ' + n + ' ' + what + ': ' + hint); };
  few(tops.length, 5, tops.length === 1 ? 'capo sopra (maglieria, camicie, t-shirt)' : 'capi sopra (maglieria, camicie, t-shirt)', 'per cinque giorni senza ripetizioni ne servono almeno 5.');
  few(bottoms.length, 3, bottoms.length === 1 ? 'paio di pantaloni o jeans' : 'pantaloni o jeans', 'ne servono almeno 3 per alternarli.');
  few(shoes.length, 3, shoes.length === 1 ? 'paio di scarpe' : 'paia di scarpe', 'ne servono almeno 3 tra lavoro e tempo libero.');
  few(outers.length, 2, outers.length === 1 ? 'capospalla' : 'capispalla', 'ne servono almeno 2 (uno leggero e uno più caldo).');
  if (shoes.length && !shoes.some(g => SHOES_FORMAL.test(txt(g)))) out.push('Non hai scarpe da lavoro sobrie (mocassini, stringate, derby): per i giorni in ufficio sono la base.');
  if (shoes.length && !shoes.some(g => SHOES_CASUAL.test(txt(g)))) out.push('Non hai sneakers: servono per il dopo lavoro e il tempo libero.');
  const sober = [...tops, ...bottoms].filter(g => garmentStyle(g) === 'sobrio').length;
  if (tops.length + bottoms.length >= 4 && sober < 3) out.push('Per il lavoro (sartoriale sobrio e autorevole) hai solo ' + sober + ' capi tra sopra e pantaloni: te ne servono almeno 3.');
  const retro = garments.filter(g => garmentStyle(g) === 'retro').length;
  if (garments.length >= 6 && retro < 2) out.push('Per il tempo libero (rétro, più espressivo) hai solo ' + retro + ' capi con carattere: te ne servono almeno 2.');
  return out;
}

function renderGaps(garments) {
  const box = $('#gaps');
  box.classList.toggle('hidden', garments.length < 3);
  if (garments.length < 3) return;
  const gaps = wardrobeGaps(garments);
  box.innerHTML = '<h2>Cosa ti manca</h2>' + (gaps.length
    ? '<ul class="gaps">' + gaps.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul>'
    : '<p class="small">Il guardaroba è ben bilanciato per il tuo stile.</p>');
}

function renderPlans(garments) {
  renderGaps(garments);
  if (!garments.length) {
    $('#tomorrow').classList.add('hidden');
    $('#weekList').innerHTML = '<p class="muted">Aggiungi dei capi per avere un outfit per ogni giorno.</p>';
    return;
  }
  ensurePlans(garments);
  const byId = new Map(garments.map(g => [g.id, g]));
  renderTomorrow(byId);
  renderWeek(byId);
}

async function regeneratePlan(key) {
  const garments = await all();
  const p0 = plans.get(key);
  if (!p0) return;
  const avoid = new Set();
  for (const [k, p] of plans) if (k !== key) idsOfPlan(p).forEach(id => avoid.add(id));
  plans.set(key, buildPlan(p0.offset, garments, avoid));
  renderPlans(garments);
  revealImages();
}

document.addEventListener('click', e => {
  const regen = e.target.closest('[data-regen]');
  if (regen) regeneratePlan(regen.dataset.regen);
  if (e.target.closest('[data-go=week]')) showTab('week');
});
