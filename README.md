# Quale drink sei davvero?

Sito statico, zero build step. File: `index.html`, `style.css`, `script.js`, `data.js`, `glasses.js`.

## Deploy su Vercel

**Opzione rapida (drag & drop):**
1. Vai su vercel.com → New Project → "Deploy" tramite drag & drop
2. Trascina la cartella `drink-quiz` (o il suo contenuto)
3. Vercel rileva automaticamente che è un sito statico, nessuna config necessaria

**Opzione via Git (consigliata per aggiornamenti futuri):**
1. Crea un repo GitHub con questi file nella root (o in una sotto-cartella, impostando la "Root Directory" nelle impostazioni Vercel)
2. Su vercel.com → New Project → importa il repo
3. Framework Preset: "Other" — nessun build command necessario
4. Deploy

## Modificare i contenuti
- Drink e domande: `data.js` — ogni drink ha `axes: [Intensità, Dolcezza, Classico-Sperimentale, Sociale-Intimo]` da 0 a 10, `ingredients` (composizione mostrata nel risultato), e `glass`/`color`/`garnish` per l'illustrazione
- Illustrazioni bicchieri: `glasses.js` — forme SVG line-art (rocks, coupe, highball, flute, mug, tiki, wine) e guarnizioni, sfondo sempre trasparente
- Testi/colori: `style.css` (variabili in `:root`)
- Logica: `script.js` — il match usa la distanza euclidea tra il profilo utente e le coordinate di ogni drink
