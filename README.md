# ATELIER — Personal Wardrobe

App personale con riconoscimento automatico dei capi tramite OpenAI API e sincronizzazione Google Drive.

## Deploy
Vercel collegato al branch predefinito della repository. Variabile server-side `OPENAI_API_KEY` (Production).

## Abilitare Google Drive (una sola volta)
1. In Google Cloud Console crea o seleziona un progetto e abilita **Google Drive API**.
2. Configura la schermata consenso OAuth e portala **In production** (così l'autorizzazione non scade dopo 7 giorni; comparirà solo l'avviso "app non verificata" al primo accesso).
3. Crea un **OAuth client ID** di tipo **Web application** e in **Authorized JavaScript origins** aggiungi `https://atelier-personal-wardrobe.vercel.app` (senza slash finale).
4. Il Client ID pubblico è in `api/config.js` (si può sovrascrivere con la variabile Vercel `GOOGLE_CLIENT_ID`). Mai il Client Secret.
5. Su ogni dispositivo premi **Accedi con Google** la prima volta. Dalle aperture successive l'app ricollega Drive e scarica i capi in automatico; se il browser blocca l'accesso silenzioso basta un tocco su "Accedi con Google".

Permesso richiesto: `https://www.googleapis.com/auth/drive.file`, limitato ai file creati o aperti tramite l'app.

## Archiviazione
Su Drive ATELIER usa la cartella `ATELIER` con una sottocartella per sezione: `Guardaroba` (una scheda JSON per capo, con metadati e fotografia JPEG compressa) e `Looks` (una scheda JSON per look). I file salvati in passato direttamente in `ATELIER` vengono spostati nelle sottocartelle alla prima sincronizzazione. Questa è una soluzione personale iniziale: non un database transazionale. Con molti capi può diventare inefficiente. Per una versione avanzata conviene separare foto e metadati, gestire versioni/conflitti e aggiungere un account server-side.

**Importante:** non cancellare i dati del browser del telefono prima di aver collegato Drive e completato la prima sincronizzazione. Se rimuovi un capo mentre Drive non è collegato, la rimozione potrebbe non propagarsi.

## Style DNA
Smart Casual × Relaxed Sophistication; 70% sartoria rilassata, 20% carattere cromatico, 10% sperimentazione. Estate Soft × Cool, palette personale.

## Struttura
`index.html` (markup), `style.css` (tema scuro fisso), `app.js` (archivio locale, caricamento multiplo, categorie, looks), `drive-sync.js` (accesso Google e sincronizzazione Drive), `api/` (analisi AI e configurazione).
