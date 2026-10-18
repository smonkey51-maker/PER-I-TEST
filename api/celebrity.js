const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
// Facoltativo: elenco di indirizzi Google autorizzati, separati da virgola (variabile Vercel ALLOWED_EMAILS)
const ALLOWED = (process.env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const CATEGORIES = ['Maglieria', 'Camicie e T-shirt', 'Pantaloni e jeans', 'Giacche e capispalla', 'Scarpe', 'Accessori', 'Altro'];

const SYSTEM_PROMPT =
  'Sei un assistente di styling con accesso al web. Cerca SEMPRE sul web, prima di rispondere, i look recenti e documentati della persona indicata ' +
  '(red carpet, eventi, street style) su fonti di moda affidabili. Non inventare nulla: indica la marca di un capo solo se compare in una fonte, ' +
  'altrimenti lascia la marca vuota. Elenca tutti i componenti visibili, accessori compresi (orologio, occhiali, cintura, borsa, gioielli, scarpe). ' +
  'Per ogni componente proponi anche una versione accessibile di una catena comune (per esempio Zara, H&M, Uniqlo, Mango, COS, Decathlon) con un prezzo indicativo in euro: ' +
  'budget normale, non da star. Rispondi SOLO con JSON valido, senza testo fuori dal JSON, con questa forma: ' +
  '{"persona":"Nome Cognome","look":[{"titolo":"...","occasione":"...","data":"mese anno","descrizione":"...","componenti":[{"capo":"...","categoria":"' + CATEGORIES.join('|') + '","marca":"... oppure vuoto","dettaglio":"colore, materiale","budget":{"descrizione":"...","negozio":"...","prezzo":"40–60 €"}}]}]}. ' +
  'Al massimo 3 look e 8 componenti per look, in italiano. Se non conosci la persona o non trovi look documentati rispondi {"sconosciuto":true}.';

// Accetta solo chi ha fatto l'accesso con Google in questa app (stesso controllo di /api/analyze)
async function checkAccount(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return 'Accedi con Google per cercare i look.';
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

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };

// Ricerca sul web con lo strumento integrato dell'API Responses di OpenAI
async function searchWeb(toolType, person) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      instructions: SYSTEM_PROMPT,
      input: 'Persona: ' + person + '. Cerca i suoi look recenti e riconoscibili e descrivi i componenti con marche e alternative economiche.',
      tools: [{ type: toolType, search_context_size: 'medium', user_location: { type: 'approximate', country: 'IT' } }],
      temperature: 0.2,
      max_output_tokens: 3500
    })
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

function extractJson(text) {
  const t = String(text || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const denied = await checkAccount(req);
  if (denied) return res.status(401).json({ error: denied });

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Configura OPENAI_API_KEY su Vercel per attivare questa funzione.' });

  const person = str(req.body?.person, 60);
  if (!person) return res.status(400).json({ error: 'Scrivi il nome di una persona.' });

  try {
    let out = await searchWeb('web_search', person);
    // alcune versioni dell'API chiamano lo strumento «web_search_preview»
    if (!out.ok && out.status === 400 && /web_search|tool/i.test(JSON.stringify(out.data.error || ''))) out = await searchWeb('web_search_preview', person);
    if (!out.ok) throw Error(out.data.error?.message || 'Servizio AI non disponibile (' + out.status + ')');

    const parts = (out.data.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).filter(c => c.type === 'output_text');
    const parsed = extractJson(parts.map(c => c.text).join('\n'));
    if (!parsed || parsed.sconosciuto) {
      return res.status(422).json({ error: 'Non ho trovato look documentati di questa persona. Prova con un altro nome.' });
    }

    // Le fonti sono quelle che la ricerca ha davvero citato, non indirizzi scritti dal modello
    const seen = new Set();
    const fonti = parts.flatMap(c => c.annotations || [])
      .filter(a => a.type === 'url_citation' && safeUrl(a.url))
      .map(a => ({ url: safeUrl(a.url), titolo: str(a.title, 120) }))
      .filter(f => !seen.has(f.url) && seen.add(f.url))
      .slice(0, 6);

    const look = (Array.isArray(parsed.look) ? parsed.look : []).slice(0, 3).map(l => ({
      titolo: str(l?.titolo, 100),
      occasione: str(l?.occasione, 80),
      data: str(l?.data, 40),
      descrizione: str(l?.descrizione, 400),
      componenti: (Array.isArray(l?.componenti) ? l.componenti : []).slice(0, 8).map(c => ({
        capo: str(c?.capo, 80),
        categoria: CATEGORIES.includes(c?.categoria) ? c.categoria : 'Altro',
        marca: str(c?.marca, 60),
        dettaglio: str(c?.dettaglio, 100),
        budget: { descrizione: str(c?.budget?.descrizione, 120), negozio: str(c?.budget?.negozio, 40), prezzo: str(c?.budget?.prezzo, 40) }
      })).filter(c => c.capo)
    })).filter(l => l.componenti.length);

    if (!look.length) return res.status(422).json({ error: 'Non ho trovato look documentati di questa persona. Prova con un altro nome.' });
    return res.status(200).json({ persona: str(parsed.persona, 80) || person, look, fonti });
  } catch (e) {
    return res.status(502).json({ error: 'Ricerca non riuscita: ' + e.message });
  }
}
