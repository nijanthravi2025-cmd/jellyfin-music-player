import React, { useState, useEffect, useRef } from "react";
import { Play, Dices, Folder, Sparkles, Music, MoreVertical, Edit3, Trash2, FolderPlus, Check, X, Clipboard, ListMusic, Heart, Image } from "lucide-react";
import "./Home.css";
import "./Songs.css"; // Reuse context menu styles
import { toggleLikeSong, isSongLiked, addToQueue, playTrack } from "../utils/musicShared";

const ALL_MOCK_ALBUMS = [
  { id: 101, title: "After Hours", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 102, title: "Random Access Memories", artist: "Daft Punk", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 103, title: "Interstellar OST", artist: "Hans Zimmer", image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 104, title: "When We All Fall Asleep", artist: "Billie Eilish", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 105, title: "Discovery", artist: "Daft Punk", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 106, title: "Starboy", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 107, title: "Inception OST", artist: "Hans Zimmer", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 108, title: "Don't Smile at Me", artist: "Billie Eilish", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 109, title: "Dawn FM", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 110, title: "Homework", artist: "Daft Punk", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 111, title: "Dune OST", artist: "Hans Zimmer", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250" },
  { id: 112, title: "Happier Than Ever", artist: "Billie Eilish", image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250" },
];

const ALL_MOCK_ARTISTS = [
  {
    id: 201,
    name: "The Weeknd",
    genre: "R&B / Pop",
    followers: "78.4M",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 1, title: "Blinding Lights", album: "After Hours", duration: "3:20" },
      { id: 2, title: "Starboy", album: "Starboy", duration: "3:50" },
      { id: 3, title: "Save Your Tears", album: "After Hours", duration: "3:35" }
    ]
  },
  {
    id: 202,
    name: "Daft Punk",
    genre: "Electronic / House",
    followers: "18.2M",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 4, title: "Get Lucky", album: "Random Access Memories", duration: "6:09" },
      { id: 5, title: "One More Time", album: "Discovery", duration: "5:20" },
      { id: 6, title: "Harder, Better, Faster, Stronger", album: "Discovery", duration: "3:44" }
    ]
  },
  {
    id: 203,
    name: "Hans Zimmer",
    genre: "Cinematic / Classical",
    followers: "12.5M",
    image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 7, title: "Cornfield Chase", album: "Interstellar OST", duration: "2:06" },
      { id: 8, title: "Time", album: "Inception OST", duration: "4:35" },
      { id: 9, title: "Stay", album: "Interstellar OST", duration: "6:52" }
    ]
  },
  {
    id: 204,
    name: "Billie Eilish",
    genre: "Alternative / Pop",
    followers: "48.9M",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 10, title: "Bad Guy", album: "When We All Fall Asleep", duration: "3:14" },
      { id: 11, title: "Ocean Eyes", album: "Don't Smile at Me", duration: "3:20" },
      { id: 12, title: "Happier Than Ever", album: "Happier Than Ever", duration: "4:58" }
    ]
  }
];

const INITIAL_ADDED_DRIVE_ALBUMS = [
  {
    id: 1,
    title: "Vaporwave Nights",
    artist: "Synthwave",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250&h=250",
    path: "D:/Music/Vaporwave/Vaporwave Nights",
    dateAdded: "2 hours ago",
    timestamp: 1
  },
  {
    id: 2,
    title: "Focus Flow Beats",
    artist: "Lo-Fi Beats",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250",
    path: "C:/Users/NIJANTH/Music/Focus Flow",
    dateAdded: "Yesterday",
    timestamp: 2
  },
  {
    id: 3,
    title: "Deep House 2026",
    artist: "Mixed Artists",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250",
    path: "D:/Media/Tracks/Deep House 2026",
    dateAdded: "3 days ago",
    timestamp: 3
  },
  {
    id: 4,
    title: "Acoustic Morning",
    artist: "Indie Folk",
    image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250",
    path: "E:/Audio/Folk/Acoustic Morning",
    dateAdded: "Last week",
    timestamp: 4
  }
];

