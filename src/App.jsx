import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Playlists from "./pages/Playlists";
import Songs from "./pages/Songs";
import Artists from "./pages/Artists";
import Albums from "./pages/Albums";
import LikedSongs from "./pages/LikedSongs";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/liked-songs" element={<LikedSongs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
