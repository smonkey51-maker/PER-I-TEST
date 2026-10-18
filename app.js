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
  return src ? '<img class="' + cls + '" src="' + src + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' : '<div class="' + cls + ' ph"></div>';
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
    '<div class="card-img-wrap">' + photoHtml(d.id, 'card-img fade', d.tipo || 'Capo') + '</div>' +
    '<div class="card-body"><strong>' + esc(d.tipo || 'Capo') + '</strong><span>' +
    (washing(d) ? 'In lavatrice' : (esc(known(d.colore)) || '&nbsp;')) + '</span></div></button>';
}

function renderWardrobe(items) {
  $('#count').textContent = items.length;
  $('#empty').classList.toggle('hidden', items.length > 0);

  const present = CATS.filter(c => items.some(d => catOf(d) === c));
  if (filter !== 'Tutti' && !present.includes(filter)) filter = 'Tutti';

  $('#chips').innerHTML = items.length
    ? ['Tutti', ...present].map(c => {
        const n = c === 'Tutti' ? items.length : items.filter(d => catOf(d) === c).length;
        return '<button class="chip" data-filter="' + esc(c) + '" aria-pressed="' + (c === filter) + '">' + esc(c) + ' ' + n + '</button>';
      }).join('')
    : '';

  $('#wardrobe').innerHTML = present
    .filter(c => filter === 'Tutti' || c === filter)
    .map(c => '<h3 class="cat">' + esc(c) + '</h3><div class="grid">' + items.filter(d => catOf(d) === c).map(cardHtml).join('') + '</div>')
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
  $('#detailImg').src = photoSrc(id);
  $('#detailImg').alt = item.tipo || 'Capo';
  $('#detailTitle').textContent = item.tipo || 'Capo';
  const rows = [['Categoria', catOf(item)], ...FIELDS.filter(f => f !== 'tipo').map(f => [LABELS[f], known(item[f])])];
  if (washing(item)) rows.unshift(['Stato', 'In lavatrice']);
  $('#detailFields').innerHTML = rows.filter(r => r[1]).map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('');
  $('#detailWash').textContent = washing(item) ? 'Segna come lavato' : 'Metti in lavatrice';
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
  return s.includes(SEASONS[new Date().getMonth()]) ? 2 : 0;
}

// Sceglie a caso, ma con più probabilità i capi adatti alla stagione in corso
function pickOne(pool, strict = false) {
  const fit = pool.filter(g => seasonFit(g) > 0);
  const src = fit.length ? fit : (strict ? [] : pool);
  if (!src.length) return null;
  const weights = src.map(g => (seasonFit(g) === 2 ? 3 : 1));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < src.length; i++) { r -= weights[i]; if (r <= 0) return src[i]; }
  return src[src.length - 1];
}

function makeIdea(clean, looks, n) {
  const ids = new Set(clean.map(g => g.id));
  const ready = looks.filter(l => l.capi?.length && l.capi.every(id => ids.has(id)));
  if (n < ready.length) return { title: ready[n].nome, ids: ready[n].capi };

  const inCats = (...cats) => clean.filter(g => cats.includes(catOf(g)));
  const top = pickOne(inCats('Maglieria', 'Camicie e T-shirt'));
  const bottom = pickOne(inCats('Pantaloni e jeans'));
  const shoes = pickOne(inCats('Scarpe'));
  const missing = [];
  if (!top) missing.push('un capo sopra');
  if (!bottom) missing.push('pantaloni o jeans');
  if (!shoes) missing.push('delle scarpe');
  if (missing.length) return { missing };

  const picked = [top, bottom, shoes];
  const outer = pickOne(inCats('Giacche e capispalla'), true);
  if (outer) picked.push(outer);
  const extra = Math.random() < .4 ? pickOne(inCats('Accessori')) : null;
  if (extra) picked.push(extra);
  return { title: 'Outfit suggerito', ids: picked.map(g => g.id) };
}

function miniHtml(d, on) {
  return '<div class="mini">' + photoHtml(d.id, 'mini-img fade', d.tipo || 'Capo') +
    '<div class="mini-body"><strong>' + esc(d.tipo || 'Capo') + '</strong>' +
    '<button class="btn secondary" data-wash="' + d.id + '" data-on="' + on + '">' + (on ? 'In lavatrice' : 'Lavato') + '</button></div></div>';
}

