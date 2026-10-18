const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
// Facoltativo: elenco di indirizzi Google autorizzati, separati da virgola (variabile Vercel ALLOWED_EMAILS)
const ALLOWED = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const CATEGORIES = ['Maglieria', 'Camicie e T-shirt', 'Pantaloni e jeans', 'Giacche e capispalla', 'Scarpe', 'Accessori', 'Altro'];
const KEYS = ['categoria', 'tipo', 'colore', 'materiale', 'texture', 'vestibilita', 'stagione', 'occasioni', 'compatibilita'];

const SYSTEM_PROMPT =
  'Sei un catalogatore esperto di abbigliamento. Rispondi esclusivamente con un oggetto JSON con chiavi stringa ' + KEYS.join(',') + '. ' +
  'In italiano. La chiave categoria deve essere esattamente una tra: ' + CATEGORIES.join(', ') + '. ' +
  'Identifica il capo principale fotografato. Se una caratteristica non è determinabile con certezza, scrivi "non determinabile". ' +
  'Non inventare composizioni dei tessuti o misure. ' +
  'La compatibilità valuta stile smart casual / relaxed sophisticated, colori preferiti grigio-blu, marrone, rosso scuro, azzurro, cammello, navy, oliva, lilla, viola, tortora, bordeaux; acquamarina brillante meno gradita. ' +
  'Prediligi regular fit e relaxed tailored, senza dedurre la taglia da una foto.';

// Accetta solo chi ha fatto l'accesso con Google in questa app: evita che altri consumino il credito OpenAI.
async function checkAccount(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return "Accedi con Google per usare l'analisi automatica.";
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const denied = await checkAccount(req);
  if (denied) return res.status(401).json({ error: denied });

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Configura OPENAI_API_KEY su Vercel per attivare il riconoscimento automatico.' });

  const image = req.body?.image;
  if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 6_000_000) {
    return res.status(400).json({ error: 'Immagine non valida o troppo grande' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'text', text: 'Cataloga questo capo di abbigliamento.' }, { type: 'image_url', image_url: { url: image, detail: 'low' } }] }
        ]
      })
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error?.message || 'Servizio AI non disponibile');
    const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    const out = Object.fromEntries(KEYS.map(k => [k, typeof parsed[k] === 'string' ? parsed[k] : 'non determinabile']));
    if (!CATEGORIES.includes(out.categoria)) out.categoria = 'Altro';
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: 'Analisi non riuscita: ' + e.message });
  }
}
