import { Play } from "lucide-react";
import type { SpotifyTrack } from "../types/spotify";
import { formatDuration } from "../lib/spotifyApi";

interface TrackRowProps {
  track: SpotifyTrack;
  index: number;
}

export function TrackRow({ track, index }: TrackRowProps) {
  const cover = track.album.images[track.album.images.length - 1]?.url;

  return (
    <a
      href={`https://open.spotify.com/track/${track.id}`}
      target="_blank"
      rel="noreferrer"
      className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-am-surface"
    >
      <span className="relative text-am-text-tertiary">
        <span className="group-hover:opacity-0">{index}</span>
        <Play
          size={14}
          fill="currentColor"
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
        />
      </span>
      <span className="flex min-w-0 items-center gap-3">
        {cover && <img src={cover} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />}
        <span className="min-w-0">
          <p className="truncate font-medium text-am-text">{track.name}</p>
          <p className="truncate text-xs text-am-text-secondary">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
        </span>
      </span>
      <span className="text-xs text-am-text-tertiary">{formatDuration(track.duration_ms)}</span>
    </a>
  );
}
