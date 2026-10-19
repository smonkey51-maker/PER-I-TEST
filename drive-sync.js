/* ATELIER — accesso Google e sincronizzazione con Drive (permesso drive.file: solo i file creati dall'app) */
(() => {
  const BASE_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.file';
  const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly'; // solo lettura degli eventi
  const CAL_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const API = 'https://www.googleapis.com/drive/v3/';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/';
  const FMT = '2'; // formato dei file su Drive: scheda senza foto + foto a parte

  // Struttura su Drive: una cartella per sezione dell'app
  const PATHS = {
    root: 'ATELIER',
    garment: 'ATELIER/Guardaroba',
    look: 'ATELIER/Looks',
    photo: 'ATELIER/Foto',
    deleted: 'ATELIER/Eliminati'
  };
  const KINDS = [['garment', 'garments'], ['look', 'looks']];

  let token = null;
  let busy = false;
  let again = false;
  let signedInEmail = localStorage.getItem('atelier_google_email');
  let clientIdValue = null;
  let refreshTimer = null;
  let folderIds = {};
  let calendarOk = false;

  const el = id => document.getElementById(id);
  const status = s => { el('driveStatus').textContent = s; };

  const setConnected = on => {
    el('syncDrive').classList.toggle('hidden', !on);
    el('disconnectDrive').classList.toggle('hidden', !on);
    el('connectDrive').classList.toggle('hidden', on);
    el('accountDescription').textContent = on
      ? 'Connesso come ' + (signedInEmail || 'account Google') + '. I capi vengono sincronizzati con Drive.'
      : 'Accedi con Google per ritrovare i tuoi capi su ogni dispositivo.';
  };

  /* ---------- Accesso ---------- */

  const clientId = async () => {
    if (clientIdValue) return clientIdValue;
    const r = await fetch('/api/config');
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !/^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(j.googleClientId || '')) throw Error(j.error || 'Client ID Google non configurato sul server.');
    return (clientIdValue = j.googleClientId);
  };

  const googleReady = async () => {
    for (let i = 0; i < 50; i++) {
      if (window.google?.accounts?.oauth2) return;
      await new Promise(r => setTimeout(r, 200));
    }
    throw Error('Servizio Google non caricato. Riprova.');
  };

  // Il calendario è facoltativo: si chiede al primo accesso e, se rifiutato, solo su richiesta esplicita
  const auth = async (interactive, opts = {}) => {
    const id = await clientId();
    await googleReady();
    const hint = signedInEmail ? { login_hint: signedInEmail } : {};
    const calPref = localStorage.getItem('atelier_cal');
    const wantCalendar = opts.calendar || calPref === '1' || (interactive && !signedInEmail && calPref === null);
    const result = await new Promise((resolve, reject) => {
      const c = google.accounts.oauth2.initTokenClient({
        client_id: id,
        scope: wantCalendar ? BASE_SCOPE + ' ' + CAL_SCOPE : BASE_SCOPE,
        ...hint,
        // consenso solo la prima volta; poi rinnovo silenzioso
        prompt: interactive ? (opts.calendar || !localStorage.getItem('atelier_google_email') ? 'consent' : '') : 'none',
        callback: r => (r.error ? reject(Error(r.error)) : resolve(r)),
        error_callback: e => reject(Error(e.type || 'Autorizzazione interrotta'))
      });
      c.requestAccessToken();
    });
    token = result.access_token;
    calendarOk = (result.scope || '').split(' ').includes(CAL_SCOPE);
    if (wantCalendar && interactive) localStorage.setItem('atelier_cal', calendarOk ? '1' : '0');

    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(
      () => auth(false).catch(() => { token = null; setConnected(false); status('Sessione scaduta: premi Accedi con Google.'); }),
      Math.max(60, (+result.expires_in || 3600) - 120) * 1000
    );

    if (!signedInEmail || interactive || !localStorage.getItem('atelier_name')) {
      const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + token } });
      if (r.ok) {
        const u = await r.json();
        signedInEmail = u.email;
        localStorage.setItem('atelier_google_email', signedInEmail);
        // il nome serve solo per salutarti
        if (u.given_name) localStorage.setItem('atelier_name', u.given_name);
      } else if (!signedInEmail || interactive) {
        throw Error('Impossibile verificare account Google');
      }
    }
    setConnected(true);
  };

  window.atelierToken = () => token;
  window.atelierCalendarOk = () => calendarOk;

  window.atelierConnectCalendar = async () => {
    try {
      status('Autorizzazione calendario…');
      await auth(true, { calendar: true });
      status(calendarOk ? 'Calendario collegato.' : 'Calendario non autorizzato.');
      await window.refreshEvents?.(true);
    } catch (e) {
      status('Errore: ' + e.message);
    }
  };

  /* ---------- Chiamate a Drive ---------- */

  const authFetch = async (url, init = {}, retried = false) => {
    if (!token) throw Error('Accedi con Google.');
    const r = await fetch(url, { ...init, headers: { Authorization: 'Bearer ' + token, ...init.headers } });
    if (r.status === 401 && !retried) { await auth(false); return authFetch(url, init, true); }
    if (r.status === 401) { token = null; setConnected(false); }
    return r;
  };

  const request = async (path, options) => {
    const r = await authFetch(API + path, options);
    if (!r.ok) throw Error('Google Drive HTTP ' + r.status + ': ' + (await r.text()).slice(0, 180));
    return r.status === 204 ? null : r.json();
  };

  const list = async q => {
    let page = '';
    const out = [];
    do {
      const r = await request('files?' + new URLSearchParams({
        q,
        fields: 'nextPageToken,files(id,name,mimeType,parents,appProperties)',
        pageSize: '1000',
        ...(page ? { pageToken: page } : {})
      }));
      out.push(...r.files);
      page = r.nextPageToken || '';
    } while (page);
    return out;
  };

  const multipart = async (method, url, metadata, mime, content) => {
    const boundary = 'atelier' + Math.random().toString(36).slice(2);
    const head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
      '\r\n--' + boundary + '\r\nContent-Type: ' + mime + '\r\n\r\n';
    const body = new Blob([head, content, '\r\n--' + boundary + '--']);
    const r = await authFetch(url, { method, headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body });
    if (!r.ok) throw Error('Salvataggio Drive non riuscito: ' + r.status);
    return r.json();
  };

  // La data di modifica viaggia come proprietà del file: basta leggere l'elenco per sapere cosa è cambiato
  const props = item => ({ v: String(item.updatedAt || 0), fmt: FMT });
  const clean = item => { const { img, ...rest } = item; return rest; };
  const createJson = (name, parent, obj) =>
    multipart('POST', UPLOAD + 'files?uploadType=multipart&fields=id', { name, mimeType: 'application/json', parents: [parent], appProperties: props(obj) }, 'application/json', JSON.stringify(obj));
  const updateJson = (fileId, obj) =>
    multipart('PATCH', UPLOAD + 'files/' + fileId + '?uploadType=multipart&fields=id', { appProperties: props(obj) }, 'application/json', JSON.stringify(obj));
  const createPhoto = (name, parent, blob) =>
    multipart('POST', UPLOAD + 'files?uploadType=multipart&fields=id', { name, mimeType: 'image/jpeg', parents: [parent] }, 'image/jpeg', blob);

  const readJson = async id => {
    const r = await authFetch(API + 'files/' + id + '?alt=media');
    if (!r.ok) throw Error('Impossibile leggere archivio Drive');
    return r.json();
  };

  const readBlob = async id => {
    const r = await authFetch(API + 'files/' + id + '?alt=media');
    if (!r.ok) throw Error('Impossibile leggere una fotografia da Drive');
    return r.blob();
  };

  const deleteFile = async id => {
    const r = await authFetch(API + 'files/' + id, { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw Error('Eliminazione Drive non riuscita: ' + r.status);
  };

  const pool = async (items, size, fn) => {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }));
  };

  // Impegni di oggi: restano nel browser, non vengono salvati né inviati al server o all'analisi AI
  window.atelierEvents = async () => {
    if (!token || !calendarOk) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const r = await authFetch(CAL_API + '?' + new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '25',
      fields: 'items(summary,status,transparency,start,end,attendees(self,responseStatus))'
    }));
    if (r.status === 403) throw Error('Calendario non disponibile: abilita Google Calendar API nel progetto Google Cloud.');
    if (!r.ok) throw Error('Calendario non raggiungibile (' + r.status + ')');
    const j = await r.json();
    return (j.items || [])
      .filter(e => e.status !== 'cancelled' && e.transparency !== 'transparent' && !e.attendees?.some(a => a.self && a.responseStatus === 'declined'))
      .map(e => ({ title: e.summary || 'Impegno', allDay: !e.start?.dateTime, start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date }));
  };

  /* ---------- Cartelle ---------- */

  const ensureFolder = async path => {
    if (folderIds[path]) return folderIds[path];
    const key = 'atelier_folder_' + signedInEmail + '_' + path;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const f = await request('files/' + saved + '?fields=id,trashed');
        if (f && !f.trashed) return (folderIds[path] = saved);
      } catch { /* la cartella non esiste più: la ricerco o la ricreo */ }
      localStorage.removeItem(key);
    }
    const parts = path.split('/');
    const name = parts.pop();
    const parent = parts.length ? await ensureFolder(parts.join('/')) : null;
    const found = await list("name = '" + name + "' and mimeType = '" + FOLDER_MIME + "' and trashed = false" + (parent ? " and '" + parent + "' in parents" : ''));
    let id = found[0]?.id;
    if (!id) {
      const r = await request('files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parent ? { parents: [parent] } : {}) })
      });
      id = r.id;
    }
    localStorage.setItem(key, id);
    return (folderIds[path] = id);
  };

  const cloudFiles = async (path, mime = 'application/json') =>
    list("'" + (await ensureFolder(path)) + "' in parents and mimeType = '" + mime + "' and trashed = false");

  // Sposta nelle cartelle di sezione i file salvati in passato direttamente dentro ATELIER
  const migrateLegacy = async () => {
    const root = await ensureFolder(PATHS.root);
    const legacy = await list("'" + root + "' in parents and mimeType = 'application/json' and trashed = false");
    await pool(legacy, 4, async f => {
      const kind = KINDS.map(k => k[0]).find(k => f.name.startsWith(k + '-'));
      if (!kind) return;
      const dest = await ensureFolder(PATHS[kind]);
      await request('files/' + f.id + '?' + new URLSearchParams({ addParents: dest, removeParents: root, fields: 'id' }), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}'
      });
    });
  };

  /* ---------- Sincronizzazione ---------- */

  // Cancellazioni fatte qui: lasciano una traccia su Drive; quelle fatte altrove vengono applicate qui
  const syncDeletions = async stats => {
    const tombs = new Set((await cloudFiles(PATHS.deleted)).map(f => f.name));
    const folder = await ensureFolder(PATHS.deleted);
    for (const t of await all('deleted')) {
      const name = t.key + '.json';
      if (!tombs.has(name)) { await createJson(name, folder, { id: t.id, kind: t.kind, at: t.at }); tombs.add(name); }
      await del(t.key, 'deleted');
    }
    const gone = { garment: new Set(), look: new Set() };
    for (const name of tombs) {
      const m = /^(garment|look)-(.+)\.json$/.exec(name);
      if (m) gone[m[1]].add(m[2]);
    }
    for (const [kind, store] of KINDS) {
      for (const item of await all(store)) {
        if (!gone[kind].has(item.id)) continue;
        await del(item.id, store);
        if (kind === 'garment') { await del(item.id, 'photos'); window.forgetPhoto?.(item.id); }
        stats.removed++;
      }
    }
    return gone;
  };

  const download = async (kind, store, id, file, stats) => {
    const item = await readJson(file.id);
    if (kind === 'garment' && typeof item.img === 'string') {
      // formato vecchio: la foto era dentro la scheda
      await put({ id, blob: await (await fetch(item.img)).blob() }, 'photos');
      window.forgetPhoto?.(id);
    }
    const next = clean(item);
    next.updatedAt = Number(file.appProperties?.v || 0);
    await put(next, store);
    if (kind === 'garment' && file.appProperties?.fmt !== FMT) await updateJson(file.id, next);
    stats.down++;
  };

  const syncKind = async (kind, store, gone, stats) => {
    const re = new RegExp('^' + kind + '-(.+)\\.json$');
    const remote = await cloudFiles(PATHS[kind]);
    await pool(remote.filter(f => { const m = re.exec(f.name); return m && gone[kind].has(m[1]); }), 4, f => deleteFile(f.id));

    const live = new Map();
    for (const f of remote) {
      const m = re.exec(f.name);
      if (m && !gone[kind].has(m[1])) live.set(m[1], f);
    }
    const local = new Map((await all(store)).map(x => [x.id, x]));
    const folder = await ensureFolder(PATHS[kind]);
    const todo = [];

    for (const [id, file] of live) {
      const item = local.get(id);
      const rv = Number(file.appProperties?.v || 0);
      if (!item || rv > (item.updatedAt || 0)) {
        todo.push(() => download(kind, store, id, file, stats));
      } else if ((item.updatedAt || 0) > rv || (kind === 'garment' && file.appProperties?.fmt !== FMT)) {
        todo.push(async () => { await updateJson(file.id, clean(item)); stats.up++; });
      }
    }
    for (const [id, item] of local) {
      if (!live.has(id)) todo.push(async () => { await createJson(kind + '-' + id + '.json', folder, clean(item)); stats.up++; });
    }
    await pool(todo, 5, fn => fn());
  };

  const syncPhotos = async (gone, stats) => {
    const folder = await ensureFolder(PATHS.photo);
    const remote = new Map();
    const stale = [];
    for (const f of await cloudFiles(PATHS.photo, 'image/jpeg')) {
      const m = /^photo-(.+)\.jpg$/.exec(f.name);
      if (!m) continue;
      if (gone.garment.has(m[1])) stale.push(f); else remote.set(m[1], f);
    }
    await pool(stale, 4, f => deleteFile(f.id));

    const rows = new Map((await all('photos')).map(p => [p.id, p]));
    const todo = [];
    for (const g of await all('garments')) {
      const row = rows.get(g.id), file = remote.get(g.id);
      if (row && !file) todo.push(async () => { await createPhoto('photo-' + g.id + '.jpg', folder, row.blob); stats.up++; });
      else if (!row && file) todo.push(async () => { await put({ id: g.id, blob: await readBlob(file.id) }, 'photos'); window.forgetPhoto?.(g.id); });
    }
    await pool(todo, 4, fn => fn());
  };

  const sync = async () => {
    if (!token) return;
    if (busy) { again = true; return; }
    busy = true;
    el('syncDrive').disabled = true;
    const stats = { down: 0, up: 0, removed: 0 };
    try {
      status('Sincronizzazione in corso…');
      for (const path of Object.values(PATHS)) await ensureFolder(path);
      await migrateLegacy();
      const gone = await syncDeletions(stats);
      for (const [kind, store] of KINDS) await syncKind(kind, store, gone, stats);
      await syncPhotos(gone, stats);
      await renderAll();
      window.refreshEvents?.();
      status('Sincronizzato · ' + stats.down + ' scaricati · ' + stats.up + ' caricati' + (stats.removed ? ' · ' + stats.removed + ' rimossi' : ''));
    } catch (e) {
      status('Errore: ' + e.message);
    } finally {
      busy = false;
      el('syncDrive').disabled = false;
      if (again) { again = false; sync(); }
    }
  };

  /* ---------- Collegamenti con la pagina ---------- */

  el('connectDrive').onclick = async () => {
    try { status('Accesso Google…'); await auth(true); await sync(); }
    catch (e) { status('Errore: ' + e.message); }
  };
  el('syncDrive').onclick = sync;
  el('disconnectDrive').onclick = () => {
    token = null; signedInEmail = null; folderIds = {};
    clearTimeout(refreshTimer);
    localStorage.removeItem('atelier_google_email');
    localStorage.removeItem('atelier_name');
    setConnected(false);
    status('Disconnesso. I dati locali restano sul dispositivo.');
  };
  window.atelierDriveSync = sync;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('online', sync);

  if (signedInEmail) {
    status('Accesso automatico…');
    auth(false).then(sync).catch(() => {
      setConnected(false);
      status(navigator.onLine ? 'Premi Accedi con Google per ricollegare Drive.' : 'Senza connessione: i tuoi capi sono disponibili sul dispositivo.');
    });
  }
})();
