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
- **Oggi**: saluto con l'ora del giorno e il nome del profilo Google (letto una volta e tenuto solo su questo dispositivo), una frase su tempo e impegni, e un'idea per la giornata (prima i look salvati con tutti i capi lavati, poi un outfit composto con i capi lavati adatti alla stagione) e le liste dei capi **lavati** e **in lavatrice**.
- **Guardaroba**: capi per categoria e per preferiti, scheda con tutti i dati, quante volte e quando è stato indossato, modifica, lavatrice, rimozione.
- **Looks**: composizioni di capi o descrizioni a parole, modificabili. I capi descritti nel testo (separati da virgola) vengono collegati al look se nel guardaroba ci sono già, altrimenti aggiunti senza fotografia; l'elenco dei capi riconosciuti si vede mentre scrivi e si può escludere un capo togliendo la spunta. Un capo senza foto si completa dalla sua scheda con «Aggiungi foto». I capi dei tre look di partenza vengono inseriti nel guardaroba una sola volta per dispositivo (stesso controllo dei doppioni, identificativi fissi per non duplicarli tra dispositivi).
- **Aggiungi**: «Aggiungi un capo senza foto» apre una scheda da compilare a mano (basta il tipo, per esempio «Camicia bianca»; la foto si può aggiungere dopo dalla scheda del capo). Oppure fino a 40 fotografie per volta, analisi automatica e revisione prima di salvare. Le foto vengono portate al formato 4:5 con lo sfondo che prosegue il colore del bordo.

## Impegni da Google Calendar
Facoltativo. Al primo accesso Google chiede, oltre a Drive, la **sola lettura degli eventi** del calendario (`calendar.events.readonly`); se la rifiuti, in «Oggi» compare «Collega il calendario». Gli eventi di oggi si leggono nel browser, non vengono salvati e non vanno né al server né all'AI. Gli impegni con parole come riunione, cliente, cena, aperitivo, palestra, volo orientano l'idea del giorno: i capi con quella occasione nel campo «occasioni» hanno più probabilità di essere scelti. Gli eventi segnati come «libero», rifiutati o annullati vengono ignorati.

Un impegno che non è in calendario si aggiunge a mano da «Oggi» (Lavoro, Serata, Sport, Viaggio, oppure una frase libera come «cena con Anna»): conta come quelli del calendario per l'idea del giorno, vale solo per oggi e resta su questo dispositivo.

Da fare una volta su Google Cloud: abilita **Google Calendar API** e, in Google Auth Platform → Accesso ai dati, aggiungi l'ambito `https://www.googleapis.com/auth/calendar.events.readonly`. Chi aveva già fatto l'accesso mantiene Drive senza altre richieste e collega il calendario con il pulsante in «Oggi».

## Capi indossati e preferiti
«Indosso questo» segna i capi dell'idea come indossati oggi (la data viene salvata nella scheda del capo e si sincronizza con Drive). L'idea del giorno ne tiene conto: i capi appena indossati riposano, quelli che non metti da tempo tornano a farsi vedere e, se ne compare uno che non indossi da più di un mese, l'idea lo dice. I capi segnati come preferiti (cuore nella scheda, filtro «Preferiti» nel guardaroba) vengono scelti più spesso.

## Meteo e ispirazione di stile
- **Meteo**: in «Oggi» indichi dove sei (posizione del dispositivo, solo su richiesta, oppure il nome di una città). Le previsioni di oggi vengono lette da Open-Meteo (gratuito, senza chiavi): il luogo, con coordinate arrotondate a circa un chilometro, resta su questo dispositivo e non va su Drive. Il meteo guida l'idea del giorno: con il freddo maglieria e capospalla, con il caldo magliette e camicie senza capospalla, con la pioggia (almeno 50%) capospalla e promemoria dell'ombrello; contano le stagioni indicate nei capi, e se serve un capospalla lavato e non c'è, l'idea lo segnala. I look salvati si propongono solo se tutti i loro capi vanno bene con il meteo.
- **Ispirazione di stile**: scrivi il nome di una persona nota e l'app compone un outfit con i tuoi capi lavati ispirato al suo stile, tenendo conto di impegni e meteo (`/api/inspire`, serve l'accesso Google e usa il credito OpenAI, poche frazioni di centesimo per richiesta). Vengono inviati all'AI solo il nome e le schede testuali dei capi lavati, mai le fotografie. Non ci sono foto di personaggi: c'è il collegamento «Vedi foto di riferimento» che apre una ricerca immagini in una nuova scheda.

