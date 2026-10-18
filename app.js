/* ATELIER — guardaroba personale: archivio locale, foto, modifica, lavatrice, idea del giorno, looks */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CATS = ['Maglieria', 'Camicie e T-shirt', 'Pantaloni e jeans', 'Giacche e capispalla', 'Scarpe', 'Accessori', 'Altro'];
const LABELS = {
  tipo: 'Tipo', colore: 'Colore', materiale: 'Materiale', texture: 'Texture',
  vestibilita: 'Vestibilità', stagione: 'Stagione', occasioni: 'Occasioni', compatibilita: 'Compatibilità'
};
const FIELDS = Object.keys(LABELS);
const MAIN_FIELDS = ['tipo', 'colore'];
const TABS = ['today', 'wardrobe', 'looks', 'add'];
const MAX_PHOTOS = 40;
const PARALLEL = 3;
const PHOTO_W = 720;
const PHOTO_H = 900;

let drafts = [];
let analyzing = false;
let filter = 'Tutti';
let detailId = null;
let editingLookId = null;
let ideaN = 0;
let idea = null;
let todayEvents = null; // null = calendario non collegato
let eventsError = '';
let eventsAt = 0;
let place = null;       // luogo scelto per il meteo: { name, lat, lon }
try { place = JSON.parse(localStorage.getItem('atelier_place')); } catch { /* nessun luogo salvato */ }
let weather = null;     // previsioni di oggi: { tmin, tmax, rain }
let weatherError = '';
let weatherAt = 0;
let wxNow = null;       // profilo del meteo usato per scegliere i capi
let lastTags = [];
let lastKey = '';
let manualEvents = []; // impegni aggiunti a mano per oggi (restano su questo dispositivo)

/* ---------- Archivio locale (IndexedDB) ---------- */

const STORES = { garments: 'id', looks: 'id', photos: 'id', deleted: 'key' };

const dbp = new Promise((resolve, reject) => {
  const r = indexedDB.open('atelier-v1', 4);
  r.onupgradeneeded = () => {
    for (const [name, keyPath] of Object.entries(STORES)) {
      if (!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name, { keyPath });
    }
  };
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

async function all(store = 'garments') {
  const db = await dbp;
  return new Promise((res, rej) => {
    const r = db.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function put(item, store = 'garments') {
  const db = await dbp;
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).put(item);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
}

async function del(id, store = 'garments') {
  const db = await dbp;
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(id);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
}

// Modifica un capo o un look: la data di modifica serve alla sincronizzazione tra dispositivi
async function update(store, id, changes) {
  const item = (await all(store)).find(x => x.id === id);
  if (!item) return null;
  const next = { ...item, ...changes, updatedAt: Date.now() };
  for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
  await put(next, store);
  return next;
}

// Elimina in locale e annota la rimozione: alla prossima sincronizzazione arriva agli altri dispositivi
async function removeItem(id, kind) {
  await del(id, kind === 'look' ? 'looks' : 'garments');
  if (kind === 'garment') { await del(id, 'photos'); forgetPhoto(id); }
  await put({ key: kind + '-' + id, kind, id, at: Date.now() }, 'deleted');
}

/* ---------- Fotografie ---------- */

const photoUrls = new Map();

async function loadPhotos() {
  const rows = await all('photos');
  const seen = new Set(rows.map(r => r.id));
  for (const r of rows) if (!photoUrls.has(r.id)) photoUrls.set(r.id, URL.createObjectURL(r.blob));
  for (const [id, url] of photoUrls) if (!seen.has(id)) { URL.revokeObjectURL(url); photoUrls.delete(id); }
}

function forgetPhoto(id) {
  const url = photoUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  photoUrls.delete(id);
}

const photoSrc = id => photoUrls.get(id) || '';

function photoHtml(id, cls, alt) {
  const src = photoSrc(id);
  if (src) return '<img class="' + cls + '" src="' + src + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
  return '<div class="' + cls.replace(' fade', '') + ' ph"><span>' + esc(alt) + '</span></div>';
}

// Le fotografie vecchie salvate dentro la scheda passano all'archivio foto
async function migrateLocalPhotos() {
  for (const g of await all()) {
    if (typeof g.img !== 'string') continue;
    const blob = await (await fetch(g.img)).blob();
    await put({ id: g.id, blob }, 'photos');
    const { img, ...meta } = g;
    await put(meta);
  }
}

function borderColor(img) {
  const k = 48, s = k / Math.max(img.width, img.height);
  const w = Math.max(2, Math.round(img.width * s)), h = Math.max(2, Math.round(img.height * s));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let r = 0, gr = 0, b = 0, n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 1 && x < w - 2 && y > 1 && y < h - 2) continue;
      const i = (y * w + x) * 4;
      r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++;
    }
  }
  return 'rgb(' + Math.round(r / n) + ',' + Math.round(gr / n) + ',' + Math.round(b / n) + ')';
}

// Tutte le foto diventano 4:5: il capo resta intero e lo sfondo prosegue con il colore del bordo
function photo(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement('canvas');
      c.width = PHOTO_W; c.height = PHOTO_H;
      const g = c.getContext('2d');
      g.fillStyle = borderColor(img);
      g.fillRect(0, 0, PHOTO_W, PHOTO_H);
      const s = Math.min(PHOTO_W / img.width, PHOTO_H / img.height);
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      g.drawImage(img, Math.round((PHOTO_W - w) / 2), Math.round((PHOTO_H - h) / 2), w, h);
      c.toBlob(b => (b ? res(b) : rej(Error('Foto non convertibile'))), 'image/jpeg', .8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(Error('Foto non leggibile')); };
    img.src = url;
  });
}

const blobToDataUrl = blob => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

/* ---------- Interfaccia di base ---------- */

let toastTimer;
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function ask(text, okLabel = 'Rimuovi') {
  return new Promise(resolve => {
    const dlg = $('#ask');
    $('#askText').textContent = text;
    $('#askOk').textContent = okLabel;
    $('#askOk').onclick = () => { dlg.close(); resolve(true); };
    $('#askCancel').onclick = () => { dlg.close(); resolve(false); };
    dlg.oncancel = () => resolve(false);
    dlg.showModal();
  });
}

function showTab(name) {
  for (const v of TABS) $('#view-' + v).classList.toggle('hidden', v !== name);
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  try { sessionStorage.setItem('atelier_tab', name); } catch { /* storage non disponibile */ }
  window.scrollTo(0, 0);
  if (name === 'today') { refreshEvents(); refreshWeather(); }
}

const known = v => (v && !/^non determinabile$/i.test(v) ? v : '');
const catOf = d => (CATS.includes(d.categoria) ? d.categoria : 'Altro');
const washing = d => d.stato === 'lavatrice';

// Le immagini compaiono con una dissolvenza quando sono pronte
document.addEventListener('load', e => { if (e.target.classList?.contains('fade')) e.target.classList.add('ready'); }, true);
const revealImages = () => document.querySelectorAll('img.fade').forEach(i => { if (i.complete) i.classList.add('ready'); });

async function renderAll() {
  await loadPhotos();
  const [garments, looks] = await Promise.all([all(), all('looks')]);
  renderWardrobe(garments);
  renderToday(garments, looks);
  renderLooks(looks, garments);
  revealImages();
}

/* ---------- Guardaroba ---------- */

function cardHtml(d) {
  return '<button class="card' + (washing(d) ? ' washing' : '') + '" data-open="' + d.id + '">' +
    '<div class="card-img-wrap">' + photoHtml(d.id, 'card-img fade', d.tipo || 'Capo') + (d.preferito ? '<span class="fav" aria-label="Preferito">' + HEART + '</span>' : '') + '</div>' +
    '<div class="card-body"><strong>' + esc(d.tipo || 'Capo') + '</strong><span>' +
    (washing(d) ? 'In lavatrice' : (esc(known(d.colore)) || '&nbsp;')) + '</span></div></button>';
}

