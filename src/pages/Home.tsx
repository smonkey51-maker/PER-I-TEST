import { useEffect, useState } from "react";
import { getNewReleases, getTopTracks } from "../lib/spotifyApi";
import type { SpotifyAlbum, SpotifyTrack } from "../types/spotify";
import { HorizontalShelf } from "../components/HorizontalShelf";
import { AlbumCard } from "../components/AlbumCard";
import { useSpotify } from "../context/SpotifyContext";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Buonanotte";
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export function Home() {
  const { user } = useSpotify();
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getTopTracks(), getNewReleases()]).then(([top, releases]) => {
      if (cancelled) return;
      if (top.status === "fulfilled") setTopTracks(top.value);
      if (releases.status === "fulfilled") setNewReleases(releases.value);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-6 py-6 pb-32 md:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {getGreeting()}
        {user ? `, ${user.display_name.split(" ")[0]}` : ""}
      </h1>

      {loading && (
        <p className="text-sm text-am-text-secondary">Caricamento della tua musica...</p>
      )}

      {!loading && topTracks.length > 0 && (
        <HorizontalShelf title="I tuoi brani del momento">
          {topTracks.map((track) => (
            <AlbumCard
              key={track.id}
              imageUrl={track.album.images[0]?.url}
              title={track.name}
              subtitle={track.artists.map((a) => a.name).join(", ")}
            />
          ))}
        </HorizontalShelf>
      )}

      {!loading && newReleases.length > 0 && (
        <HorizontalShelf title="Nuove uscite">
          {newReleases.map((album) => (
            <AlbumCard
              key={album.id}
              imageUrl={album.images[0]?.url}
              title={album.name}
              subtitle={album.artists.map((a) => a.name).join(", ")}
            />
          ))}
        </HorizontalShelf>
      )}

      {!loading && topTracks.length === 0 && newReleases.length === 0 && (
        <p className="text-sm text-am-text-secondary">
          Ascolta qualche brano su Spotify per vedere qui i tuoi consigli personalizzati.
        </p>
      )}
    </div>
  );
}
