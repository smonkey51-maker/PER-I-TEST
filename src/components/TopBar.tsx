import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-am-border bg-am-bg/80 px-6 py-3 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex items-center gap-2 rounded-full bg-am-surface px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-am-pink/60">
          <Search size={16} className="text-am-text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca brani, artisti, album"
            className="w-full bg-transparent text-am-text placeholder:text-am-text-tertiary focus:outline-none"
          />
        </div>
      </form>
    </header>
  );
}