function renderWardrobe(items) {
  $('#count').textContent = items.length;
  $('#empty').classList.toggle('hidden', items.length > 0);

  const favs = items.filter(d => d.preferito);
  const present = CATS.filter(c => items.some(d => catOf(d) === c));
  if (filter === 'Preferiti' ? !favs.length : filter !== 'Tutti' && !present.includes(filter)) filter = 'Tutti';

  $('#chips').innerHTML = items.length
    ? ['Tutti', ...(favs.length ? ['Preferiti'] : []), ...present].map(c => {
        const n = c === 'Tutti' ? items.length : c === 'Preferiti' ? favs.length : items.filter(d => catOf(d) === c).length;
        return '<button class="chip" data-filter="' + esc(c) + '" aria-pressed="' + (c === filter) + '">' + esc(c) + ' ' + n + '</button>';
      }).join('')
    : '';

  const list = filter === 'Preferiti' ? favs : items;
  $('#wardrobe').innerHTML = CATS
    .filter(c => list.some(d => catOf(d) === c) && (filter === 'Tutti' || filter === 'Preferiti' || c === filter))
    .map(c => '<h3 class="cat">' + esc(c) + '</h3><div class="grid">' + list.filter(d => catOf(d) === c).map(cardHtml).join('') + '</div>')
    .join('');
}

$('#wardrobe').addEventListener('click', e => {
  const card = e.target.closest('[data-open]');
  if (card) openDetail(card.dataset.open);
});

$('#chips').addEventListener('click', e => {
  const chip = e.target.closest('[data-filter]');
  if (chip) { filter = chip.dataset.filter; renderAll(); }
});

/* ---------- Scheda del capo: dettagli, modifica, lavatrice ---------- */

async function openDetail(id) {
  const item = (await all()).find(d => d.id === id);
  if (!item) return;
  detailId = id;
  await loadPhotos();
  const src = photoSrc(id);
  $('#detailImg').classList.toggle('hidden', !src);
  if (src) $('#detailImg').src = src;
  $('#detailImg').alt = item.tipo || 'Capo';
  $('#detailPhotoLabel').classList.toggle('hidden', !!src);
  $('#detailTitle').textContent = item.tipo || 'Capo';
  const rows = [['Categoria', catOf(item)], ...FIELDS.filter(f => f !== 'tipo').map(f => [LABELS[f], known(item[f])])];
  rows.push(['Indossato', wornText(item)]);
  if (washing(item)) rows.unshift(['Stato', 'In lavatrice']);
  $('#detailFields').innerHTML = rows.filter(r => r[1]).map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('');
  $('#detailWash').textContent = washing(item) ? 'Segna come lavato' : 'Metti in lavatrice';
  setFav(!!item.preferito);
  $('#editForm').innerHTML =
    '<label>Categoria<select name="categoria">' + CATS.map(c => '<option' + (c === catOf(item) ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label>' +
    FIELDS.map(f => '<label>' + LABELS[f] + '<input name="' + f + '" value="' + esc(item[f]) + '" autocomplete="off"></label>').join('') +
    '<div class="actions"><button type="submit" class="btn">Salva modifiche</button><button type="button" class="btn secondary" id="editCancel">Annulla</button></div>';
  setEditing(false);
  $('#detail').showModal();
}

function setEditing(on) {
  $('#editForm').classList.toggle('hidden', !on);
  $('#detailFields').classList.toggle('hidden', on);
  $('#detailActions').classList.toggle('hidden', on);
}

function setFav(on) {
  const b = $('#detailFav');
  b.setAttribute('aria-pressed', String(on));
  b.innerHTML = (on ? HEART + ' ' : '') + (on ? 'Nei preferiti' : 'Aggiungi ai preferiti');
}

$('#detailFav').onclick = async () => {
  const item = (await all()).find(d => d.id === detailId);
  if (!item) return;
  const on = !item.preferito;
  await update('garments', detailId, { preferito: on || undefined });
  setFav(on);
  const b = $('#detailFav');
  b.classList.remove('bump');
  void b.offsetWidth;
  if (on) { b.classList.add('bump'); navigator.vibrate?.(10); }
  await renderAll();
  await window.atelierDriveSync?.();
};

$('#detailPhoto').onchange = async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !detailId) return;
  try {
    await put({ id: detailId, blob: await photo(file) }, 'photos');
  } catch {
    toast('Foto non leggibile');
    return;
  }
  await update('garments', detailId, {});
  forgetPhoto(detailId);
  $('#detail').close();
  await renderAll();
  toast('Foto aggiunta');
  await window.atelierDriveSync?.();
};

$('#detailEdit').onclick = () => setEditing(true);
$('#editForm').addEventListener('click', e => { if (e.target.id === 'editCancel') setEditing(false); });

$('#editForm').onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  await update('garments', detailId, data);
  $('#detail').close();
  await renderAll();
  toast('Modifiche salvate');
  await window.atelierDriveSync?.();
};

$('#detailWash').onclick = async () => {
  const item = (await all()).find(d => d.id === detailId);
  if (!item) return;
  await setWash([detailId], !washing(item));
  $('#detail').close();
};

$('#detailClose').onclick = () => $('#detail').close();

$('#detailDelete').onclick = async () => {
  if (!detailId || !(await ask('Rimuovere questo capo dal guardaroba?'))) return;
  await removeItem(detailId, 'garment');
  detailId = null;
  $('#detail').close();
  await renderAll();
  toast('Capo rimosso');
  await window.atelierDriveSync?.();
};

async function setWash(ids, on) {
  for (const id of ids) await update('garments', id, { stato: on ? 'lavatrice' : undefined });
  await renderAll();
  toast(on ? (ids.length === 1 ? 'In lavatrice' : ids.length + ' capi in lavatrice') : (ids.length === 1 ? 'Segnato come lavato' : ids.length + ' capi lavati'));
  await window.atelierDriveSync?.();
}

/* ---------- Oggi: idea del giorno, capi lavati e in lavatrice ---------- */

const SEASONS = ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'estate', 'estate', 'estate', 'autunno', 'autunno', 'autunno', 'inverno'];

function seasonFit(g) {
  const s = (g.stagione || '').toLowerCase();
  if (!s || /non determinabile|tutte|ogni|quattro|tutto l/.test(s)) return 1;
  const wanted = wxNow ? wxNow.seasons : [SEASONS[new Date().getMonth()]];
  return wanted.some(x => s.includes(x)) ? 2 : 0;
}

/* ---------- Meteo di oggi (Open-Meteo, senza chiavi) ---------- */

// Dalle previsioni di oggi ricava stagioni adatte, bisogno di capospalla e pioggia
function wxProfile(w) {
  if (!w) return null;
  const rainy = w.rain >= 50;
  const band = w.tmax < 12 ? 'freddo' : w.tmax < 19 ? 'fresco' : w.tmax < 26 ? 'mite' : 'caldo';
  return {
    band,
    rainy,
    seasons: { freddo: ['inverno', 'autunno'], fresco: ['autunno', 'primavera'], mite: ['primavera', 'estate'], caldo: ['estate'] }[band],
    needOuter: band === 'freddo' || (band === 'fresco' && (w.tmin < 12 || rainy)) || (band === 'mite' && rainy)
  };
}

const wxText = w => w.tmin + '–' + w.tmax + '°C, pioggia ' + w.rain + '%';

async function refreshWeather(force = false) {
  if (!place) return;
  if (!force && weather && Date.now() - weatherAt < 30 * 60 * 1000) return;
  weatherAt = Date.now();
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
      latitude: place.lat, longitude: place.lon, timezone: 'auto', forecast_days: '1',
      daily: 'apparent_temperature_max,apparent_temperature_min,precipitation_probability_max'
    }));
    if (!r.ok) throw Error('Meteo non raggiungibile (' + r.status + ')');
    const d = (await r.json()).daily;
    weather = { tmin: Math.round(d.apparent_temperature_min[0]), tmax: Math.round(d.apparent_temperature_max[0]), rain: d.precipitation_probability_max?.[0] ?? 0 };
    weatherError = '';
  } catch (e) {
    weather = null;
    weatherError = e instanceof TypeError ? 'Meteo non disponibile senza connessione.' : e.message;
  }
  idea = null;
  await renderAll();
}

function setPlace(p) {
  place = p;
  try { localStorage.setItem('atelier_place', JSON.stringify(p)); } catch { /* storage non disponibile */ }
  $('#weatherSetup').classList.add('hidden');
  return refreshWeather(true);
}

