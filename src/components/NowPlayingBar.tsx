import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";
import { useSpotify } from "../context/SpotifyContext";
import { formatDuration, playbackAction } from "../lib/spotifyApi";

export function NowPlayingBar() {
  const { nowPlaying, refreshNowPlaying } = useSpotify();
  const [pending, setPending] = useState(false);

  if (!nowPlaying?.item) return null;

  const track = nowPlaying.item;
  const cover = track.album.images[0]?.url;
  const progress = nowPlaying.progress_ms ?? 0;
  const duration = track.duration_ms;
  const percent = duration ? Math.min(100, (progress / duration) * 100) : 0;

  async function handleAction(action: "play" | "pause" | "next" | "previous") {
    setPending(true);
    try {
      await playbackAction(action);
      setTimeout(refreshNowPlaying, 400);
    } catch {
      // Richiede Spotify Premium e un dispositivo attivo: ignoriamo l'errore in UI.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="am-glass fixed inset-x-0 bottom-0 z-20 px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {cover && (
            <img
              src={cover}
              alt={track.album.name}
              className="h-12 w-12 rounded-md object-cover am-card-shadow"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{track.name}</p>
            <p className="truncate text-xs text-am-text-secondary">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-5">
            <button
              disabled={pending}
              onClick={() => handleAction("previous")}
              className="text-am-text-secondary transition-colors hover:text-am-text disabled:opacity-40"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              disabled={pending}
              onClick={() => handleAction(nowPlaying.is_playing ? "pause" : "play")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-am-text transition-transform hover:scale-105 disabled:opacity-40"
            >
              {nowPlaying.is_playing ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" />
              )}
            </button>
            <button
              disabled={pending}
              onClick={() => handleAction("next")}
              className="text-am-text-secondary transition-colors hover:text-am-text disabled:opacity-40"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
          <div className="hidden w-full max-w-xs items-center gap-2 sm:flex">
            <span className="w-9 text-right text-[10px] text-am-text-tertiary">
              {formatDuration(progress)}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-am-surface-2">
              <div className="h-full am-gradient-bg" style={{ width: `${percent}%` }} />
            </div>
            <span className="w-9 text-[10px] text-am-text-tertiary">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="hidden flex-1 justify-end md:flex" />
      </div>
    </div>
  );
}
