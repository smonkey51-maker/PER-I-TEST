import { Link } from "react-router-dom";

interface AlbumCardProps {
  to?: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
}

export function AlbumCard({ to, imageUrl, title, subtitle }: AlbumCardProps) {
  const content = (
    <div className="group w-40 shrink-0 sm:w-44">
      <div className="am-card-shadow aspect-square overflow-hidden rounded-xl bg-am-surface-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-am-text-tertiary">
            ♪
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-am-text">{title}</p>
      <p className="truncate text-xs text-am-text-secondary">{subtitle}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