function renderWeather() {
  let html = '<h2>Meteo di oggi</h2>';
  if (!place) {
    html += '<p class="muted">' + esc(weatherError || 'Indica dove sei per avere capi adatti a temperatura e pioggia.') + '</p>';
    $('#weatherSetup').classList.remove('hidden');
  } else if (weather) {
    html += '<p>' + esc(place.name) + ' · ' + esc(wxText(weather)) + (wxNow?.rainy ? '. Porta un ombrello.' : '') + '</p>' +
      '<button class="link-btn neutral" data-wx="change">Cambia luogo</button>';
  } else if (weatherError) {
    html += '<p class="muted">' + esc(weatherError) + '</p><button class="link-btn neutral" data-wx="retry">Riprova</button> <button class="link-btn neutral" data-wx="change">Cambia luogo</button>';
  } else {
    html += '<p class="muted">Caricamento del meteo…</p>';
  }
  $('#weatherInfo').innerHTML = html;
}

$('#weather').addEventListener('click', e => {
  const b = e.target.closest('[data-wx]');
  if (!b) return;
  if (b.dataset.wx === 'change') $('#weatherSetup').classList.remove('hidden');
  else refreshWeather(true);
});

$('#useLocation').onclick = () => {
  if (!navigator.geolocation) { weatherError = 'Il dispositivo non fornisce la posizione: scrivi la città.'; return renderAll(); }
  navigator.geolocation.getCurrentPosition(
    pos => setPlace({ name: 'La tua posizione', lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2) }),
    () => { weatherError = 'Posizione non autorizzata: scrivi la città.'; renderAll(); },
    { timeout: 10000, maximumAge: 3600000 }
  );
};

$('#weatherForm').onsubmit = async e => {
  e.preventDefault();
  const name = $('#weatherCity').value.trim();
  if (!name) return;
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name, count: '1', language: 'it' }));
    const found = (await r.json()).results?.[0];
    if (!found) throw Error('Città non trovata: controlla il nome.');
    $('#weatherCity').value = '';
    await setPlace({ name: found.name, lat: +found.latitude.toFixed(2), lon: +found.longitude.toFixed(2) });
  } catch (err) {
    weatherError = err instanceof TypeError ? 'Ricerca della città non riuscita: controlla la connessione.' : err.message;
    renderAll();
  }
};

// Occasioni riconosciute dal titolo degli impegni; kw cerca la stessa occasione nel campo «occasioni» dei capi
// Parole che iniziano con questi testi (così «riunioni» e «cene» valgono, «scena» e «transport» no)
const startsWith = words => new RegExp('(?<![a-zàèéìòù])(?:' + words.join('|') + ')', 'i');

// re: parole nel titolo dell'impegno; kw: parole nel campo «occasioni» dei capi. Un impegno può avere più occasioni.
const OCCASIONS = [
  {
    tag: 'cerimonia',
    re: startsWith(['cerimoni', 'matrimoni', 'nozze', 'battesim', 'comunione', 'cresima', 'laurea', 'funerale', 'gala\\b', 'inaugurazion', 'premiazion']),
    kw: startsWith(['cerimoni', 'elegan', 'formal', 'matrimoni', 'festa', 'serata', 'gala'])
  },
  {
    tag: 'serata',
    re: startsWith(['cena', 'cene\\b', 'aperitiv', 'apericena', 'ristorant', 'pizzeria', 'trattoria', 'osteria', 'festa', 'party', 'compleanno', 'anniversari', 'teatro', 'concerto', 'cinema', 'opera\\b', 'musical', 'mostra', 'vernissage', 'drink', 'cocktail', 'happy hour', 'brindisi', 'serata', 'evento', 'discoteca', 'degustazion', 'dinner', 'appuntamento romantico', 'primo appuntamento']),
    kw: startsWith(['serata', 'cena', 'aperitiv', 'elegan', 'event', 'festa', 'formal', 'sera', 'uscita'])
  },
  {
    tag: 'lavoro',
    re: startsWith(['riunion', 'meeting', 'call', 'videocall', 'videochiamat', 'cliente', 'clienti', 'colloquio', 'presentazion', 'ufficio', 'lavoro', 'workshop', 'intervist', 'review', 'demo\\b', 'stand-?up', 'kick-?off', 'conferenz', 'convegno', 'congresso', 'fiera', 'seminari', 'formazione', 'trattativa', 'consulenza', 'assemblea', 'direttivo', 'board', 'sopralluogo', 'esame', 'lezione', 'sync']),
    kw: startsWith(['lavoro', 'ufficio', 'business', 'formal', 'elegan', 'riunion', 'smart', 'professional'])
  },
  {
    tag: 'sport',
    re: startsWith(['palestra', 'gym', 'workout', 'corsa', 'running', 'yoga', 'pilates', 'allenament', 'sport\\b', 'sportiv', 'calcio', 'calcetto', 'tennis', 'padel', 'nuoto', 'piscina', 'bici', 'ciclismo', 'spinning', 'crossfit', 'fitness', 'trekking', 'escursion', 'camminata', 'sci\\b', 'snowboard', 'golf\\b', 'basket', 'pallavolo', 'boxe', 'arrampicata', 'danza', 'surf', 'vela\\b']),
    kw: startsWith(['sport', 'palestra', 'allenam', 'attiv', 'fitness', 'corsa', 'outdoor'])
  },
  {
    tag: 'viaggio',
    re: startsWith(['volo\\b', 'treno', 'viaggio', 'aeroporto', 'aereo', 'stazione', 'partenza', 'rientro', 'trasferta', 'check-?in', 'imbarco', 'hotel', 'vacanza', 'gita', 'transfer']),
    kw: startsWith(['viaggio', 'comod', 'casual', 'trasferta', 'travel'])
  },
  {
    tag: 'casual',
    re: startsWith(['pranzo', 'brunch', 'colazione', 'caff[eè]', 'shopping', 'amici\\b', 'passeggiata', 'picnic', 'grigliata', 'barbecue', 'parco\\b', 'museo', 'mercatino', 'spiaggia', 'mare\\b', 'famiglia', 'bambini', 'relax', 'weekend', 'tempo libero']),
    kw: startsWith(['casual', 'quotidian', 'tempo libero', 'comod', 'relax', 'weekend', 'informal'])
  }
];

// Un impegno può rientrare in più occasioni (es. «cena di lavoro»: serata e lavoro)
function dayOccasions(events) {
  const matched = [];
  for (const ev of events || []) {
    const occs = ev.tag ? OCCASIONS.filter(o => o.tag === ev.tag) : OCCASIONS.filter(o => o.re.test(ev.title));
    for (const occ of occs) matched.push({ occ, ev });
  }
  return matched;
}

const eventTime = ev => (ev.manual ? 'Da te' : ev.allDay ? 'Tutto il giorno' : new Date(ev.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));

function occasionFit(g, tags) {
  if (!tags.length) return 1;
  const o = (g.occasioni || '').toLowerCase();
  if (!o || /non determinabile/.test(o)) return 1;
  return tags.some(t => t.kw.test(o)) ? 2 : .25;
}

/* ---------- Capi indossati e preferiti ---------- */

const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
const wornToday = g => (g.indossato || []).includes(todayStr());

function daysSinceWorn(g) {
  const last = (g.indossato || []).at(-1);
  return last ? Math.round((new Date(todayStr()) - new Date(last)) / 86400000) : null;
}

function wornText(g) {
  const n = (g.indossato || []).length;
  if (!n) return 'Non ancora';
  const d = daysSinceWorn(g);
  return n + (n === 1 ? ' volta' : ' volte') + ', l\u2019ultima ' + (d === 0 ? 'oggi' : d === 1 ? 'ieri' : d + ' giorni fa');
}

// Preferiti più probabili; i capi appena indossati riposano, quelli dimenticati tornano a farsi vedere
function affinity(g) {
  let f = g.preferito ? 1.5 : 1;
  const d = daysSinceWorn(g);
  if (d === null) f *= 1.15;
  else if (d < 2) f *= .35;
  else if (d < 5) f *= .7;
  else if (d >= 21) f *= 1.25;
  return f;
}

function weight(g, tags) {
  const s = seasonFit(g);
  return s ? (s === 2 ? 3 : 1) * occasionFit(g, tags) * affinity(g) : 0;
}