### Look reali delle celebrità
Nell'idea del giorno, scrivi un nome e premi «Cerca i suoi look»: `/api/celebrity` usa la ricerca sul web integrata nell'API Responses di OpenAI (strumento `web_search`, con ripiego su `web_search_preview`) per trovare fino a 3 look documentati, con tutti i componenti (accessori compresi), la marca solo quando una fonte la riporta, e per ognuno una versione accessibile di una catena comune con prezzo indicativo. Si tocca il ritratto, preso da Wikipedia (licenze chiare), per aprire i componenti: confronto con il tuo guardaroba («Simile nel tuo guardaroba»), fonti realmente citate dalla ricerca e «Componi con i miei capi» per riprodurre il look con quello che hai già. Le foto degli outfit non sono incorporate (diritti dei siti): si vedono aprendo le fonti.

Costo: ogni ricerca usa lo strumento di ricerca sul web a pagamento di OpenAI, di norma qualche centesimo; per questo i risultati restano in memoria 24 ore sul dispositivo e c'è un limite di 15 ricerche al giorno. Ricerca e risposta possono richiedere fino a un minuto: `vercel.json` porta il limite della funzione a 60 secondi. Le informazioni raccolte dal web possono essere incomplete o imprecise.

### Due outfit nella stessa giornata
L'app legge anche gli orari di inizio e fine. Se hai un impegno di lavoro e più tardi (da mezz'ora prima della fine del lavoro in poi) un impegno non lavorativo, per esempio lavoro fino alle 16 e una cena alle 18, «Oggi» propone due outfit: uno per il lavoro (stile sobrio) e uno per «Dopo il lavoro» (stile rétro) che tiene uno o due capi del primo e cambia gli altri: di solito camicia e pantaloni con scarpe diverse (mocassini → sneakers), a volte solo la camicia o solo i pantaloni con tutto il resto cambiato. Se mancano alternative per un capo, resta quello del primo outfit. Gli impegni aggiunti a mano (Serata, Sport…) senza orario contano come «dopo il lavoro» se c'è già un impegno di lavoro. «Indosso questo» segna tutti i capi di entrambi gli outfit.

### Domani e i prossimi giorni
Con il calendario collegato l'app legge gli impegni dei prossimi 8 giorni e, se hai indicato il luogo, le previsioni del meteo.
- **Domani** (in «Oggi»): outfit per il giorno dopo, con il primo impegno e il meteo, così la sera prima sai cosa preparare.
- **Settimana**: un outfit per ognuno dei 7 giorni successivi, con impegni e meteo del giorno, e due outfit quando c'è lavoro e poi un impegno non lavorativo. I capi già scelti per un giorno vengono evitati negli altri. «Un'altra idea» rigenera un solo giorno.
- **Lavatrice**: i capi scelti per un giorno futuro possono essere in lavatrice (pesano meno nella scelta); se ci sono, l'app avvisa di lavarli prima di quel giorno.

### Stile dei capi e «Cosa ti manca»
Ogni capo ha uno stile: Sobrio, Rétro o Neutro. È dedotto dalle parole della scheda, ma si può scegliere a mano da «Modifica» («Automatico» lo riporta alla deduzione) e vale per tutte le idee e i piani. In fondo a «Guardaroba», «Cosa ti manca» confronta il guardaroba con il tuo stile (pochi capi sopra o pantaloni, nessuna scarpa da lavoro o sneakers, pochi capi sobri per il lavoro o rétro per il tempo libero). Il calcolo avviene sul dispositivo, senza AI.

