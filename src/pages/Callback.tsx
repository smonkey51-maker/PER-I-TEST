import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../lib/spotifyAuth";
import { useSpotify } from "../context/SpotifyContext";

export function Callback() {
  const navigate = useNavigate();
  const { completeLogin } = useSpotify();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authError = params.get("error");

    if (authError) {
      setError("Accesso negato su Spotify.");
      return;
    }

    if (!code) {
      setError("Codice di autorizzazione mancante.");
      return;
    }

    exchangeCodeForToken(code)
      .then(() => {
        completeLogin();
        navigate("/", { replace: true });
      })
      .catch((err: Error) => setError(err.message));
  }, [navigate, completeLogin]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-am-bg px-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-am-pink-light">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="rounded-full bg-am-surface px-6 py-2 text-sm font-medium hover:bg-am-surface-2"
          >
            Torna al login
          </button>
        </>
      ) : (
        <p className="text-sm text-am-text-secondary">Accesso in corso...</p>
      )}
    </div>
  );
}