export default function Home() {
  const [driveAlbums, setDriveAlbums] = useState(() => {
    const saved = localStorage.getItem("music_drive_albums");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ADDED_DRIVE_ALBUMS;
  });
  const [randomAlbums, setRandomAlbums] = useState([]);
  const [spotlightArtist, setSpotlightArtist] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [renameType, setRenameType] = useState(""); // "drive", "randomAlbum", "spotlightTrack"
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");

  // Cover Modal States
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverItem, setCoverItem] = useState(null);
  const [coverType, setCoverType] = useState(""); // "drive", "randomAlbum", "spotlightTrack"
  const [editImage, setEditImage] = useState("");

  const [toast, setToast] = useState("");
  const activeMenuRef = useRef(null);

  // Load playlists from localStorage
  useEffect(() => {
    const loadPlaylistsList = () => {
      const saved = localStorage.getItem("music_playlists");
      if (saved) {
        try {
          setPlaylists(JSON.parse(saved));
        } catch (e) {
          setPlaylists(["Chill Acoustic Vibes", "Deep Focus Beats", "Vaporwave Nights"]);
        }
      } else {
        const defaultPL = ["Chill Acoustic Vibes", "Deep Focus Beats", "Vaporwave Nights"];
        localStorage.setItem("music_playlists", JSON.stringify(defaultPL));
        setPlaylists(defaultPL);
      }
    };
    
    loadPlaylistsList();
    window.addEventListener("playlistsChanged", loadPlaylistsList);
    return () => window.removeEventListener("playlistsChanged", loadPlaylistsList);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeMenuRef.current && !activeMenuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [likedListVersion, setLikedListVersion] = useState(0);

  // Sync liked status updates
  useEffect(() => {
    const handleLikesChange = () => {
      setLikedListVersion(prev => prev + 1);
    };
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => window.removeEventListener("likedSongsChanged", handleLikesChange);
  }, []);

  const rollTheDice = () => {
    const shuffled = [...ALL_MOCK_ALBUMS].sort(() => 0.5 - Math.random());
    setRandomAlbums(shuffled.slice(0, 4));
  };

  const spotlightRandomArtist = () => {
    const randomIndex = Math.floor(Math.random() * ALL_MOCK_ARTISTS.length);
    setSpotlightArtist(ALL_MOCK_ARTISTS[randomIndex]);
  };

  useEffect(() => {
    rollTheDice();
    spotlightRandomArtist();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (item, type) => {
    setRenameItem(item);
    setRenameType(type);
    setEditTitle(item.title || "");
    setEditArtist(item.artist || "");
    setEditAlbum(item.album || "");
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleRenameTrackClick = (track) => {
    setRenameItem(track);
    setRenameType("spotlightTrack");
    setEditTitle(track.title || "");
    setEditArtist(spotlightArtist ? spotlightArtist.name : "");
    setEditAlbum(track.album || "");
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();
    const trimmedAlbum = editAlbum.trim();

    let changes = [];
    if (renameType === "drive") {
      const oldVal = driveAlbums.find(item => item.id === renameItem.id);
      if (oldVal) {
        if (oldVal.title !== trimmedTitle) changes.push(`Folder name changed to "${trimmedTitle}"`);
        if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
      }
      const updated = driveAlbums.map(item => item.id === renameItem.id ? { 
        ...item, 
        title: trimmedTitle,
        artist: trimmedArtist
      } : item);
      setDriveAlbums(updated);
      localStorage.setItem("music_drive_albums", JSON.stringify(updated));
    } else if (renameType === "randomAlbum") {
      const oldVal = randomAlbums.find(item => item.id === renameItem.id);
      if (oldVal) {
        if (oldVal.title !== trimmedTitle) changes.push(`Album name changed to "${trimmedTitle}"`);
        if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
      }
      setRandomAlbums(randomAlbums.map(item => item.id === renameItem.id ? { 
        ...item, 
        title: trimmedTitle,
        artist: trimmedArtist
      } : item));
    } else if (renameType === "spotlightTrack") {
      const oldVal = spotlightArtist.tracks.find(t => t.id === renameItem.id);
      if (oldVal) {
        if (oldVal.title !== trimmedTitle) changes.push(`Song name changed to "${trimmedTitle}"`);
        if (spotlightArtist.name !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
        if (oldVal.album !== trimmedAlbum) changes.push(`Album name changed to "${trimmedAlbum}"`);
      }
      setSpotlightArtist({
        ...spotlightArtist,
        name: trimmedArtist,
        tracks: spotlightArtist.tracks.map(t => t.id === renameItem.id ? { 
          ...t, 
          title: trimmedTitle,
          album: trimmedAlbum
        } : t)
      });
    }

    setIsRenameModalOpen(false);
    setRenameItem(null);

    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleChangeCoverClick = (item, type) => {
    setCoverItem(item);
    setCoverType(type);
    setEditImage(item.image || "");
    setIsCoverModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveCover = () => {
    if (!coverItem) return;
    const newImage = editImage.trim();

    if (coverType === "drive") {
      const updated = driveAlbums.map(item => item.id === coverItem.id ? { ...item, image: newImage } : item);
      setDriveAlbums(updated);
      localStorage.setItem("music_drive_albums", JSON.stringify(updated));
    } else if (coverType === "randomAlbum") {
      const updated = randomAlbums.map(item => item.id === coverItem.id ? { ...item, image: newImage } : item);
      setRandomAlbums(updated);
    } else if (coverType === "spotlightTrack") {
      setSpotlightArtist({
        ...spotlightArtist,
        tracks: spotlightArtist.tracks.map(t => t.id === coverItem.id ? { ...t, image: newImage } : t)
      });
    }

    // Update current playing track metadata if it matches
    const savedCurrent = localStorage.getItem("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === coverItem.title?.toLowerCase()) {
          const updatedTrack = { ...currentTrack, image: newImage };
          localStorage.setItem("music_current_track", JSON.stringify(updatedTrack));
          window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
        }
      } catch (e) {}
    }

    setIsCoverModalOpen(false);
    setCoverItem(null);
    showToast("Album cover updated.");
  };

  const handleDeleteDriveAlbum = (id) => {
    const updated = driveAlbums.filter(item => item.id !== id);
    setDriveAlbums(updated);
    localStorage.setItem("music_drive_albums", JSON.stringify(updated));
    setActiveMenuId(null);
    showToast("Folder removed.");
  };

  const handleDeleteRandomAlbum = (id) => {
    setRandomAlbums(randomAlbums.filter(item => item.id !== id));
    setActiveMenuId(null);
    showToast("Album removed.");
  };

  const handleDeleteTrack = (trackId) => {
    if (!spotlightArtist) return;
    setSpotlightArtist({
      ...spotlightArtist,
      tracks: spotlightArtist.tracks.filter(t => t.id !== trackId)
    });
    setActiveMenuId(null);
    showToast("Track deleted.");
  };

  const handleAddToPlaylist = (item, playlistName) => {
    setActiveMenuId(null);
    let allSongs = [];
    const savedSongs = localStorage.getItem("music_songs");
    if (savedSongs) {
      try { allSongs = JSON.parse(savedSongs); } catch (e) {}
    }

    let songsToAdd = [];
    if (typeof item === "string") {
      const found = allSongs.find(s => s.title.toLowerCase() === item.toLowerCase());
      if (found) songsToAdd.push(found);
    } else if (item && item.duration) {
      songsToAdd.push(item);
    } else if (item) {
      const albumTracks = allSongs.filter(s => s.album.toLowerCase() === item.title.toLowerCase());
      songsToAdd.push(...albumTracks);
    }

    if (songsToAdd.length === 0) {
      showToast(`No tracks found to add.`);
      return;
    }

    const saved = localStorage.getItem(`music_playlist_songs_${playlistName}`);
    let playlistSongs = [];
    if (saved) {
      try { playlistSongs = JSON.parse(saved); } catch (e) {}
    }

    let addedCount = 0;
    const nextSongs = [...playlistSongs];
    songsToAdd.forEach(song => {
      if (!nextSongs.some(s => s.id === song.id)) {
        nextSongs.push(song);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      showToast(`Tracks are already in "${playlistName}"`);
      return;
    }

    localStorage.setItem(`music_playlist_songs_${playlistName}`, JSON.stringify(nextSongs));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));

    if (typeof item === "object" && !item.duration) {
      showToast(`Added ${addedCount} tracks from "${item.title}" to "${playlistName}"`);
    } else {
      showToast(`Added "${songsToAdd[0].title}" to "${playlistName}"`);
    }
  };

  const handleCreatePlaylist = (item) => {
    setActiveMenuId(null);
    let preselectedSong = null;
    if (item && item.duration) {
      preselectedSong = item;
    } else if (typeof item === "string") {
      let allSongs = [];
      const savedSongs = localStorage.getItem("music_songs");
      if (savedSongs) {
        try { allSongs = JSON.parse(savedSongs); } catch (e) {}
      }
      preselectedSong = allSongs.find(s => s.title.toLowerCase() === item.toLowerCase()) || null;
    }

    window.dispatchEvent(new CustomEvent("open-create-playlist-modal", {
      detail: { song: preselectedSong }
    }));
  };

  const handleViewLocationDrive = (folder) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(folder.path);
      showToast(`Copied folder path: ${folder.path}`);
    } else {
      showToast(`Location: ${folder.path}`);
    }
  };

  const handleViewLocationAlbum = (album) => {
    setActiveMenuId(null);
    const path = `C:/Users/NIJANTH/Music/Albums/${album.artist}/${album.title}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path);
      showToast(`Copied album location: ${path}`);
    } else {
      showToast(`Location: ${path}`);
    }
  };

  const handleViewLocationTrack = (track) => {
    setActiveMenuId(null);
    const path = `C:/Users/NIJANTH/Music/Spotlight/${spotlightArtist.name}/${track.title}.mp3`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path);
      showToast(`Copied track location: ${path}`);
    } else {
      showToast(`Location: ${path}`);
    }
  };

  return (
    <div className="home-container">
      {toast && <div className="toast-banner">{toast}</div>}

      {/* 1. Drive Chronology Section */}
      <section className="home-section">
        <div className="section-header-container">
          <h2 className="section-header">Recently Added from Drive</h2>
        </div>
        <div className="card-grid">
          {driveAlbums.map((item) => (
            <div key={item.id} className="album-card" style={{ position: "relative", display: "flex", flexDirection: "column" }}>
              <span className="date-badge">{item.dateAdded}</span>
              <div className="card-image-container" style={{ marginTop: "12px" }}>
                {item.image ? (
                  <img src={item.image} alt={item.title} className="card-image" />
                ) : (
                  <div className="card-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", height: "100%" }}>
                    <Music size={48} color="#a0a0a0" />
                  </div>
                )}
                 <button 
                  className="card-play-btn"
                  onClick={() => {
                    playTrack(item);
                    showToast(`Playing folder "${item.title}"`);
                  }}
                >
                  <Play size={24} fill="currentColor" className="play-icon-nudge" />
                </button>
              </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                  <h4 className="card-title" style={{ margin: 0, flex: 1 }}>{item.title}</h4>
                  <div className="menu-wrapper" ref={activeMenuId === item.id ? activeMenuRef : null}>
                    <button
                      className="album-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#a0a0a0",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === item.id && (
                      <div 
                        className="context-menu" 
                        style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="context-menu-item" onClick={() => handleRenameClick(item, "drive")}>
                          <Edit3 size={14} />
                          Rename
                        </button>
                        <button className="context-menu-item" onClick={() => handleChangeCoverClick(item, "drive")}>
                          <Image size={14} />
                          Change Album Cover
                        </button>
                        <button className="context-menu-item" onClick={() => handleDeleteDriveAlbum(item.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button className="context-menu-item" onClick={() => handleViewLocationDrive(item)}>
                          <Clipboard size={14} />
                          View Location
                        </button>
                        <button 
                          className="context-menu-item" 
                          onClick={() => {
                            addToQueue(item);
                            setActiveMenuId(null);
                            showToast(`Added folder "${item.title}" to queue.`);
                          }}
                        >
                          <ListMusic size={14} />
                          Add to Queue
                        </button>
                        <div className="context-menu-item">
                          <FolderPlus size={14} />
                          Add to Playlist
                          <div className="context-submenu" style={{ bottom: 0, top: "auto" }}>
                            <button
                              className="context-menu-item"
                              style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                              onClick={() => handleCreatePlaylist(item.title)}
                            >
                              + Create Playlist
                            </button>
                            {playlists.map((pl, pIdx) => (
                              <button
                                key={pIdx}
                                className="context-menu-item"
                                onClick={() => handleAddToPlaylist(item.title, pl)}
                              >
                                {pl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              
              <p className="card-artist" style={{ marginTop: "4px" }}>{item.artist}</p>
              <div className="folder-path" title={item.path}>
                {item.path}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Roll the Dice Section */}
      <section className="home-section">
        <div className="section-header-container">
          <h2 className="section-header">Roll the Dice</h2>
          <button className="header-action-btn" onClick={rollTheDice}>
            <Dices size={16} />
            Roll Again
          </button>
        </div>
        <div className="card-grid">
          {randomAlbums.map((item) => (
            <div key={item.id} className="album-card" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              <div className="card-image-container">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="card-image" />
                ) : (
                  <div className="card-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", height: "100%" }}>
                    <Music size={48} color="#a0a0a0" />
                  </div>
                )}
                <button 
                  className="card-play-btn"
                  onClick={() => {
                    playTrack(item);
                    showToast(`Playing album "${item.title}"`);
                  }}
                >
                  <Play size={24} fill="currentColor" className="play-icon-nudge" />
                </button>
              </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                  <h4 className="card-title" style={{ margin: 0, flex: 1 }}>{item.title}</h4>
                  <div className="menu-wrapper" ref={activeMenuId === item.id ? activeMenuRef : null}>
                    <button
                      className="album-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#a0a0a0",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === item.id && (
                      <div 
                        className="context-menu" 
                        style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="context-menu-item" onClick={() => handleRenameClick(item, "randomAlbum")}>
                          <Edit3 size={14} />
                          Rename
                        </button>
                        <button className="context-menu-item" onClick={() => handleChangeCoverClick(item, "randomAlbum")}>
                          <Image size={14} />
                          Change Album Cover
                        </button>
                        <button className="context-menu-item" onClick={() => handleDeleteRandomAlbum(item.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button className="context-menu-item" onClick={() => handleViewLocationAlbum(item)}>
                          <Clipboard size={14} />
                          View Location
                        </button>
                        <button 
                          className="context-menu-item" 
                          onClick={() => {
                            addToQueue(item);
                            setActiveMenuId(null);
                            showToast(`Added "${item.title}" to queue.`);
                          }}
                        >
                          <ListMusic size={14} />
                          Add to Queue
                        </button>
                        <div className="context-menu-item">
                          <FolderPlus size={14} />
                          Add to Playlist
                          <div className="context-submenu" style={{ bottom: 0, top: "auto" }}>
                            <button
                              className="context-menu-item"
                              style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                              onClick={() => handleCreatePlaylist(item.title)}
                            >
                              + Create Playlist
                            </button>
                            {playlists.map((pl, pIdx) => (
                              <button
                                key={pIdx}
                                className="context-menu-item"
                                onClick={() => handleAddToPlaylist(item.title, pl)}
                              >
                                {pl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              <p className="card-artist" style={{ marginTop: "4px" }}>{item.artist}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Random Artist Spotlight */}
      {spotlightArtist && (
        <section className="home-section">
          <div className="section-header-container">
            <h2 className="section-header">Artist Spotlight</h2>
            <button className="header-action-btn" onClick={spotlightRandomArtist}>
              <Sparkles size={16} />
              Spotlight Another
            </button>
          </div>
          <div className="spotlight-container">
            <div className="spotlight-hero">
              <img src={spotlightArtist.image} alt={spotlightArtist.name} className="spotlight-avatar" />
              <div className="spotlight-info">
                <span className="spotlight-tag">Featured Artist</span>
                <h3 className="spotlight-name">{spotlightArtist.name}</h3>
                <span className="spotlight-meta">{spotlightArtist.genre} • {spotlightArtist.followers} followers</span>
              </div>
            </div>
            <div>
              <div className="spotlight-tracks-header">Popular Tracks</div>
              <table className="spotlight-table">
                <tbody>
                  {spotlightArtist.tracks.map((track) => (
                    <tr 
                      key={track.id} 
                      className="spotlight-row"
                      onClick={() => {
                        const songWithArtist = { ...track, artist: spotlightArtist.name };
                        playTrack(songWithArtist);
                        showToast(`Playing "${track.title}"`);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ width: "40px" }}>
                        <button 
                          className="spotlight-play-btn" 
                          title="Play"
                          onClick={(e) => {
                            e.stopPropagation();
                            const songWithArtist = { ...track, artist: spotlightArtist.name };
                            playTrack(songWithArtist);
                            showToast(`Playing "${track.title}"`);
                          }}
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      </td>
                      <td>
                        <span className="spotlight-track-title">{track.title}</span>
                      </td>
                      <td>
                        <span className="spotlight-track-album">{track.album}</span>
                      </td>
                      <td className="spotlight-track-duration">{track.duration}</td>
                      <td style={{ width: "30px", textAlign: "right" }}>
                        <button 
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isSongLiked(track.title) ? 1 : 0.5,
                            color: isSongLiked(track.title) ? "#6c5ce7" : "#a0a0a0",
                            transition: "all 0.2s"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong({ ...track, artist: spotlightArtist.name });
                          }}
                          title={isSongLiked(track.title) ? "Unlike" : "Like"}
                        >
                          <Heart size={14} fill={isSongLiked(track.title) ? "#6c5ce7" : "none"} />
                        </button>
                      </td>
                      <td style={{ width: "50px", textAlign: "right" }}>
                        <div className="menu-wrapper" ref={activeMenuId === `track-${track.id}` ? activeMenuRef : null}>
                          <button
                            className="spotlight-play-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === `track-${track.id}` ? null : `track-${track.id}`);
                            }}
                            style={{ padding: "4px" }}
                            title="Options"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {activeMenuId === `track-${track.id}` && (
                            <div 
                              className="context-menu" 
                              style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="context-menu-item" onClick={() => handleRenameTrackClick(track)}>
                                <Edit3 size={14} />
                                Rename
                              </button>
                              <button className="context-menu-item" onClick={() => handleChangeCoverClick(track, "spotlightTrack")}>
                                <Image size={14} />
                                Change Album Cover
                              </button>
                              <button className="context-menu-item" onClick={() => handleDeleteTrack(track.id)}>
                                <Trash2 size={14} />
                                Delete
                              </button>
                              <button className="context-menu-item" onClick={() => handleViewLocationTrack(track)}>
                                <Clipboard size={14} />
                                View Location
                              </button>
                              <button 
                                className="context-menu-item" 
                                onClick={() => {
                                  const songWithArtist = { ...track, artist: spotlightArtist.name };
                                  addToQueue(songWithArtist);
                                  setActiveMenuId(null);
                                  showToast(`Added "${track.title}" to queue.`);
                                }}
                              >
                                <ListMusic size={14} />
                                Add to Queue
                              </button>
                              <div className="context-menu-item">
                                <FolderPlus size={14} />
                                Add to Playlist
                                <div className="context-submenu" style={{ bottom: 0, top: "auto" }}>
                                  <button
                                    className="context-menu-item"
                                    style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                                    onClick={() => handleCreatePlaylist(track)}
                                  >
                                    + Create Playlist
                                  </button>
                                  {playlists.map((pl, pIdx) => (
                                    <button
                                      key={pIdx}
                                      className="context-menu-item"
                                      onClick={() => handleAddToPlaylist(track, pl)}
                                    >
                                      {pl}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* RENAME POPUP MODAL DIALOG */}
      {isRenameModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRenameModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename Details</h3>
              <button className="close-btn" onClick={() => setIsRenameModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">
                  {renameType === "drive" ? "Folder Name" : renameType === "randomAlbum" ? "Album Name" : "Song Name"}
                </label>
                <input
                  type="text"
                  className="modal-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Artist Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                />
              </div>
              {renameType === "spotlightTrack" && (
                <div className="modal-field">
                  <label className="modal-label">Album Name</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveRename}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE COVER POPUP MODAL DIALOG */}
      {isCoverModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCoverModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Album Cover</h3>
              <button className="close-btn" onClick={() => setIsCoverModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                <label className="modal-label" style={{ marginBottom: "8px" }}>Preview</label>
                {editImage ? (
                  <img 
                    src={editImage} 
                    alt="Preview" 
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <Music size={40} color="#a0a0a0" />
                  </div>
                )}
              </div>
              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Upload Local Image</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                    id="album-cover-file-input-home"
                  />
                  <label 
                    htmlFor="album-cover-file-input-home" 
                    className="modal-btn" 
                    style={{ 
                      display: "inline-block", 
                      padding: "8px 16px", 
                      backgroundColor: "rgba(255,255,255,0.08)", 
                      borderRadius: "6px", 
                      cursor: "pointer", 
                      textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.15)"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.08)"}
                  >
                    Choose File
                  </label>
                  {editImage && (
                    <button
                      type="button"
                      className="modal-btn delete-cover-btn"
                      onClick={() => setEditImage("")}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "rgba(235, 77, 75, 0.1)",
                        color: "#eb4d4b",
                        border: "1px solid rgba(235, 77, 75, 0.2)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = "rgba(235, 77, 75, 0.2)";
                        e.target.style.borderColor = "rgba(235, 77, 75, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = "rgba(235, 77, 75, 0.1)";
                        e.target.style.borderColor = "rgba(235, 77, 75, 0.2)";
                      }}
                    >
                      Delete Cover
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsCoverModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveCover}>Save Image</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