// Sceglie a caso, ma con più probabilità i capi adatti alla stagione e agli impegni di oggi
function pickOne(pool, tags, strict = false) {
  let src = pool.filter(g => weight(g, tags) > 0);
  if (!src.length) src = strict ? [] : pool;
  if (!src.length) return null;
  const weights = src.map(g => weight(g, tags) || 1);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < src.length; i++) { r -= weights[i]; if (r <= 0) return src[i]; }
  return src[src.length - 1];
}

function generateOutfit(clean, tags) {
  const inCats = (...cats) => clean.filter(g => cats.includes(catOf(g)));
  // con il caldo magliette e camicie, con il freddo maglieria (se ce ne sono)
  let tops = inCats('Maglieria', 'Camicie e T-shirt');
  const preferred = wxNow?.band === 'caldo' ? inCats('Camicie e T-shirt') : wxNow?.band === 'freddo' ? inCats('Maglieria') : [];
  if (preferred.length) tops = preferred;
  const top = pickOne(tops, tags);
  const bottom = pickOne(inCats('Pantaloni e jeans'), tags);
  const shoes = pickOne(inCats('Scarpe'), tags);
  const missing = [];
  if (!top) missing.push('un capo sopra');
  if (!bottom) missing.push('pantaloni o jeans');
  if (!shoes) missing.push('delle scarpe');
  if (missing.length) return { missing };

  const picked = [top, bottom, shoes];
  const outers = inCats('Giacche e capispalla');
  const outer = wxNow ? (wxNow.needOuter ? pickOne(outers, tags, true) : null) : pickOne(outers, tags, true);
  if (outer) picked.push(outer);
  const warn = wxNow?.needOuter && !outer ? (wxNow.rainy ? 'Piove: non hai capispalla lavati adatti.' : 'Fa fresco: non hai capispalla lavati adatti.') : '';
  const extra = Math.random() < .4 ? pickOne(inCats('Accessori'), tags) : null;
  if (extra) picked.push(extra);
  return { title: 'Outfit suggerito', ids: picked.map(g => g.id), warn };
}

// Con impegni particolari il primo suggerimento è un outfit su misura; altrimenti vengono prima i look salvati
function makeIdea(clean, looks, n, tags) {
  const ids = new Set(clean.map(g => g.id));
  const byId = new Map(clean.map(g => [g.id, g]));
  const ready = looks.filter(l => l.capi?.length && l.capi.every(id => ids.has(id) && seasonFit(byId.get(id)) > 0)).map(l => ({ title: l.nome, ids: l.capi }));
  const slots = tags.length ? ['gen', ...ready] : ready;
  const slot = slots[n];
  if (slot && slot !== 'gen') return slot;
  return generateOutfit(clean, tags);
}

function miniHtml(d, on) {
  return '<div class="mini">' + photoHtml(d.id, 'mini-img fade', d.tipo || 'Capo') +
    '<div class="mini-body"><strong>' + esc(d.tipo || 'Capo') + '</strong>' +
    '<button class="btn secondary" data-wash="' + d.id + '" data-on="' + on + '">' + (on ? 'In lavatrice' : 'Lavato') + '</button></div></div>';
}

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

function readManual() {
  try {
    const o = JSON.parse(localStorage.getItem('atelier_manual') || '{}');
    manualEvents = o.date === todayStr() && Array.isArray(o.items) ? o.items : [];
  } catch {
    manualEvents = [];
  }
}

function saveManual() {
  try { localStorage.setItem('atelier_manual', JSON.stringify({ date: todayStr(), items: manualEvents })); } catch { /* storage non disponibile */ }
}

async function addManual(title, tag) {
  title = title.trim();
  if (!title) return;
  manualEvents.push({ title, tag, manual: true, allDay: true });
  saveManual();
  idea = null;
  await renderAll();
}

function renderAgenda(matched, events) {
  const signedIn = !!window.atelierToken?.();
  const label = new Map();
  for (const m of matched) label.set(m.ev, [...(label.get(m.ev) || []), m.occ.tag]);
  let html = '<h2>Impegni di oggi</h2>';
  if (eventsError) {
    html += '<p class="muted">' + esc(eventsError) + '</p>';
  } else if (signedIn && todayEvents === null && window.atelierCalendarOk?.()) {
    html += '<p class="muted">Caricamento degli impegni…</p>';
  } else if (signedIn && todayEvents === null) {
    html += '<p class="muted">Collega Google Calendar per avere un\'idea su misura per i tuoi impegni. Gli eventi restano sul tuo dispositivo.</p>' +
      '<div class="actions"><button class="btn secondary" data-cal="connect">Collega il calendario</button></div>';
  } else if (!events.length) {
    html += '<p class="muted">Nessun impegno per oggi.</p>';
  }
  if (events.length) {
    html += '<ul class="agenda-list">' + events.map(ev =>
      '<li><span class="time">' + esc(eventTime(ev)) + '</span><span>' + esc(ev.title) + '</span>' +
      (label.has(ev) ? '<span class="occ">' + esc(label.get(ev).join(', ')) + '</span>' : '') +
      (ev.manual ? '<button class="link-btn" data-manual-del="' + manualEvents.indexOf(ev) + '" aria-label="Rimuovi ' + esc(ev.title) + '">Rimuovi</button>' : '') +
      '</li>').join('') + '</ul>';
  }
  $('#agendaInfo').innerHTML = html;
}

let shownIdea = '';

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Saluto personale: ora del giorno, nome dal profilo Google, e una frase su tempo e impegni
function renderGreeting(events, count) {
  const now = new Date();
  const h = now.getHours();
  const hello = h < 5 ? 'Buonanotte' : h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const name = localStorage.getItem('atelier_name');
  $('#greeting').textContent = name ? hello + ', ' + name : hello;
  $('#todayDate').textContent = cap(now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));

  const bits = [];
  if (weather && wxNow) {
    bits.push({ freddo: 'Fa freddo', fresco: 'Fa fresco', mite: 'Il clima è mite', caldo: 'Fa caldo' }[wxNow.band] + ' (' + weather.tmin + '–' + weather.tmax + '°C)' + (wxNow.rainy ? ' e può piovere' : ''));
  }
  if (events.length) {
    const first = events.find(e => !e.manual && !e.allDay);
    bits.push((events.length === 1 ? 'Hai un impegno' : 'Hai ' + events.length + ' impegni') + (first ? ', il primo alle ' + eventTime(first) : ''));
  }
  if (count && idea && !idea.missing) bits.push(bits.length ? 'Ti ho preparato un outfit' : 'Ecco un’idea per oggi');
  $('#todayLine').textContent = bits.length ? bits.join('. ') + '.' : '';
}

