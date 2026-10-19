const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
// Facoltativo: elenco di indirizzi Google autorizzati, separati da virgola (variabile Vercel ALLOWED_EMAILS)
const ALLOWED = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const SYSTEM_PROMPT =
  "Sei uno stylist. L'utente indica una persona nota e ti dà i capi puliti del suo guardaroba. " +
  "Ripensa allo stile generale di quella persona (silhouette, colori, tessuti, abbinamenti) basandoti solo su ciò che è noto pubblicamente, senza inventare dettagli. " +
  'Se non la conosci abbastanza rispondi {"sconosciuto":true}. ' +
  'Altrimenti componi UN outfit scegliendo esclusivamente tra i capi forniti (usa i loro id): un capo sopra, pantaloni e scarpe se disponibili, ' +
  'un capospalla solo se serve per meteo o occasione, al massimo un accessorio. Rispetta occasioni e meteo del contesto, se indicati. Se il contesto indica uno «stile», dallo come preferenza di gusto dell\'utente (al lavoro sartorialità sobria e autorevole, fuori dal lavoro sartorialità rétro, più espressiva ed eccentrica) interpretando lo stile della persona in quella direzione. ' +
  'Se è presente «riferimento», è la descrizione di un look reale di quella persona: riproducilo il più fedelmente possibile con i capi disponibili. ' +
  'Rispondi solo con JSON: {"ids":["..."],"motivo":"una frase in italiano che collega l\'outfit allo stile della persona"}.';

// Accetta solo chi ha fatto l'accesso con Google in questa app (stesso controllo di /api/analyze)
async function checkAccount(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return "Accedi con Google per usare l'ispirazione di stile.";
  let info;
  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(m[1]));
    if (!r.ok) return 'Sessione Google scaduta: accedi di nuovo.';
    info = await r.json();
  } catch {
    return 'Verifica dell’account non riuscita. Riprova.';
  }
  if (info.aud !== CLIENT_ID && info.azp !== CLIENT_ID) return 'Account non autorizzato.';
  if (ALLOWED.length && !ALLOWED.includes(String(info.email || '').toLowerCase())) return 'Account non autorizzato.';
  return null;
}

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const denied = await checkAccount(req);
  if (denied) return res.status(401).json({ error: denied });

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Configura OPENAI_API_KEY su Vercel per attivare questa funzione.' });

  const person = text(req.body?.person, 60).trim();
  const garments = (Array.isArray(req.body?.garments) ? req.body.garments : []).slice(0, 120)
    .filter(g => g && typeof g.id === 'string' && g.id.length <= 80)
    .map(g => ({ id: g.id, categoria: text(g.categoria, 40), tipo: text(g.tipo, 80), colore: text(g.colore, 40), materiale: text(g.materiale, 40), stagione: text(g.stagione, 40), occasioni: text(g.occasioni, 80) }));
  if (!person) return res.status(400).json({ error: 'Scrivi il nome di una persona.' });
  if (garments.length < 3) return res.status(400).json({ error: 'Servono almeno tre capi lavati.' });

  // Descrizione di un look reale da riprodurre con i capi disponibili (facoltativa)
  const riferimento = text(req.body?.riferimento, 900);
  const contesto = {
    occasioni: (Array.isArray(req.body?.contesto?.occasioni) ? req.body.contesto.occasioni : []).slice(0, 6).map(o => text(o, 20)),
    stile: text(req.body?.contesto?.stile, 60),
    meteo: text(req.body?.contesto?.meteo, 120)
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ persona: person, contesto, ...(riferimento ? { riferimento } : {}), capi: garments }) }
        ]
      })
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error?.message || 'Servizio AI non disponibile');
    const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    if (parsed.sconosciuto) return res.status(422).json({ error: 'Non conosco abbastanza lo stile di questa persona. Prova con un altro nome.' });

    const valid = new Set(garments.map(g => g.id));
    const ids = [...new Set(Array.isArray(parsed.ids) ? parsed.ids : [])].filter(id => valid.has(id));
    if (ids.length < 2) return res.status(502).json({ error: 'Non sono riuscito a comporre un outfit. Riprova.' });
    return res.status(200).json({ ids, motivo: text(parsed.motivo, 300) });
  } catch (e) {
    return res.status(502).json({ error: 'Richiesta non riuscita: ' + e.message });
  }
}