### Preferenza di stile
Nei giorni con un impegno di lavoro (compresi i turni) l'idea del giorno privilegia una sartorialità sobria e autorevole (giacche, camicie, lana, tinte unite e neutre, scarpe classiche); negli altri giorni una sartorialità rétro, più espressiva ed eccentrica (vintage, velluto, tweed, fantasie, colori di carattere). È una preferenza, non un obbligo: pesa sulla scelta a sorte dei capi in base ai dati della scheda. Lo stesso indirizzo viene passato all'ispirazione di stile. Gli eventi a tutto giorno «REC…» e «PER…» del calendario non sono considerati turni.

### Parole chiave degli impegni
Il titolo dell'impegno viene confrontato con queste parole (iniziano con il testo indicato, quindi «riunioni» vale, «sportello» no); un impegno può rientrare in più occasioni, per esempio «cena di lavoro» è serata e lavoro. L'elenco è in `app.js` (`OCCASIONS`).
- **Cerimonia**: cerimonia, matrimonio, nozze, battesimo, comunione, cresima, laurea, funerale, gala, inaugurazione, premiazione.
- **Serata**: cena, aperitivo, apericena, ristorante, pizzeria, trattoria, osteria, festa, party, compleanno, anniversario, teatro, concerto, cinema, opera, musical, mostra, vernissage, drink, cocktail, happy hour, brindisi, serata, evento, discoteca, degustazione, dinner, appuntamento romantico.
- **Lavoro** (anche «Ufficio»): i turni «Mattino SW», «Centrale SW», «Sera SW» (con o senza SW, anche «Reperibile») e poi riunione, meeting, call, videocall, videochiamata, cliente, colloquio, presentazione, ufficio, lavoro, workshop, intervista, review, demo, stand-up, kick-off, conferenza, convegno, congresso, fiera, seminario, formazione, trattativa, consulenza, assemblea, direttivo, board, sopralluogo, esame, lezione, sync.
- **Sport**: palestra, gym, workout, corsa, running, yoga, pilates, allenamento, sport, calcio, calcetto, tennis, padel, nuoto, piscina, bici, ciclismo, spinning, crossfit, fitness, trekking, escursione, camminata, sci, snowboard, golf, basket, pallavolo, boxe, arrampicata, danza, surf, vela.
- **Viaggio**: volo, treno, viaggio, aeroporto, aereo, stazione, partenza, rientro, trasferta, check-in, imbarco, hotel, vacanza, gita, transfer.
- **Tempo libero**: pranzo, brunch, colazione, caffè, shopping, amici, passeggiata, picnic, grigliata, barbecue, parco, museo, mercatino, spiaggia, mare, famiglia, bambini, relax, weekend.

## Analisi AI e sicurezza
`/api/analyze`, `/api/inspire` e `/api/celebrity` rispondono solo se la richiesta porta il token dell'account Google collegato all'app (verificato con Google, deve appartenere a questo Client ID). Per limitarla a specifici indirizzi, su Vercel aggiungi `ALLOWED_EMAILS` con gli indirizzi separati da virgola. Il credito OpenAI è prepagato: tienilo senza ricarica automatica.

## Installazione come app
Da Chrome apri `https://atelier-personal-wardrobe.vercel.app`: compare il pulsante **Installa app** (oppure menu ⋮ → «Installa app» / «Aggiungi a schermata Home»). L'app si apre a schermo intero e, grazie al service worker, anche senza connessione: i capi restano sul dispositivo e si sincronizzano al ritorno online.

## Struttura
`index.html` (markup), `style.css` (tema scuro fisso), `plan.js` (domani, prossimi giorni, cosa manca), `app.js` (archivio locale, foto, caricamento multiplo, modifica, lavatrice, idea del giorno, looks), `drive-sync.js` (accesso Google e sincronizzazione Drive), `manifest.json` e `sw.js` (installazione e uso offline), `icons/`, `fonts/` (Cormorant Garamond, licenza SIL OFL in `fonts/OFL.txt`), `api/` (analisi AI, ispirazione di stile, look delle celebrità e configurazione), `vercel.json` (durata massima della funzione di ricerca).
