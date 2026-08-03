import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { search, type SearchResults } from "../lib/spotifyApi";
import { TrackRow } from "../components/TrackRow";
import { HorizontalShelf } from "../components/HorizontalShelf";
import { AlbumCard } from "../components/AlbumCard";

export function Search() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    search(query)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="px-6 py-6 pb-32 md:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {query ? `Risultati per "${query}"` : "Cerca"}
      </h1>

      {!query && (
        <p className="text-sm text-am-text-secondary">
          Usa la barra di ricerca in alto per trovare brani, album e playlist su Spotify.
        </p>
      )}

      {loading && <p className="text-sm text-am-text-secondary">Ricerca in corso...</p>}

      {results?.albums && results.albums.length > 0 && (
        <HorizontalShelf title="Album">
          {results.albums.map((album) => (
            <AlbumCard
              key={album.id}
              imageUrl={album.images[0]?.url}
              title={album.name}
              subtitle={album.artists.map((a) => a.name).join(", ")}
            />
          ))}
        </HorizontalShelf>
      )}

      {results?.playlists && results.playlists.length > 0 && (
        <HorizontalShelf title="Playlist">
          {results.playlists.map((playlist) => (
            <AlbumCard
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              imageUrl={playlist.images[0]?.url}
              title={playlist.name}
              subtitle={`Di ${playlist.owner.display_name}`}
            />
          ))}
        </HorizontalShelf>
      )}

      {results?.tracks && results.tracks.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Brani</h2>
          <div className="flex flex-col">
            {results.tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      {results &&
        !loading &&
        results.tracks.length === 0 &&
        results.albums.length === 0 &&
        results.playlists.length === 0 && (
          <p className="text-sm text-am-text-secondary">Nessun risultato trovato.</p>
        )}
    </div>
  );
}
