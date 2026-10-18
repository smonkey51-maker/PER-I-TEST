# ATELIER — Personal Wardrobe

App personale con riconoscimento automatico dei capi tramite OpenAI API e sincronizzazione Google Drive.

## Deploy
Vercel collegato al branch predefinito della repository. Variabile server-side `OPENAI_API_KEY` (Production).

## Abilitare Google Drive
1. Apri Google Cloud Console (https://console.cloud.google.com/), crea o seleziona un progetto.
2. Abilita **Google Drive API**.
3. In Google Auth Platform configura la schermata consenso OAuth. Per uso personale puoi impostare l'app in **Testing** e aggiungere il tuo indirizzo Google tra i **test users**. I token di un'app in testing possono scadere dopo 7 giorni e richiedere una nuova autorizzazione.
4. Crea un **OAuth client ID** di tipo **Web application**.
5. In **Authorized JavaScript origins** aggiungi `https://atelier-personal-wardrobe.vercel.app` (senza slash finale). Aggiungi eventuali domini effettivamente utilizzati. Non serve un redirect URI per il token popup di Google Identity Services.
6. Apri ATELIER e inserisci il **Client ID** pubblico nel campo dedicato; premi **Collega Google Drive**. Non inserire mai il **Client Secret** nel browser.
7. Accedi con lo stesso account su telefono e desktop. Premi **Sincronizza ora**.

Permesso richiesto: `https://www.googleapis.com/auth/drive.file`, limitato ai file creati o aperti tramite l'app.

## Archiviazione
ATELIER crea una cartella `ATELIER` e salva una scheda JSON per capo, con metadati e fotografia JPEG compressa codificata in data URL. Questa è una soluzione personale iniziale: non un database transazionale. Con molti capi può diventare inefficiente. Per una versione avanzata conviene separare foto e metadati, gestire versioni/conflitti e aggiungere un account server-side.

**Importante:** non cancellare i dati del browser del telefono prima di aver collegato Drive e completato la prima sincronizzazione. Se rimuovi un capo mentre Drive non è collegato, la rimozione potrebbe non propagarsi.

## Style DNA
Smart Casual × Relaxed Sophistication; 70% sartoria rilassata, 20% carattere cromatico, 10% sperimentazione. Estate Soft × Cool, palette personale.
