import { NavLink } from "react-router-dom";
import { Compass, Home, Library, LogOut, Music2, Search } from "lucide-react";
import { useSpotify } from "../context/SpotifyContext";

const navItems = [
  { to: "/", label: "Ascolta ora", icon: Home },
  { to: "/browse", label: "Esplora", icon: Compass },
  { to: "/search", label: "Cerca", icon: Search },
  { to: "/library", label: "La tua libreria", icon: Library },
];

export function Sidebar() {
  const { user, logout } = useSpotify();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-am-border bg-am-black/60 px-4 pb-24 pt-6">
      <div className="flex items-center gap-2 px-2 pb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg am-gradient-bg">
          <Music2 size={18} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Music</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-am-surface-2 text-am-text"
                  : "text-am-text-secondary hover:bg-am-surface hover:text-am-text"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-lg px-2 py-2">
        {user?.images?.[0]?.url ? (
          <img
            src={user.images[0].url}
            alt={user.display_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-am-surface-2 text-sm">
            {user?.display_name?.[0] ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.display_name ?? "Ospite"}</p>
        </div>
        <button
          onClick={logout}
          title="Esci"
          className="rounded-full p-2 text-am-text-secondary hover:bg-am-surface hover:text-am-text"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
