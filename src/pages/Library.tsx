import { useEffect, useState } from "react";
import { getUserPlaylists } from "../lib/spotifyApi";
import type { SpotifyPlaylist } from "../types/spotify";
import { AlbumCard } from "../components/AlbumCard";

export function Library() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserPlaylists()
      .then((data) => {
        if (!cancelled) setPlaylists(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-6 py-6 pb-32 md:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">La tua libreria</h1>

      {loading && <p className="text-sm text-am-text-secondary">Caricamento playlist...</p>}

      {!loading && playlists.length === 0 && (
        <p className="text-sm text-am-text-secondary">
          Non hai ancora playlist su Spotify. Creane una dall'app Spotify per vederla qui.
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {playlists.map((playlist) => (
          <AlbumCard
            key={playlist.id}
            to={`/playlist/${playlist.id}`}
            imageUrl={playlist.images[0]?.url}
            title={playlist.name}
            subtitle={`${playlist.tracks.total} brani`}
          />
        ))}
      </div>
    </div>
  );
}
