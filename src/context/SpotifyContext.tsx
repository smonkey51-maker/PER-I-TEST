import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearTokens, isLoggedIn, redirectToSpotifyLogin } from "../lib/spotifyAuth";
import { getCurrentUser, getCurrentlyPlaying } from "../lib/spotifyApi";
import type { CurrentlyPlaying, SpotifyUser } from "../types/spotify";

interface SpotifyContextValue {
  user: SpotifyUser | null;
  loggedIn: boolean;
  loading: boolean;
  nowPlaying: CurrentlyPlaying | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshNowPlaying: () => Promise<void>;
  completeLogin: () => void;
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [loading, setLoading] = useState(isLoggedIn());
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(null);

  const refreshNowPlaying = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const data = await getCurrentlyPlaying();
      setNowPlaying(data);
    } catch {
      // Nessuna riproduzione attiva o errore transitorio: ignoriamo.
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getCurrentUser()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          clearTokens();
          setLoggedIn(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    refreshNowPlaying();
    const interval = setInterval(refreshNowPlaying, 15_000);
    return () => clearInterval(interval);
  }, [loggedIn, refreshNowPlaying]);

  const login = useCallback(async () => {
    await redirectToSpotifyLogin();
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setNowPlaying(null);
    setLoggedIn(false);
  }, []);

  const completeLogin = useCallback(() => {
    setLoggedIn(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loggedIn,
      loading,
      nowPlaying,
      login,
      logout,
      refreshNowPlaying,
      completeLogin,
    }),
    [user, loggedIn, loading, nowPlaying, login, logout, refreshNowPlaying, completeLogin],
  );

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify(): SpotifyContextValue {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error("useSpotify deve essere usato dentro SpotifyProvider");
  return ctx;
}
