import { Navigate, Route, Routes } from "react-router-dom";
import { SpotifyProvider, useSpotify } from "./context/SpotifyContext";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { Login } from "./pages/Login";
import { Callback } from "./pages/Callback";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { Search } from "./pages/Search";
import { Library } from "./pages/Library";
import { PlaylistDetail } from "./pages/PlaylistDetail";

function AppShell() {
  const { loggedIn, loading } = useSpotify();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-am-bg">
        <p className="text-sm text-am-text-secondary">Caricamento...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <Routes>
        <Route path="/api/spotify/callback" element={<Callback />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-am-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/api/spotify/callback" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <NowPlayingBar />
    </div>
  );
}

function App() {
  return (
    <SpotifyProvider>
      <AppShell />
    </SpotifyProvider>
  );
}

export default App;
