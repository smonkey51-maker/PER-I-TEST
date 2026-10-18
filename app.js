/* ATELIER — guardaroba personale: archivio locale, caricamento multiplo, looks */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CATS = ['Maglieria', 'Camicie e T-shirt', 'Pantaloni e jeans', 'Giacche e capispalla', 'Scarpe', 'Accessori', 'Altro'];
const LABELS = {
  tipo: 'Tipo', colore: 'Colore', materiale: 'Materiale', texture: 'Texture',
  vestibilita: 'Vestibilità', stagione: 'Stagione', occasioni: 'Occasioni', compatibilita: 'Compatibilità'
};
const FIELDS = Object.keys(LABELS);
const MAIN_FIELDS = ['tipo', 'colore'];
const MAX_PHOTOS = 40;
const PARALLEL = 3;

let drafts = [];
let analyzing = false;
let filter = 'Tutti';
let detailId = null;

/* ---------- Archivio locale (IndexedDB) ---------- */

const dbp = new Promise((resolve, reject) => {
  const r = indexedDB.open('atelier-v1', 2);
  r.onupgradeneeded = () => {
    const d = r.result;
    if (!d.objectStoreNames.contains('garments')) d.createObjectStore('garments', { keyPath: 'id' });
    if (!d.objectStoreNames.contains('looks')) d.createObjectStore('looks', { keyPath: 'id' });
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
  for (const v of ['wardrobe', 'add', 'looks']) $('#view-' + v).classList.toggle('hidden', v !== name);
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  try { sessionStorage.setItem('atelier_tab', name); } catch { /* storage non disponibile */ }
  window.scrollTo(0, 0);
}

const known = v => (v && !/^non determinabile$/i.test(v) ? v : '');

/* ---------- Guardaroba ---------- */

const catOf = d => (CATS.includes(d.categoria) ? d.categoria : 'Altro');

function cardHtml(d) {
  return '<button class="card" data-open="' + d.id + '">' +
    '<div class="card-img-wrap"><img class="card-img" src="' + d.img + '" alt="' + esc(d.tipo || 'Capo') + '" loading="lazy" decoding="async"></div>' +
    '<div class="card-body"><strong>' + esc(d.tipo || 'Capo') + '</strong><span>' + (esc(known(d.colore)) || '&nbsp;') + '</span></div></button>';
}

async function renderSaved() {
  const items = await all();
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

async function openDetail(id) {
  const item = (await all()).find(d => d.id === id);
  if (!item) return;
  detailId = id;
  $('#detailImg').src = item.img;
  $('#detailImg').alt = item.tipo || 'Capo';
  $('#detailTitle').textContent = item.tipo || 'Capo';
  const rows = [['Categoria', catOf(item)], ...FIELDS.filter(f => f !== 'tipo').map(f => [LABELS[f], known(item[f])])];
  $('#detailFields').innerHTML = rows.filter(r => r[1]).map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('');
  $('#detail').showModal();
}

$('#wardrobe').addEventListener('click', e => {
  const card = e.target.closest('[data-open]');
  if (card) openDetail(card.dataset.open);
});

$('#chips').addEventListener('click', e => {
  const chip = e.target.closest('[data-filter]');
  if (chip) { filter = chip.dataset.filter; renderSaved(); }
});

$('#detailClose').onclick = () => $('#detail').close();

$('#detailDelete').onclick = async () => {
  if (!detailId || !(await ask('Rimuovere questo capo dal guardaroba?'))) return;
  await del(detailId);
  await window.atelierDriveDelete?.(detailId, 'garment');
  detailId = null;
  $('#detail').close();
  await renderSaved();
  await renderLooks();
  toast('Capo rimosso');
};

$('#goAdd').onclick = () => showTab('add');
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

function photo(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .76));
      };
      img.onerror = rej;
      img.src = r.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function draftHtml(d, i) {
  const input = f => '<label>' + LABELS[f] + '<input data-index="' + i + '" data-field="' + f + '" value="' + esc(d[f]) + '"></label>';
  return '<article class="draft" id="draft-' + i + '"><img src="' + d.img + '" alt="Capo da rivedere">' +
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
  drafts[+b.dataset.discard] = null;
  document.getElementById('draft-' + b.dataset.discard)?.remove();
  updateSave();
});