function renderToday(garments, looks) {
  const clean = garments.filter(g => !washing(g));
  const dirty = garments.filter(washing);
  $('#todayEmpty').classList.toggle('hidden', garments.length > 0);
  $('#todayContent').classList.toggle('hidden', !garments.length);

  const byId = new Map(garments.map(g => [g.id, g]));
  if (!idea || idea.missing || !idea.ids?.every(id => byId.has(id) && !washing(byId.get(id)))) idea = makeIdea(clean, looks, ideaN);

  if (idea.missing) {
    $('#idea').innerHTML = '<p class="muted">Per comporre un outfit servono capi lavati: ti mancano ' + idea.missing.join(', ') + '.</p>';
  } else {
    $('#idea').innerHTML = '<h3>' + esc(idea.title) + '</h3><div class="strip">' + idea.ids.map(id => {
      const g = byId.get(id);
      return '<figure>' + photoHtml(id, 'strip-img fade', g.tipo || 'Capo') + '<figcaption>' + esc(g.tipo || 'Capo') + '</figcaption></figure>';
    }).join('') + '</div>';
  }

  $('#cleanCount').textContent = clean.length;
  $('#washCount').textContent = dirty.length;
  $('#cleanList').innerHTML = CATS.filter(c => clean.some(g => catOf(g) === c)).map(c =>
    '<h4 class="cat-sm">' + esc(c) + '</h4><div class="mini-grid">' + clean.filter(g => catOf(g) === c).map(g => miniHtml(g, true)).join('') + '</div>').join('');
  $('#washList').innerHTML = dirty.length
    ? '<div class="mini-grid">' + dirty.map(g => miniHtml(g, false)).join('') + '</div>'
    : '<p class="small">Nessun capo in lavatrice.</p>';
  $('#washAll').classList.toggle('hidden', !dirty.length);
}

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
  toast(items.length === 1 ? '1 capo salvato' : items.length + ' capi salvati');
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

async function openLookForm(look) {
  editingLookId = look?.id || null;
  await loadPhotos();
  const garments = await all();
  const chosen = new Set(look?.capi || []);
  $('#lookName').value = look?.nome || '';
  $('#lookParts').value = look?.composizione || '';
  $('#lookFormTitle').textContent = look ? 'Modifica look' : 'Nuovo look';
  $('#lookPicker').innerHTML = garments.length
    ? garments.map(g => '<label class="pick"><input type="checkbox" value="' + g.id + '"' + (chosen.has(g.id) ? ' checked' : '') + '>' + photoHtml(g.id, 'pick-img', g.tipo || 'Capo') + '</label>').join('')
    : '<p class="small">Quando avrai salvato dei capi potrai sceglierli qui. Per ora descrivi il look a parole.</p>';
  $('#lookForm').classList.remove('hidden');
  $('#newLook').classList.add('hidden');
  $('#lookName').focus();
}

function closeLookForm() {
  editingLookId = null;
  $('#lookForm').reset();
  $('#lookForm').classList.add('hidden');
  $('#newLook').classList.remove('hidden');
}

$('#newLook').onclick = () => openLookForm();
$('#cancelLook').onclick = closeLookForm;

$('#lookForm').onsubmit = async e => {
  e.preventDefault();
  const nome = $('#lookName').value.trim();
  const composizione = $('#lookParts').value.trim();
  const capi = [...document.querySelectorAll('#lookPicker input:checked')].map(i => i.value);
  if (!nome || (!composizione && !capi.length)) {
    $('#lookStatus').textContent = 'Dai un nome al look e scegli almeno un capo oppure descrivilo.';
    return;
  }
  if (editingLookId) await update('looks', editingLookId, { nome, composizione, capi });
  else await put({ id: crypto.randomUUID(), nome, composizione, capi, createdAt: Date.now(), updatedAt: Date.now() }, 'looks');
  $('#lookStatus').textContent = '';
  closeLookForm();
  await renderAll();
  toast('Look salvato');
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
  .then(renderAll)
  .catch(e => toast('Archivio locale non disponibile: ' + e.message));
