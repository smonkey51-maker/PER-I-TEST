# Music — UI ispirata ad Apple Music, dati da Spotify

Web app React + TypeScript + Vite con un'interfaccia scura ispirata al linguaggio
visivo di Apple Music (palette nero/rosa-rosso, card arrotondate, pannelli
sfocati "glass", mini player in basso) collegata al tuo account **Spotify**
tramite OAuth (Authorization Code + PKCE), per mostrare i tuoi brani, playlist
e la riproduzione in corso reali.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- react-router-dom
- Spotify Web API (nessun backend richiesto: auth PKCE lato client)

## Configurazione Spotify

1. Vai su [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) e crea un'app (o riusa quella esistente).
2. In **Redirect URIs** devono essere presenti, esattamente:
   - `http://127.0.0.1:3000/api/spotify/callback` per lo sviluppo locale
   - `https://meter-audiophile-app.vercel.app/api/spotify/callback` per la produzione su Vercel
3. Copia il **Client ID** e crea un file `.env` nella root del progetto:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SPOTIFY_CLIENT_ID=il-tuo-client-id
   ```

Non serve un Client Secret: il login usa il flusso **Authorization Code with
PKCE**, pensato per app client-side.

### Permessi richiesti

L'app richiede questi scope Spotify: lettura profilo, brani più ascoltati,
playlist, riproduzione in corso e controllo playback (play/pausa/skip).
Il controllo della riproduzione funziona solo con **Spotify Premium** e con
un dispositivo Spotify già attivo.

## Sviluppo

```bash
npm install
npm run dev
```

Apri `http://127.0.0.1:3000`.

## Build

```bash
npm run build
```

## Deploy su Vercel

Il progetto è una SPA statica (nessun backend/serverless): `vercel.json`
contiene un rewrite che instrada ogni percorso (incluso
`/api/spotify/callback`) su `index.html`, così React Router gestisce la
route di callback lato client dopo il redirect di Spotify.

## Struttura

- `src/lib/spotifyAuth.ts` — flusso OAuth PKCE, gestione/refresh token
- `src/lib/spotifyApi.ts` — chiamate autenticate alla Spotify Web API
- `src/context/SpotifyContext.tsx` — stato di autenticazione e utente corrente
- `src/pages/` — Login, Ascolta ora, Esplora, Cerca, Libreria, Playlist
- `src/components/` — Sidebar, TopBar, NowPlayingBar e componenti UI condivisi

## Nota sulla palette

I colori (nero profondo, gradiente rosa→rosso→arancio, superfici scure con
bordi sottili e pannelli in vetro sfumato) riprendono il linguaggio visivo
noto di Apple Music. La pagina Mobbin collegata non è stata raggiungibile
per l'estrazione automatica dei valori (risposta HTTP 403), quindi la
palette è stata ricostruita a mano in `src/index.css` (`@theme`).