async function analyzePhoto(d, img, ctl) {
  if (ctl.aiOff) { d.state = 'Analisi AI non disponibile · compila a mano'; return; }
  try {
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: img })
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 503) ctl.aiOff = true;
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

  analyzing = true;
  updatePicked();
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
        const img = await photo(files[i]);
        const d = { id: crypto.randomUUID(), img, categoria: 'Altro', state: 'Da compilare' };
        for (const f of FIELDS) d[f] = '';
        drafts[i] = d;
        renderDrafts();
        if (analyze) {
          await analyzePhoto(d, img, ctl);
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
  for (const { state, ...item } of items) await put(item);
  drafts = [];
  $('#review').innerHTML = '';
  $('#save').classList.add('hidden');
  photosInput.value = '';
  updatePicked();
  $('#status').textContent = '';
  await renderSaved();
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

async function renderLooks() {
  const looks = (await all('looks')).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const garments = new Map((await all()).map(g => [g.id, g]));
  $('#lookCount').textContent = looks.length;
  $('#lookEmpty').classList.toggle('hidden', looks.length > 0);
  $('#looks').innerHTML = looks.map(l =>
    '<div class="look"><h3>' + esc(l.nome) + '</h3>' +
    (l.composizione ? '<p>' + esc(l.composizione) + '</p>' : '') +
    '<div class="thumbs">' + (l.capi || []).filter(id => garments.has(id)).map(id =>
      '<img src="' + garments.get(id).img + '" alt="' + esc(garments.get(id).tipo) + '">').join('') + '</div>' +
    '<button class="btn secondary" data-look-delete="' + l.id + '">Rimuovi</button></div>').join('');
}

$('#looks').addEventListener('click', async e => {
  const b = e.target.closest('[data-look-delete]');
  if (!b || !(await ask('Rimuovere questo look?'))) return;
  await del(b.dataset.lookDelete, 'looks');
  await window.atelierDriveDelete?.(b.dataset.lookDelete, 'look');
  await renderLooks();
  toast('Look rimosso');
});

async function openLookForm() {
  const garments = await all();
  $('#lookPicker').innerHTML = garments.length
    ? garments.map(g => '<label class="pick"><input type="checkbox" value="' + g.id + '"><img src="' + g.img + '" alt="' + esc(g.tipo || 'Capo') + '"></label>').join('')
    : '<p class="small">Quando avrai salvato dei capi potrai sceglierli qui. Per ora descrivi il look a parole.</p>';
  $('#lookForm').classList.remove('hidden');
  $('#newLook').classList.add('hidden');
  $('#lookName').focus();
}

function closeLookForm() {
  $('#lookForm').reset();
  $('#lookForm').classList.add('hidden');
  $('#newLook').classList.remove('hidden');
}

$('#newLook').onclick = openLookForm;
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
  await put({ id: crypto.randomUUID(), nome, composizione, capi, createdAt: Date.now() }, 'looks');
  $('#lookStatus').textContent = '';
  closeLookForm();
  await renderLooks();
  toast('Look salvato');
  await window.atelierDriveSync?.();
};

/* ---------- Avvio ---------- */

let startTab = 'wardrobe';
try { startTab = sessionStorage.getItem('atelier_tab') || 'wardrobe'; } catch { /* storage non disponibile */ }
showTab(['wardrobe', 'add', 'looks'].includes(startTab) ? startTab : 'wardrobe');
updatePicked();
renderSaved().catch(e => toast('Archivio locale non disponibile: ' + e.message));
seedLooks().then(renderLooks).catch(e => { $('#lookStatus').textContent = 'Looks non disponibili: ' + e.message; });
