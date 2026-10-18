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
Su Drive ATELIER usa la cartella `ATELIER` con una sottocartella per sezione: `Guardaroba` (una scheda JSON per capo, senza foto), `Foto` (una fotografia JPEG per capo), `Looks` (una scheda JSON per look) ed `Eliminati` (una traccia per ogni capo o look rimosso, così la cancellazione arriva anche agli altri dispositivi). Ogni scheda porta la data dell'ultima modifica come proprietà del file: modifiche, lavatrice e cancellazioni si sincronizzano tra i dispositivi (vince l'ultima modifica). I file salvati con le versioni precedenti, anche quelli con la foto dentro la scheda, vengono convertiti alla prima sincronizzazione. Questa è una soluzione personale: non un database transazionale.

**Importante:** non cancellare i dati del browser del telefono prima di aver collegato Drive e completato la prima sincronizzazione. Se rimuovi un capo mentre Drive non è collegato, la rimozione viene propagata al prossimo accesso.

## Style DNA
Smart Casual × Relaxed Sophistication; 70% sartoria rilassata, 20% carattere cromatico, 10% sperimentazione. Estate Soft × Cool, palette personale.

## Sezioni dell'app
- **Oggi**: un'idea per la giornata (prima i look salvati con tutti i capi lavati, poi un outfit composto con i capi lavati adatti alla stagione) e le liste dei capi **lavati** e **in lavatrice**.
- **Guardaroba**: capi per categoria, scheda con tutti i dati, modifica, lavatrice, rimozione.
- **Looks**: composizioni di capi o descrizioni a parole, modificabili. I capi descritti nel testo (separati da virgola) vengono collegati al look se nel guardaroba ci sono già, altrimenti aggiunti senza fotografia; l'elenco dei capi riconosciuti si vede mentre scrivi e si può escludere un capo togliendo la spunta. Un capo senza foto si completa dalla sua scheda con «Aggiungi foto». I capi dei tre look di partenza vengono inseriti nel guardaroba una sola volta per dispositivo (stesso controllo dei doppioni, identificativi fissi per non duplicarli tra dispositivi).
- **Aggiungi**: fino a 40 fotografie per volta, analisi automatica e revisione prima di salvare. Le foto vengono portate al formato 4:5 con lo sfondo che prosegue il colore del bordo.

## Impegni da Google Calendar
Facoltativo. Al primo accesso Google chiede, oltre a Drive, la **sola lettura degli eventi** del calendario (`calendar.events.readonly`); se la rifiuti, in «Oggi» compare «Collega il calendario». Gli eventi di oggi si leggono nel browser, non vengono salvati e non vanno né al server né all'AI. Gli impegni con parole come riunione, cliente, cena, aperitivo, palestra, volo orientano l'idea del giorno: i capi con quella occasione nel campo «occasioni» hanno più probabilità di essere scelti. Gli eventi segnati come «libero», rifiutati o annullati vengono ignorati.

Da fare una volta su Google Cloud: abilita **Google Calendar API** e, in Google Auth Platform → Accesso ai dati, aggiungi l'ambito `https://www.googleapis.com/auth/calendar.events.readonly`. Chi aveva già fatto l'accesso mantiene Drive senza altre richieste e collega il calendario con il pulsante in «Oggi».

## Analisi AI e sicurezza
`/api/analyze` risponde solo se la richiesta porta il token dell'account Google collegato all'app (verificato con Google, deve appartenere a questo Client ID). Per limitarla a specifici indirizzi, su Vercel aggiungi `ALLOWED_EMAILS` con gli indirizzi separati da virgola. Il credito OpenAI è prepagato: tienilo senza ricarica automatica.

## Installazione come app
Da Chrome apri `https://atelier-personal-wardrobe.vercel.app`: compare il pulsante **Installa app** (oppure menu ⋮ → «Installa app» / «Aggiungi a schermata Home»). L'app si apre a schermo intero e, grazie al service worker, anche senza connessione: i capi restano sul dispositivo e si sincronizzano al ritorno online.

## Struttura
`index.html` (markup), `style.css` (tema scuro fisso), `app.js` (archivio locale, foto, caricamento multiplo, modifica, lavatrice, idea del giorno, looks), `drive-sync.js` (accesso Google e sincronizzazione Drive), `manifest.json` e `sw.js` (installazione e uso offline), `icons/`, `fonts/` (Cormorant Garamond, licenza SIL OFL in `fonts/OFL.txt`), `api/` (analisi AI e configurazione).