function renderToday(garments, looks) {
  const clean = garments.filter(g => !washing(g));
  const dirty = garments.filter(washing);
  $('#todayEmpty').classList.toggle('hidden', garments.length > 0);
  $('#todayContent').classList.toggle('hidden', !garments.length);

  readManual();
  wxNow = wxProfile(weather);
  renderWeather();
  const events = [...(todayEvents || []), ...manualEvents];
  const matched = dayOccasions(events);
  const tags = [...new Map(matched.map(m => [m.occ.tag, m.occ])).values()];
  const key = tags.map(t => t.tag).join(',') + '|' + (wxNow ? wxNow.band + wxNow.rainy : '');
  lastTags = tags;
  lastKey = key;
  renderAgenda(matched, events);

  const byId = new Map(garments.map(g => [g.id, g]));
  if (!idea || idea.key !== key || idea.missing || !idea.ids?.every(id => byId.has(id) && !washing(byId.get(id)))) {
    idea = { ...makeIdea(clean, looks, ideaN, tags), key };
  }
  const byEvent = new Map();
  for (const m of matched) byEvent.set(m.ev, [...(byEvent.get(m.ev) || []), m.occ.tag]);
  const note = byEvent.size
    ? '<p class="small">Pensato per ' + [...byEvent].slice(0, 3).map(([ev, tg]) =>
        ev.manual && ev.tag ? esc(tg[0]) + ' (aggiunto da te)' : esc(ev.title) + (ev.manual ? '' : ', ' + esc(eventTime(ev))) + ' (' + esc(tg.join(', ')) + ')').join(' e ') + '.</p>'
    : '';

  // Un capo che non indossi da tempo merita una menzione
  const forgotten = idea.missing ? null : idea.ids.map(id => byId.get(id)).filter(g => (daysSinceWorn(g) ?? 0) >= 30).sort((x, y) => daysSinceWorn(y) - daysSinceWorn(x))[0];
  const memory = forgotten ? '<p class="small">Include ' + esc(forgotten.tipo || 'un capo') + ', che non indossi da ' + (daysSinceWorn(forgotten) >= 60 ? 'due mesi' : 'più di un mese') + '.</p>' : '';

  const extra = (idea.why ? '<p class="small">' + esc(idea.why) + ' <a href="https://www.google.com/search?tbm=isch&q=' + encodeURIComponent((idea.person || '') + ' outfit') + '" target="_blank" rel="noopener">Vedi foto di riferimento</a></p>' : '') +
    (wxNow ? '<p class="small">Meteo: ' + esc(wxText(weather)) + (wxNow.rainy ? '. Porta un ombrello' : '') + '.</p>' : '') +
    (idea.warn ? '<p class="warn">' + esc(idea.warn) + '</p>' : '');

  if (idea.missing) {
    $('#idea').innerHTML = '<p class="muted">Per comporre un outfit servono capi lavati: ti mancano ' + idea.missing.join(', ') + '.</p>';
  } else {
    const sig = idea.ids.join(',');
    const enter = sig !== shownIdea;
    shownIdea = sig;
    $('#idea').innerHTML = '<h3>' + esc(idea.title) + '</h3>' + note + extra + memory + '<div class="strip' + (enter ? ' enter' : '') + '">' + idea.ids.map((id, i) => {
      const g = byId.get(id);
      return '<figure style="--i:' + i + '">' + photoHtml(id, 'strip-img fade', g.tipo || 'Capo') + (photoSrc(id) ? '<figcaption>' + esc(g.tipo || 'Capo') + '</figcaption>' : '') + '</figure>';
    }).join('') + '</div>';
  }

  renderGreeting(events, garments.length);
  const wear = $('#wearIdea');
  const wornAll = !idea.missing && idea.ids.every(id => wornToday(byId.get(id)));
  wear.classList.toggle('hidden', !!idea.missing);
  wear.classList.toggle('done', wornAll);
  wear.disabled = wornAll;
  wear.textContent = wornAll ? 'Indossato oggi' : 'Indosso questo';

  $('#cleanCount').textContent = clean.length;
  $('#washCount').textContent = dirty.length;
  $('#cleanList').innerHTML = CATS.filter(c => clean.some(g => catOf(g) === c)).map(c =>
    '<h4 class="cat-sm">' + esc(c) + '</h4><div class="mini-grid">' + clean.filter(g => catOf(g) === c).map(g => miniHtml(g, true)).join('') + '</div>').join('');
  $('#washList').innerHTML = dirty.length
    ? '<div class="mini-grid">' + dirty.map(g => miniHtml(g, false)).join('') + '</div>'
    : '<p class="small">Nessun capo in lavatrice.</p>';
  $('#washAll').classList.toggle('hidden', !dirty.length);
}

async function refreshEvents(force = false) {
  if (!window.atelierToken?.()) return;
  if (!force && Date.now() - eventsAt < 5 * 60 * 1000) return;
  eventsAt = Date.now();
  try {
    todayEvents = (await window.atelierEvents?.()) ?? null;
    eventsError = '';
  } catch (e) {
    todayEvents = null;
    eventsError = e.message;
  }
  idea = null;
  await renderAll();
}

$('#agenda').addEventListener('click', e => {
  if (e.target.closest('[data-cal=connect]')) window.atelierConnectCalendar?.();
  const occ = e.target.closest('[data-occ]');
  if (occ) addManual(occ.textContent, occ.dataset.occ);
  const del = e.target.closest('[data-manual-del]');
  if (del) {
    manualEvents.splice(+del.dataset.manualDel, 1);
    saveManual();
    idea = null;
    renderAll();
  }
});

$('#manualForm').onsubmit = async e => {
  e.preventDefault();
  await addManual($('#manualText').value);
  $('#manualText').value = '';
};

async function requestInspiration(person, riferimento = '') {
  const out = $('#inspoStatus');
  if (!person) return;
  if (!window.atelierToken?.()) { out.textContent = "Accedi con Google per usare l'ispirazione di stile."; return; }
  const garments = (await all()).filter(g => !washing(g));
  if (garments.length < 3) { out.textContent = 'Servono almeno tre capi lavati.'; return; }
  $('#inspoBtn').disabled = true;
  out.textContent = 'Sto componendo un outfit con i tuoi capi…';
  try {
    const r = await fetch('/api/inspire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.atelierToken() },
      body: JSON.stringify({
        person,
        ...(riferimento ? { riferimento } : {}),
        garments: garments.map(g => ({ id: g.id, categoria: catOf(g), tipo: g.tipo, colore: g.colore, materiale: g.materiale, stagione: g.stagione, occasioni: g.occasioni })),
        contesto: { occasioni: lastTags.map(t => t.tag), meteo: weather ? wxText(weather) : '' }
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(data.error || 'Errore ' + r.status);
    idea = { title: 'Ispirato a ' + person, ids: data.ids, why: data.motivo, person, key: lastKey };
    out.textContent = '';
    await renderAll();
  } catch (err) {
    out.textContent = err instanceof TypeError ? 'Nessuna connessione.' : err.message;
  } finally {
    $('#inspoBtn').disabled = false;
  }
}

$('#inspoForm').onsubmit = e => {
  e.preventDefault();
  requestInspiration($('#inspoName').value.trim());
};

/* ---------- Look reali delle celebrità: ricerca sul web con l'AI ---------- */

const CELEB_TTL = 24 * 60 * 60 * 1000;
const CELEB_DAILY_MAX = 15; // ogni ricerca usa credito OpenAI
let celeb = null;           // { persona, look, fonti, photo }

const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage non disponibile */ } };
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

const celebSearchesToday = () => { const q = readJson('atelier_celeb_n', {}); return q.date === todayStr() ? q.n : 0; };

// Ritratto da Wikipedia (licenze chiare): serve da accesso ai look, non è la foto dell'outfit
async function celebPhoto(name) {
  for (const lang of ['it', 'en']) {
    try {
      const r = await fetch('https://' + lang + '.wikipedia.org/w/api.php?' + new URLSearchParams({
        action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: name, gsrlimit: '1',
        prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '480'
      }));
      const page = Object.values((await r.json()).query?.pages || {})[0];
      const src = page?.thumbnail?.source;
      if (src && src.startsWith('https://upload.wikimedia.org/')) {
        return { src, title: page.title, page: 'https://' + lang + '.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_')) };
      }
    } catch { /* provo la lingua successiva */ }
  }
  return null;
}

function renderCeleb() {
  const box = $('#celeb');
  box.classList.toggle('hidden', !celeb);
  if (!celeb) { box.innerHTML = ''; return; }
  const n = celeb.look.length;
  const initials = celeb.persona.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  box.innerHTML =
    '<button type="button" class="celeb-photo" data-celeb-open aria-label="Apri i look di ' + esc(celeb.persona) + '">' +
    (celeb.photo ? '<img src="' + esc(celeb.photo.src) + '" alt="Foto di ' + esc(celeb.persona) + '" referrerpolicy="no-referrer">' : '<span>' + esc(initials) + '</span>') + '</button>' +
    '<div><strong>' + esc(celeb.persona) + '</strong><p class="small">' + n + (n === 1 ? ' look trovato' : ' look trovati') + '. Tocca la foto per vedere i componenti.</p>' +
    (celeb.photo ? '<p class="small">Foto: <a href="' + esc(celeb.photo.page) + '" target="_blank" rel="noopener noreferrer">Wikipedia</a></p>' : '') + '</div>';
}

