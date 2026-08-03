const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;

export const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

const STORAGE_KEYS = {
  verifier: "spotify_code_verifier",
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expiresAt: "spotify_expires_at",
};

function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

export function isSpotifyConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

export async function redirectToSpotifyLogin(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error(
      "VITE_SPOTIFY_CLIENT_ID non impostato. Vedi README per la configurazione.",
    );
  }

  const verifier = generateRandomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  window.sessionStorage.setItem(STORAGE_KEYS.verifier, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.assign(`${AUTH_ENDPOINT}?${params.toString()}`);
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
  localStorage.setItem(
    STORAGE_KEYS.expiresAt,
    String(Date.now() + tokens.expires_in * 1000),
  );
  if (tokens.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
  }
}

export async function exchangeCodeForToken(code: string): Promise<void> {
  const verifier = window.sessionStorage.getItem(STORAGE_KEYS.verifier);
  if (!verifier || !CLIENT_ID) {
    throw new Error("Sessione di login non valida, riprova.");
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Scambio del codice di autorizzazione fallito.");
  }

  const tokens: TokenResponse = await response.json();
  storeTokens(tokens);
  window.sessionStorage.removeItem(STORAGE_KEYS.verifier);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken || !CLIENT_ID) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const tokens: TokenResponse = await response.json();
  storeTokens(tokens);
  return tokens.access_token;
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEYS.refreshToken));
}

export async function getValidAccessToken(): Promise<string | null> {
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) ?? 0);
  const currentToken = localStorage.getItem(STORAGE_KEYS.accessToken);

  if (currentToken && Date.now() < expiresAt - 30_000) {
    return currentToken;
  }

  return refreshAccessToken();
}
