const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
// Facoltativo: elenco di indirizzi Google autorizzati, separati da virgola (variabile Vercel ALLOWED_EMAILS)
const ALLOWED = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
// Modello per il ritaglio (variabile Vercel CUTOUT_MODEL): serve uno che accetti un'immagine e lo sfondo trasparente
const MODEL = process.env.CUTOUT_MODEL || 'gpt-image-1';

// Accetta solo chi ha fatto l'accesso con Google in questa app (stesso controllo di /api/analyze)
async function checkAccount(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return 'Accedi con Google per il ritaglio automatico degli sfondi.';
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

const PROMPT =
  'Isolate the clothing item in this photo on a fully transparent background. ' +
  'Keep the garment exactly as it is: same shape, proportions, colours, pattern, fabric texture, stitching, buttons, logos and details. ' +
  'Remove everything else: bed, floor, wall, hanger, hands, people, furniture, shadows of other objects. ' +
  'Keep it centred and fully visible. Do not add anything, do not restyle, do not change the lighting of the garment.';

async function edit(image, fidelity) {
  const form = new FormData();
  form.append('model', MODEL);
  form.append('image', image, 'capo.' + (image.type.split('/')[1] || 'jpg'));
  form.append('prompt', PROMPT);
  form.append('background', 'transparent');
  form.append('output_format', 'webp');
  form.append('output_compression', '85');
  form.append('quality', 'low');
  form.append('size', '1024x1536');
  if (fidelity) form.append('input_fidelity', 'high');
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: form
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, result };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const denied = await checkAccount(req);
  if (denied) return res.status(401).json({ error: denied });

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Configura OPENAI_API_KEY su Vercel per il ritaglio automatico.' });

  const data = req.body?.image;
  const m = typeof data === 'string' && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data);
  if (!m || data.length > 4_000_000) return res.status(400).json({ error: 'Immagine non valida o troppo grande' });

  try {
    const image = new Blob([Buffer.from(m[2], 'base64')], { type: m[1] });
    // La fedeltà alta all'originale non c'è su tutti i modelli: senza, si riprova una volta
    let { ok, result } = await edit(image, true);
    if (!ok && /input_fidelity/i.test(result.error?.message || '')) ({ ok, result } = await edit(image, false));
    if (!ok) throw Error(result.error?.message || 'Servizio immagini non disponibile');
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw Error('Nessuna immagine ricevuta');
    return res.status(200).json({ image: 'data:image/webp;base64,' + b64 });
  } catch (e) {
    return res.status(502).json({ error: 'Ritaglio non riuscito: ' + e.message });
  }
}