async function openCeleb() {
  if (!celeb) return;
  const garments = await all();
  $('#celebTitle').textContent = celeb.persona;
  $('#celebBody').innerHTML = celeb.look.map((l, i) => {
    const meta = [l.occasione, l.data].filter(Boolean).join(', ');
    return '<details class="celeb-look"' + (i === 0 ? ' open' : '') + '><summary>' + esc(l.titolo || 'Look ' + (i + 1)) + (meta ? ' <span class="small">' + esc(meta) + '</span>' : '') + '</summary>' +
      (l.descrizione ? '<p>' + esc(l.descrizione) + '</p>' : '') +
      '<ul class="parts">' + l.componenti.map(c => {
        const mine = findSimilar(c.capo, garments);
        const b = c.budget || {};
        const shop = [b.negozio, b.prezzo].filter(Boolean).join(', ');
        return '<li><div><strong>' + esc(c.capo) + '</strong>' + (c.marca ? ' · ' + esc(c.marca) : ' · <span class="small">marca non indicata</span>') +
          (c.dettaglio ? '<div class="small">' + esc(c.dettaglio) + '</div>' : '') + '</div>' +
          (b.descrizione ? '<div class="budget"><span class="small">Versione accessibile</span> ' + esc(b.descrizione) + (shop ? ' <span class="small">(' + esc(shop) + ')</span>' : '') + '</div>' : '') +
          (mine ? '<div class="small mine">Simile nel tuo guardaroba: ' + esc(mine.tipo) + '</div>' : '') + '</li>';
      }).join('') + '</ul>' +
      '<button type="button" class="btn secondary" data-celeb-compose="' + i + '">Componi con i miei capi</button></details>';
  }).join('') +
    (celeb.fonti?.length ? '<h3 class="cat-sm">Fonti</h3><ul class="sources">' + celeb.fonti.map(f => '<li><a href="' + esc(f.url) + '" target="_blank" rel="noopener noreferrer">' + esc(f.titolo || hostOf(f.url)) + '</a></li>').join('') + '</ul>' : '') +
    '<p class="small">Informazioni raccolte dal web con l\'AI: possono essere incomplete o imprecise. Prezzi indicativi. Le foto degli outfit si vedono nelle fonti.</p>';
  $('#celebDialog').showModal();
}

$('#celebBtn').onclick = async () => {
  const person = $('#inspoName').value.trim();
  const out = $('#inspoStatus');
  if (!person) { out.textContent = 'Scrivi il nome di una persona.'; return; }
  if (!window.atelierToken?.()) { out.textContent = 'Accedi con Google per cercare i look.'; return; }

  const key = norm(person);
  const cache = readJson('atelier_celeb', {});
  if (cache[key] && Date.now() - cache[key].at < CELEB_TTL) {
    celeb = cache[key].data;
    out.textContent = '';
    renderCeleb();
    return;
  }
  if (celebSearchesToday() >= CELEB_DAILY_MAX) {
    out.textContent = 'Hai raggiunto il limite di ' + CELEB_DAILY_MAX + ' ricerche per oggi: ogni ricerca usa credito OpenAI.';
    return;
  }

  $('#celebBtn').disabled = true;
  out.textContent = 'Cerco i suoi look sul web: può richiedere fino a un minuto…';
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 58000);
  try {
    const r = await fetch('/api/celebrity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.atelierToken() },
      body: JSON.stringify({ person }),
      signal: ctl.signal
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(data.error || 'Errore ' + r.status);
    writeJson('atelier_celeb_n', { date: todayStr(), n: celebSearchesToday() + 1 });
    data.photo = await celebPhoto(data.persona);
    celeb = data;
    const recent = Object.entries({ ...cache, [key]: { at: Date.now(), data } }).sort((x, y) => y[1].at - x[1].at).slice(0, 10);
    writeJson('atelier_celeb', Object.fromEntries(recent));
    out.textContent = '';
    renderCeleb();
  } catch (err) {
    out.textContent = err.name === 'AbortError' ? 'La ricerca ha impiegato troppo tempo: riprova.' : err instanceof TypeError ? 'Nessuna connessione.' : err.message;
  } finally {
    clearTimeout(timer);
    $('#celebBtn').disabled = false;
  }
};

$('#celeb').addEventListener('click', e => { if (e.target.closest('[data-celeb-open]')) openCeleb(); });
$('#celebClose').onclick = () => $('#celebDialog').close();
$('#celebBody').addEventListener('click', e => {
  const b = e.target.closest('[data-celeb-compose]');
  if (!b || !celeb) return;
  const l = celeb.look[+b.dataset.celebCompose];
  const riferimento = (l.titolo + ': ' + l.componenti.map(c => [c.capo, c.marca, c.dettaglio].filter(Boolean).join(' ')).join('; ')).slice(0, 900);
  $('#celebDialog').close();
  requestInspiration(celeb.persona, riferimento);
});

$('#wearIdea').onclick = async () => {
  if (!idea?.ids) return;
  const today = todayStr();
  const garments = await all();
  for (const id of idea.ids) {
    const g = garments.find(x => x.id === id);
    if (g && !wornToday(g)) await update('garments', id, { indossato: [...(g.indossato || []), today].slice(-60) });
  }
  navigator.vibrate?.(12);
  const name = localStorage.getItem('atelier_name');
  toast(name ? 'Buona giornata, ' + name + '.' : 'Buona giornata.');
  await renderAll();
  await window.atelierDriveSync?.();
};

$('#anotherIdea').onclick = async () => {
  ideaN++;
  idea = null;
  await renderAll();
};

$('#view-today').addEventListener('click', e => {
  const b = e.target.closest('[data-wash]');
  if (b) setWash([b.dataset.wash], b.dataset.on === 'true');
});

$('#washAll').onclick = async () => {
  const ids = (await all()).filter(washing).map(g => g.id);
  if (ids.length) await setWash(ids, false);
};

$('#goAdd').onclick = () => showTab('add');
$('#goAddToday').onclick = () => showTab('add');
document.querySelectorAll('.tab').forEach(t => { t.onclick = () => showTab(t.dataset.tab); });

/* ---------- Aggiungi capi ---------- */

const photosInput = $('#photos');

function updatePicked() {
  const n = photosInput.files.length;
  const tooMany = n > MAX_PHOTOS;
  $('#pickedTitle').textContent = n ? (n === 1 ? '1 fotografia selezionata' : n + ' fotografie selezionate') : 'Scegli le fotografie';
  $('#pickedHint').textContent = n ? 'Tocca per cambiare la selezione' : 'Tocca qui oppure trascina i file';
  $('#analyze').textContent = n ? 'Analizza ' + n + (n === 1 ? ' fotografia' : ' fotografie') : 'Analizza le fotografie';
  $('#analyze').disabled = !n || tooMany || analyzing;
  $('#manual').disabled = !n || tooMany || analyzing;
}

photosInput.addEventListener('change', () => {
  updatePicked();
  const n = photosInput.files.length;
  $('#status').textContent = n > MAX_PHOTOS ? 'Massimo ' + MAX_PHOTOS + ' fotografie alla volta: ne hai scelte ' + n + '.' : '';
});

const zone = $('#dropzone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('over'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('over');
  const dt = new DataTransfer();
  for (const f of e.dataTransfer.files) if (f.type.startsWith('image/')) dt.items.add(f);
  photosInput.files = dt.files;
  photosInput.dispatchEvent(new Event('change'));
});

function draftHtml(d, i) {
  const input = f => '<label>' + LABELS[f] + '<input data-index="' + i + '" data-field="' + f + '" value="' + esc(d[f]) + '"></label>';
  return '<article class="draft' + (d.pending ? ' pending' : '') + '" id="draft-' + i + '"><img src="' + d.preview + '" alt="Capo da rivedere">' +
    '<div class="draft-body"><div class="draft-head"><span class="status">' + esc(d.state) + '</span>' +
    '<button class="discard" data-discard="' + i + '">Scarta</button></div>' +
    '<label>Categoria<select data-index="' + i + '" data-field="categoria">' +
    CATS.map(c => '<option' + (c === d.categoria ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label>' +
    MAIN_FIELDS.map(input).join('') +
    '<details><summary>Altri dettagli</summary>' + FIELDS.filter(f => !MAIN_FIELDS.includes(f)).map(input).join('') + '</details></div></article>';
}

function updateSave() {
  const n = drafts.filter(Boolean).length;
  $('#save').textContent = n === 1 ? 'Salva 1 capo' : 'Salva ' + n + ' capi';
  $('#save').classList.toggle('hidden', !n || analyzing);
}

function renderDrafts() {
  $('#review').innerHTML = drafts.map((d, i) => (d ? draftHtml(d, i) : '')).join('');
}

function renderDraft(i) {
  const el = document.getElementById('draft-' + i);
  if (el && drafts[i]) el.outerHTML = draftHtml(drafts[i], i);
  else renderDrafts();
}

$('#review').addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.field && drafts[+t.dataset.index]) drafts[+t.dataset.index][t.dataset.field] = t.value;
});

