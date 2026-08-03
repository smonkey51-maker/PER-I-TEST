import { getValidAccessToken } from "./spotifyAuth";
import type {
  CurrentlyPlaying,
  Paged,
  SpotifyAlbum,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyUser,
} from "../types/spotify";

const API_BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Non autenticato con Spotify.");

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 204) return null;

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Spotify API error ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export function getCurrentUser(): Promise<SpotifyUser | null> {
  return spotifyFetch<SpotifyUser>("/me");
}

export function getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
  return spotifyFetch<CurrentlyPlaying>("/me/player/currently-playing");
}

export async function getTopTracks(limit = 12): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<Paged<SpotifyTrack>>(
    `/me/top/tracks?limit=${limit}&time_range=short_term`,
  );
  return data?.items ?? [];
}

export async function getNewReleases(limit = 12): Promise<SpotifyAlbum[]> {
  const data = await spotifyFetch<{ albums: Paged<SpotifyAlbum> }>(
    `/browse/new-releases?limit=${limit}`,
  );
  return data?.albums.items ?? [];
}

export interface SpotifyCategory {
  id: string;
  name: string;
  icons: { url: string }[];
}

export async function getCategories(limit = 20): Promise<SpotifyCategory[]> {
  const data = await spotifyFetch<{ categories: Paged<SpotifyCategory> }>(
    `/browse/categories?limit=${limit}`,
  );
  return data?.categories.items ?? [];
}

export async function getUserPlaylists(limit = 30): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<Paged<SpotifyPlaylist>>(
    `/me/playlists?limit=${limit}`,
  );
  return data?.items ?? [];
}

export async function getPlaylist(id: string): Promise<{
  playlist: SpotifyPlaylist;
  tracks: SpotifyTrack[];
} | null> {
  const data = await spotifyFetch<
    SpotifyPlaylist & { tracks: Paged<{ track: SpotifyTrack }> }
  >(`/playlists/${id}`);
  if (!data) return null;
  return {
    playlist: data,
    tracks: data.tracks.items.map((item) => item.track).filter(Boolean),
  };
}

export interface SearchResults {
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  playlists: SpotifyPlaylist[];
}

export async function search(query: string): Promise<SearchResults> {
  if (!query.trim()) return { tracks: [], albums: [], playlists: [] };

  const params = new URLSearchParams({
    q: query,
    type: "track,album,playlist",
    limit: "10",
  });

  const data = await spotifyFetch<{
    tracks?: Paged<SpotifyTrack>;
    albums?: Paged<SpotifyAlbum>;
    playlists?: Paged<SpotifyPlaylist>;
  }>(`/search?${params.toString()}`);

  return {
    tracks: data?.tracks?.items ?? [],
    albums: data?.albums?.items ?? [],
    playlists: data?.playlists?.items?.filter(Boolean) ?? [],
  };
}

export function createPlaylist(
  userId: string,
  name: string,
  description = "",
): Promise<SpotifyPlaylist | null> {
  return spotifyFetch<SpotifyPlaylist>(`/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: false }),
  });
}

export async function playbackAction(
  action: "play" | "pause" | "next" | "previous",
): Promise<void> {
  const method = action === "next" || action === "previous" ? "POST" : "PUT";
  await spotifyFetch<null>(`/me/player/${action}`, { method });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
