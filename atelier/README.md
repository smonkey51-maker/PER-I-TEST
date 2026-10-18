# ATELIER — AI Wardrobe

Prototipo dell'esperienza di importazione massiva e revisione assistita da AI, indipendente dal quiz preesistente nella root del repository.

## Come funziona
- Apri `atelier/index.html` in un browser moderno.
- Scegli più fotografie: ogni immagine crea una scheda indipendente.
- Per l'analisi visiva automatica usa il backend `/api/analyze-garment` descritto in `api/README.md`.
- Controlla e correggi le schede prima di confermare l'importazione.
- I capi confermati vengono salvati in IndexedDB sul dispositivo.

## Importante
Il riconoscimento visivo vero richiede una API server-side e credenziali configurate sul server. La sola pagina statica non può identificare in modo affidabile tipologie e materiali. Senza backend, l'app permette la revisione manuale ma non inventa risultati AI.

## Style DNA
Smart Casual × Relaxed Sophistication. Formula 70% sartoria rilassata e minimalismo, 20% carattere cromatico, 10% sperimentazione. Armocromia provvisoria Estate Soft × Estate Cool, priorità all'esperienza reale.