$('#review').addEventListener('click', e => {
  const b = e.target.closest('[data-discard]');
  if (!b) return;
  const i = +b.dataset.discard;
  if (drafts[i]) URL.revokeObjectURL(drafts[i].preview);
  drafts[i] = null;
  document.getElementById('draft-' + i)?.remove();
  updateSave();
});

async function analyzePhoto(d, ctl) {
  if (ctl.aiOff) { d.state = 'Analisi non disponibile · compila a mano'; return; }
  try {
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.atelierToken?.() },
      body: JSON.stringify({ image: await blobToDataUrl(d.blob) })
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 503 || r.status === 401) ctl.aiOff = true;
    if (!r.ok) throw Error(data.error || 'Errore ' + r.status);
    for (const f of FIELDS) d[f] = typeof data[f] === 'string' ? data[f] : '';
    d.categoria = CATS.includes(data.categoria) ? data.categoria : 'Altro';
    d.state = 'Riconosciuto · controlla i dati';
  } catch (e) {
    d.state = 'Analisi non riuscita · ' + e.message;
  }
}

async function prepare(analyze) {
  const files = [...photosInput.files];
  if (!files.length || files.length > MAX_PHOTOS) return;
  if (analyze && !window.atelierToken?.()) {
    $('#status').textContent = "Per l'analisi automatica accedi prima con Google. Se preferisci, puoi compilare le schede a mano.";
    return;
  }

  analyzing = true;
  updatePicked();
  drafts.forEach(d => d && URL.revokeObjectURL(d.preview));
  drafts = files.map(() => null);
  $('#review').innerHTML = '';
  $('#save').classList.add('hidden');
  const bar = $('#bar');
  bar.max = files.length;
  bar.value = 0;
  bar.classList.remove('hidden');

  const ctl = { aiOff: false };
  let next = 0, done = 0, failed = 0;

  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      try {
        const blob = await photo(files[i]);
        const d = { id: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob), categoria: 'Altro', state: analyze ? 'Analisi in corso…' : 'Da compilare', pending: analyze };
        for (const f of FIELDS) d[f] = '';
        drafts[i] = d;
        renderDrafts();
        if (analyze) {
          await analyzePhoto(d, ctl);
          d.pending = false;
          renderDraft(i);
        }
      } catch {
        failed++;
      }
      done++;
      bar.value = done;
      $('#status').textContent = (analyze ? 'Analisi ' : 'Preparazione ') + done + ' di ' + files.length + '…';
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  analyzing = false;
  bar.classList.add('hidden');
  const ok = drafts.filter(Boolean).length;
  $('#status').textContent = ok
    ? (analyze ? 'Controlla le schede, correggi quello che serve e poi salva.' : 'Compila le schede e poi salva.')
    : 'Nessuna fotografia leggibile.';
  if (failed) $('#status').textContent += ' ' + failed + (failed === 1 ? ' fotografia illeggibile è stata saltata.' : ' fotografie illeggibili sono state saltate.');
  updatePicked();
  updateSave();
}

$('#analyze').onclick = () => prepare(true);
$('#manual').onclick = () => prepare(false);

$('#save').onclick = async () => {
  const items = drafts.filter(Boolean);
  const now = Date.now();
  for (const d of items) {
    const meta = { id: d.id, categoria: d.categoria, createdAt: now, updatedAt: now };
    for (const f of FIELDS) meta[f] = d[f];
    await put(meta);
    await put({ id: d.id, blob: d.blob }, 'photos');
    URL.revokeObjectURL(d.preview);
  }
  drafts = [];
  $('#review').innerHTML = '';
  $('#save').classList.add('hidden');
  photosInput.value = '';
  updatePicked();
  $('#status').textContent = '';
  await renderAll();
  showTab('wardrobe');
  toast(items.length === 1 ? 'Un nuovo capo nel tuo guardaroba.' : items.length + ' nuovi capi nel tuo guardaroba.');
  await window.atelierDriveSync?.();
};

/* ---------- Signature looks ---------- */

const SEED_LOOKS = [
  { id: 'seed-burgundy-denim', nome: 'Burgundy & Denim', composizione: 'Maglione intrecciato bordeaux · Jeans azzurro chiaro · Mocassini neri' },
  { id: 'seed-lilac-gurkha', nome: 'Lilac & Gurkha', composizione: 'Maglione lilla · Gurkha sabbia a vita alta con pinces, senza cintura · Sneakers panna' },
  { id: 'seed-light-slate-blue', nome: 'Light Slate Blue', composizione: 'Camicia grigio-blu chiara · Jeans · Sneakers panna' }
];

async function seedLooks() {
  if (localStorage.getItem('atelier_looks_seeded')) return;
  for (const l of SEED_LOOKS) await put({ ...l, capi: [], createdAt: 0 }, 'looks');
  localStorage.setItem('atelier_looks_seeded', '1');
}

// Una volta per dispositivo: i capi dei look di partenza entrano nel guardaroba (id fissi, così più dispositivi non creano doppioni)
async function addSeedGarments() {
  if (localStorage.getItem('atelier_seed_garments')) return;
  for (const seed of SEED_LOOKS) {
    const look = (await all('looks')).find(l => l.id === seed.id);
    if (!look) continue;
    const { ids } = await ensureLookGarments(look.composizione, new Set(), true);
    await update('looks', look.id, { capi: [...new Set([...(look.capi || []), ...ids])] });
  }
  localStorage.setItem('atelier_seed_garments', '1');
}

function renderLooks(looks, garments) {
  looks = [...looks].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const byId = new Map(garments.map(g => [g.id, g]));
  $('#lookCount').textContent = looks.length;
  $('#lookEmpty').classList.toggle('hidden', looks.length > 0);
  $('#looks').innerHTML = looks.map(l => {
    const items = (l.capi || []).map(id => byId.get(id)).filter(Boolean);
    const inWash = items.filter(washing).length;
    return '<div class="look"><h3>' + esc(l.nome) + '</h3>' +
      (items.length ? '<div class="board">' + items.map(g => '<figure>' + photoHtml(g.id, 'board-img fade', g.tipo || 'Capo') + '</figure>').join('') + '</div>' : '') +
      (l.composizione ? '<p>' + esc(l.composizione) + '</p>' : '') +
      (inWash ? '<p class="warn">' + (inWash === 1 ? '1 capo è in lavatrice' : inWash + ' capi sono in lavatrice') + '</p>' : '') +
      '<div class="actions"><button class="btn secondary" data-look-edit="' + l.id + '">Modifica</button>' +
      '<button class="btn danger" data-look-delete="' + l.id + '">Rimuovi</button></div></div>';
  }).join('');
}

$('#looks').addEventListener('click', async e => {
  const edit = e.target.closest('[data-look-edit]');
  if (edit) return openLookForm((await all('looks')).find(l => l.id === edit.dataset.lookEdit));
  const b = e.target.closest('[data-look-delete]');
  if (!b || !(await ask('Rimuovere questo look?'))) return;
  await removeItem(b.dataset.lookDelete, 'look');
  await renderAll();
  toast('Look rimosso');
  await window.atelierDriveSync?.();
});

/* ---------- Capi descritti nei look: entrano nel guardaroba se mancano ---------- */

const STOPWORDS = new Set(['di', 'in', 'a', 'con', 'e', 'il', 'la', 'lo', 'i', 'gli', 'le', 'un', 'una', 'da', 'del', 'della', 'dei']);
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const stem = w => {
  if (w.length > 4 && w.endsWith('s')) w = w.slice(0, -1);
  if (w.length > 4 && 'aeio'.includes(w.at(-1))) w = w.slice(0, -1);
  return w;
};
const words = s => norm(s).split(/[^a-z0-9]+/).filter(w => w && !STOPWORDS.has(w)).map(stem);

