const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
// Facoltativo: elenco di indirizzi Google autorizzati, separati da virgola (variabile Vercel ALLOWED_EMAILS)
const ALLOWED = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
// Modello di generazione immagini (variabile Vercel IMAGE_MODEL); se non disponibile si ripiega su gpt-image-1
const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1-mini';

// Accetta solo chi ha fatto l'accesso con Google in questa app (stesso controllo di /api/analyze)
async function checkAccount(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return "Accedi con Google per creare le immagini dei capi.";
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

const text = (v, max) => (typeof v === 'string' && !/^non determinabile$/i.test(v.trim()) ? v.trim().slice(0, max) : '');

// Foto prodotto neutra: un solo capo, sfondo grigio uniforme (così lo scontorno sul dispositivo lo isola)
function prompt(g) {
  const details = [
    'Capo: ' + text(g.tipo, 80),
    text(g.categoria, 40) && 'Categoria: ' + text(g.categoria, 40),
    text(g.colore, 60) && 'Colore: ' + text(g.colore, 60),
    text(g.materiale, 60) && 'Materiale: ' + text(g.materiale, 60),
    text(g.texture, 60) && 'Fantasia o texture: ' + text(g.texture, 60),
    text(g.vestibilita, 40) && 'Vestibilità: ' + text(g.vestibilita, 40)
  ].filter(Boolean).join('. ');
  return 'Studio e-commerce product photo of a single garment, described in Italian: ' + details + '. ' +
    'Show exactly this garment as a standard, classic version of it, faithful to the stated colour and pattern. ' +
    'Front view, the whole item visible and centred, neatly laid flat or on an invisible mannequin (shoes and accessories as a product shot). ' +
    'Plain uniform light grey seamless background, soft even lighting, gentle shadow. ' +
    'No person, no hands, no hanger, no text, no logo, no brand label, no props.';
}

async function generate(model, body) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, ...body })
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, result };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const denied = await checkAccount(req);
  if (denied) return res.status(401).json({ error: denied });

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Configura OPENAI_API_KEY su Vercel per creare le immagini dei capi.' });

  const g = req.body || {};
  if (!text(g.tipo, 80)) return res.status(400).json({ error: 'Manca il tipo di capo' });

  const body = { prompt: prompt(g), n: 1, size: '1024x1536', quality: 'low', output_format: 'jpeg', output_compression: 85 };
  try {
    let { ok, result } = await generate(MODEL, body);
    if (!ok && MODEL !== 'gpt-image-1' && /model/i.test(result.error?.message || '')) ({ ok, result } = await generate('gpt-image-1', body));
    if (!ok) throw Error(result.error?.message || 'Servizio immagini non disponibile');
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw Error('Nessuna immagine ricevuta');
    return res.status(200).json({ image: 'data:image/jpeg;base64,' + b64 });
  } catch (e) {
    return res.status(502).json({ error: 'Immagine non creata: ' + e.message });
  }
}
