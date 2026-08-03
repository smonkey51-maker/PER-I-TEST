import { useEffect, useState } from "react";
import { getCategories, getNewReleases, type SpotifyCategory } from "../lib/spotifyApi";
import type { SpotifyAlbum } from "../types/spotify";
import { HorizontalShelf } from "../components/HorizontalShelf";
import { AlbumCard } from "../components/AlbumCard";
import { GenreTile } from "../components/GenreTile";

export function Browse() {
  const [releases, setReleases] = useState<SpotifyAlbum[]>([]);
  const [categories, setCategories] = useState<SpotifyCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getNewReleases(16), getCategories(12)]).then(([r, c]) => {
      if (cancelled) return;
      if (r.status === "fulfilled") setReleases(r.value);
      if (c.status === "fulfilled") setCategories(c.value);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-6 py-6 pb-32 md:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Esplora</h1>

      {loading && <p className="text-sm text-am-text-secondary">Caricamento...</p>}

      {!loading && categories.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Generi e stati d'animo</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <GenreTile key={category.id} id={category.id} name={category.name} />
            ))}
          </div>
        </section>
      )}

      {!loading && releases.length > 0 && (
        <HorizontalShelf title="Nuove uscite per te">
          {releases.map((album) => (
            <AlbumCard
              key={album.id}
              imageUrl={album.images[0]?.url}
              title={album.name}
              subtitle={album.artists.map((a) => a.name).join(", ")}
            />
          ))}
        </HorizontalShelf>
      )}
    </div>
  );
}