const CATEGORY_WORDS = {
  'Maglieria': ['maglione', 'maglia', 'pullover', 'cardigan', 'felpa', 'dolcevita', 'gilet'],
  'Camicie e T-shirt': ['camicia', 'shirt', 'polo', 'canotta', 'top', 'blusa'],
  'Pantaloni e jeans': ['pantalone', 'pantaloni', 'jeans', 'gurkha', 'chino', 'bermuda', 'short', 'shorts', 'leggings', 'tuta'],
  'Giacche e capispalla': ['giacca', 'giubbotto', 'cappotto', 'blazer', 'trench', 'piumino', 'parka', 'impermeabile', 'bomber'],
  'Scarpe': ['scarpa', 'scarpe', 'sneakers', 'sneaker', 'mocassini', 'mocassino', 'stivali', 'stivaletti', 'sandali', 'stringate', 'derby', 'ciabatte'],
  'Accessori': ['cintura', 'sciarpa', 'cappello', 'borsa', 'occhiali', 'orologio', 'cravatta', 'guanti', 'zaino', 'portafoglio']
};
const WORD_CATEGORY = new Map(Object.entries(CATEGORY_WORDS).flatMap(([cat, ws]) => ws.map(w => [stem(norm(w)), cat])));

function categoryFor(text) {
  for (const w of words(text)) if (WORD_CATEGORY.has(w)) return WORD_CATEGORY.get(w);
  return 'Altro';
}

// «Maglione lilla, gurkha sabbia · sneakers panna» -> tre capi; le negazioni («senza cintura») non sono capi
function parseComponents(text) {
  const seen = new Set();
  return String(text || '').split(/[·;\n,+]/).map(s => s.trim()).filter(s => {
    if (s.length < 3 || /^senza\b/i.test(s)) return false;
    const k = norm(s);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Capo dello stesso tipo (stessa prima parola), con la preferenza per quello che ha più parole in comune: serve per i suggerimenti, non per i doppioni
function findSimilar(component, garments) {
  const [head, ...rest] = words(component);
  if (!head) return null;
  let best = null, bestScore = -1;
  for (const g of garments) {
    const gw = new Set(words([g.tipo, g.colore, g.materiale].filter(Boolean).join(' ')));
    if (!gw.has(head)) continue;
    const score = rest.filter(w => gw.has(w)).length;
    if (score > bestScore) { best = g; bestScore = score; }
  }
  return best;
}

// Un capo c'è già se ha lo stesso tipo (prima parola) e almeno metà delle altre parole, come il colore
function findMatch(component, garments) {
  const [head, ...rest] = words(component);
  if (!head) return null;
  return garments.find(g => {
    const gw = new Set(words([g.tipo, g.colore, g.materiale].filter(Boolean).join(' ')));
    if (!gw.has(head)) return false;
    return !rest.length || rest.filter(w => gw.has(w)).length / rest.length >= .5;
  }) || null;
}

// Collega ai capi esistenti quelli descritti nel testo e crea quelli che mancano (tranne gli esclusi)
async function ensureLookGarments(text, excluded = new Set(), fixedIds = false) {
  const ids = new Set();
  const garments = await all();
  let added = 0;
  for (const c of parseComponents(text)) {
    const found = findMatch(c, garments);
    if (found) { ids.add(found.id); continue; }
    if (excluded.has(c)) continue;
    const now = Date.now();
    const item = {
      id: fixedIds ? 'seed-' + norm(c).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : crypto.randomUUID(),
      categoria: categoryFor(c),
      tipo: c.charAt(0).toUpperCase() + c.slice(1),
      createdAt: now,
      updatedAt: now
    };
    for (const f of FIELDS) item[f] ??= '';
    await put(item);
    garments.push(item);
    ids.add(item.id);
    added++;
  }
  return { ids, added };
}

let lookGarments = [];
let parsedTimer;

function renderParsed() {
  const box = $('#lookParsed');
  const comps = parseComponents($('#lookParts').value);
  const unchecked = new Set([...box.querySelectorAll('input[data-new]:not(:checked)')].map(i => i.value));
  box.classList.toggle('hidden', !comps.length);
  box.innerHTML = comps.length
    ? '<p class="small">Capi riconosciuti nel testo</p><ul class="parsed">' + comps.map(c => {
        const m = findMatch(c, lookGarments);
        return m
          ? '<li><span>' + esc(c) + '</span><span class="small">già nel guardaroba</span></li>'
          : '<li><label class="check"><input type="checkbox" data-new value="' + esc(c) + '"' + (unchecked.has(c) ? '' : ' checked') + '><span>' + esc(c) + '</span></label>' +
            '<span class="small">' + esc(categoryFor(c)) + ' · verrà aggiunto</span></li>';
      }).join('') + '</ul>'
    : '';
}

$('#lookParts').addEventListener('input', () => { clearTimeout(parsedTimer); parsedTimer = setTimeout(renderParsed, 120); });

async function openLookForm(look) {
  editingLookId = look?.id || null;
  await loadPhotos();
  const garments = await all();
  lookGarments = garments;
  const chosen = new Set(look?.capi || []);
  $('#lookName').value = look?.nome || '';
  $('#lookParts').value = look?.composizione || '';
  $('#lookFormTitle').textContent = look ? 'Modifica look' : 'Nuovo look';
  $('#lookPicker').innerHTML = garments.length
    ? garments.map(g => '<label class="pick"><input type="checkbox" value="' + g.id + '"' + (chosen.has(g.id) ? ' checked' : '') + '>' + photoHtml(g.id, 'pick-img', g.tipo || 'Capo') + '</label>').join('')
    : '<p class="small">Quando avrai salvato dei capi potrai sceglierli qui. Per ora descrivi il look a parole.</p>';
  renderParsed();
  $('#lookForm').classList.remove('hidden');
  $('#newLook').classList.add('hidden');
  $('#lookName').focus();
}

function closeLookForm() {
  editingLookId = null;
  $('#lookForm').reset();
  $('#lookParsed').classList.add('hidden');
  $('#lookParsed').innerHTML = '';
  $('#lookForm').classList.add('hidden');
  $('#newLook').classList.remove('hidden');
}

$('#newLook').onclick = () => openLookForm();
$('#cancelLook').onclick = closeLookForm;

$('#lookForm').onsubmit = async e => {
  e.preventDefault();
  const nome = $('#lookName').value.trim();
  const composizione = $('#lookParts').value.trim();
  const picked = [...document.querySelectorAll('#lookPicker input:checked')].map(i => i.value);
  if (!nome || (!composizione && !picked.length)) {
    $('#lookStatus').textContent = 'Dai un nome al look e scegli almeno un capo oppure descrivilo.';
    return;
  }

  // I capi descritti nel testo vengono collegati se ci sono già, altrimenti aggiunti al guardaroba
  const excluded = new Set([...document.querySelectorAll('#lookParsed input[data-new]:not(:checked)')].map(i => i.value));
  const { ids, added } = await ensureLookGarments(composizione, excluded);
  const capi = new Set([...picked, ...ids]);

  const data = { nome, composizione, capi: [...capi] };
  if (editingLookId) await update('looks', editingLookId, data);
  else await put({ id: crypto.randomUUID(), ...data, createdAt: Date.now(), updatedAt: Date.now() }, 'looks');
  $('#lookStatus').textContent = '';
  closeLookForm();
  await renderAll();
  toast(added ? 'Look salvato · ' + (added === 1 ? '1 capo aggiunto' : added + ' capi aggiunti') + ' al guardaroba' : 'Look salvato');
  await window.atelierDriveSync?.();
};

/* ---------- Installazione come app ---------- */

let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  $('#installApp').classList.remove('hidden');
});
$('#installApp').onclick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('#installApp').classList.add('hidden');
};
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('#installApp').classList.add('hidden');
  toast('ATELIER è stata installata');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => { /* senza service worker l'app funziona comunque online */ });

/* ---------- Avvio ---------- */

let startTab = 'today';
try { startTab = sessionStorage.getItem('atelier_tab') || 'today'; } catch { /* storage non disponibile */ }
showTab(TABS.includes(startTab) ? startTab : 'today');
updatePicked();
migrateLocalPhotos()
  .then(seedLooks)
  .then(addSeedGarments)
  .then(renderAll)
  .catch(e => toast('Archivio locale non disponibile: ' + e.message));
