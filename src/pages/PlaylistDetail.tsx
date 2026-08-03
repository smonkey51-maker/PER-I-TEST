import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlaylist } from "../lib/spotifyApi";
import type { SpotifyPlaylist, SpotifyTrack } from "../types/spotify";
import { TrackRow } from "../components/TrackRow";

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getPlaylist(id)
      .then((data) => {
        if (cancelled || !data) return;
        setPlaylist(data.playlist);
        setTracks(data.tracks);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="px-6 py-6 pb-32 md:px-8">
        <p className="text-sm text-am-text-secondary">Caricamento playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-6 py-6 pb-32 md:px-8">
        <p className="text-sm text-am-text-secondary">Playlist non trovata.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 pb-32 md:px-8">
      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left">
        {playlist.images[0]?.url && (
          <img
            src={playlist.images[0].url}
            alt={playlist.name}
            className="am-card-shadow h-40 w-40 shrink-0 rounded-xl object-cover sm:h-48 sm:w-48"
          />
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-am-text-secondary">
            Playlist
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{playlist.name}</h1>
          <p className="mt-2 text-sm text-am-text-secondary">
            Di {playlist.owner.display_name} · {playlist.tracks.total} brani
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {tracks.map((track, i) => (
          <TrackRow key={`${track.id}-${i}`} track={track} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
