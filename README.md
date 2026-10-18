# ATELIER

Guardaroba AI personale. Caricamento multiplo, riconoscimento visivo individuale e revisione prima del salvataggio.

## Deploy

Importa la repository in Vercel e imposta `OPENAI_API_KEY` come variabile d'ambiente server-side. Il backend `/api/analyze` usa un modello multimodale per classificare i capi. Senza chiave, puoi compilare manualmente le schede; non viene simulato alcun riconoscimento.

Le foto e i metadati approvati sono conservati nel browser con IndexedDB. Per sincronizzare dispositivi servono autenticazione e storage privato.

Style DNA: Smart Casual × Relaxed Sophistication; 70% sartoria rilassata, 20% colore, 10% sperimentazione.
