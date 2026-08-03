import { Music2 } from "lucide-react";
import { useSpotify } from "../context/SpotifyContext";
import { isSpotifyConfigured } from "../lib/spotifyAuth";

export function Login() {
  const { login } = useSpotify();
  const configured = isSpotifyConfigured();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-am-bg px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl am-gradient-bg am-card-shadow">
        <Music2 size={40} strokeWidth={2} className="text-white" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="am-gradient-text">Music</span>
        </h1>
        <p className="mt-2 max-w-sm text-sm text-am-text-secondary">
          Accedi con il tuo account Spotify per ascoltare la tua libreria, le playlist e i brani
          del momento in un'interfaccia ispirata ad Apple Music.
        </p>
      </div>

      {configured ? (
        <button
          onClick={() => login()}
          className="am-gradient-bg rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          Accedi con Spotify
        </button>
      ) : (
        <div className="max-w-sm rounded-xl border border-am-border bg-am-surface p-4 text-left text-xs text-am-text-secondary">
          <p className="font-semibold text-am-text">Configurazione richiesta</p>
          <p className="mt-1">
            Imposta <code className="text-am-pink-light">VITE_SPOTIFY_CLIENT_ID</code> nel file{" "}
            <code>.env</code> (vedi README) per abilitare il login.
          </p>
        </div>
      )}
    </div>
  );
}
