import React, { useState, useEffect, useRef } from "react";
import { Play, ListMusic, MoreVertical, Edit3, Trash2, Clipboard, Check, X, Plus, Heart, Clock, Music, FolderPlus, Image } from "lucide-react";
import "./Home.css"; // Reuse card-grid, album-card styles
import "./Songs.css"; // Reuse toast-banner, context menus, and modal styles
import { playTrack, toggleLikeSong, isSongLiked, addToQueue, syncSongUpdateInPlaylists, syncSongDeleteInPlaylists } from "../utils/musicShared";
import { readDataSync, writeDataSync, removeDataSync } from '../utils/tauribridge';
import ImageWithFallback from "../components/ImageWithFallback";

const defaultImages = [
  "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=250&h=250",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250&h=250",
  "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=250&h=250",
];

const mockSongs = [];

export default function Playlists() {
  const [playlistNames, setPlaylistNames] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  
  // Detail Modal States
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [likedListVersion, setLikedListVersion] = useState(0);

  const [toast, setToast] = useState("");
  const activeMenuRef = useRef(null);

  // Song Options Menu & Modal States
  const [activeSongMenuId, setActiveSongMenuId] = useState(null);
  const activeSongMenuRef = useRef(null);

  const [isSongRenameOpen, setIsSongRenameOpen] = useState(false);
  const [songRenameItem, setSongRenameItem] = useState(null);
  const [songEditTitle, setSongEditTitle] = useState("");
  const [songEditArtist, setSongEditArtist] = useState("");
  const [songEditAlbum, setSongEditAlbum] = useState("");

  const [isSongCoverOpen, setIsSongCoverOpen] = useState(false);
  const [songCoverItem, setSongCoverItem] = useState(null);
  const [songEditImage, setSongEditImage] = useState("");

  // Load playlists from localStorage
  const loadPlaylists = () => {
    const saved = readDataSync("music_playlists");
    let names = [];
    if (saved) {
      try {
        names = JSON.parse(saved);
      } catch (e) {
        names = [];
      }
    } else {
      names = [];
      writeDataSync("music_playlists", JSON.stringify(names));
    }
    setPlaylistNames(names);

    // Map string names to full playlist items with mock or real metadata
    const mapped = names.map((name, idx) => {
      const songsKey = `music_playlist_songs_${name}`;
      let savedSongs = readDataSync(songsKey);

      // Pre-populate default playlists if they do not exist
      if (!savedSongs) {
        let defaultSongsList = [];
        writeDataSync(songsKey, JSON.stringify(defaultSongsList));
        savedSongs = JSON.stringify(defaultSongsList);
      }

      const customCover = readDataSync(`music_playlist_cover_${name}`);
      let count = 0;
      if (savedSongs) {
        try {
          count = JSON.parse(savedSongs).length;
        } catch (e) {}
      }
      return {
        id: idx + 1,
        title: name,
        songsCount: count,
        image: customCover || defaultImages[idx % defaultImages.length],
        path: `C:/Users/NIJANTH/Music/Playlists/${name.replace(/\s+/g, "_")}`
      };
    });
    setPlaylists(mapped);
  };

  const calculateTotalDuration = (tracks) => {
    let totalSeconds = 0;
    tracks.forEach(track => {
      const parts = (track.duration || "3:00").split(":");
      if (parts.length === 2) {
        totalSeconds += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else if (parts.length === 1) {
        totalSeconds += parseInt(parts[0], 10);
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min ${seconds} sec`;
  };

  useEffect(() => {
    loadPlaylists();
    const handlePlaylistsChange = () => {
      loadPlaylists();
    };
    window.addEventListener("playlistsChanged", handlePlaylistsChange);
    return () => window.removeEventListener("playlistsChanged", handlePlaylistsChange);
  }, []);

  // Sync back to localStorage when playlistNames change
  const savePlaylists = (updatedNames) => {
    writeDataSync("music_playlists", JSON.stringify(updatedNames));
    loadPlaylists();
  };

  const handlePlaylistClick = (playlist) => {
    const savedSongs = readDataSync(`music_playlist_songs_${playlist.title}`);
    let songsList = [];
    if (savedSongs) {
      try {
        songsList = JSON.parse(savedSongs);
      } catch (e) {}
    }
    setPlaylistTracks(songsList);
    setSelectedPlaylist(playlist);
  };

  const handleRemoveSong = (songId) => {
    if (!selectedPlaylist) return;
    const updatedTracks = playlistTracks.filter(track => track.id !== songId);
    setPlaylistTracks(updatedTracks);
    writeDataSync(`music_playlist_songs_${selectedPlaylist.title}`, JSON.stringify(updatedTracks));
    
    // Dispatch playlistsChanged event to trigger count reloads in cards
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
    showToast("Song removed from playlist.");
  };

  // Listen to liked songs changed event to re-render hearts
  useEffect(() => {
    const handleLikesChange = () => {
      setLikedListVersion(prev => prev + 1);
    };
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => window.removeEventListener("likedSongsChanged", handleLikesChange);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeMenuRef.current && !activeMenuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (activeSongMenuRef.current && !activeSongMenuRef.current.contains(event.target)) {
        setActiveSongMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (pl) => {
    setRenameItem(pl);
    setEditTitle(pl.title);
    const customCover = readDataSync(`music_playlist_cover_${pl.title}`);
    setEditImage(customCover || "");
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const oldName = renameItem.title;
    
    if (playlistNames.includes(trimmedTitle) && trimmedTitle !== oldName) {
      showToast("Playlist already exists!");
      return;
    }

    let changes = [];
    if (oldName !== trimmedTitle) {
      changes.push(`Playlist name changed to "${trimmedTitle}"`);
      
      // Migrate songs list key
      const songs = readDataSync(`music_playlist_songs_${oldName}`);
      if (songs) {
        writeDataSync(`music_playlist_songs_${trimmedTitle}`, songs);
        removeDataSync(`music_playlist_songs_${oldName}`);
      }

      // Migrate cover art key
      const cover = readDataSync(`music_playlist_cover_${oldName}`);
      if (cover) {
        writeDataSync(`music_playlist_cover_${trimmedTitle}`, cover);
        removeDataSync(`music_playlist_cover_${oldName}`);
      }
    }

    // Save cover modifications
    const currentCover = readDataSync(`music_playlist_cover_${trimmedTitle}`);
    if (editImage !== (currentCover || "")) {
      if (editImage) {
        writeDataSync(`music_playlist_cover_${trimmedTitle}`, editImage);
        changes.push("Playlist cover updated");
      } else {
        removeDataSync(`music_playlist_cover_${trimmedTitle}`);
        changes.push("Playlist cover removed");
      }
    }

    const updatedNames = playlistNames.map(name => name === oldName ? trimmedTitle : name);
    savePlaylists(updatedNames);
    
    setIsRenameModalOpen(false);
    setRenameItem(null);
    setEditImage("");
    
    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleDeletePlaylist = (id) => {
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;

    const updatedNames = playlistNames.filter(name => name !== pl.title);
    savePlaylists(updatedNames);
    
    // Clean up associated storage keys
    removeDataSync(`music_playlist_songs_${pl.title}`);
    removeDataSync(`music_playlist_cover_${pl.title}`);
    
    setActiveMenuId(null);
    showToast("Playlist deleted.");
  };

  const handleViewLocation = (pl) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pl.path);
      showToast(`Copied location: ${pl.path}`);
    } else {
      showToast(`Location: ${pl.path}`);
    }
  };

  const handleSongRenameClick = (song) => {
    setSongRenameItem(song);
    setSongEditTitle(song.title);
    setSongEditArtist(song.artist);
    setSongEditAlbum(song.album);
    setIsSongRenameOpen(true);
    setActiveSongMenuId(null);
  };

  const handleSaveSongRename = () => {
    if (!songRenameItem || !songEditTitle.trim()) return;
    const trimmedTitle = songEditTitle.trim();
    const trimmedArtist = songEditArtist.trim();
    const trimmedAlbum = songEditAlbum.trim();

    let changes = [];
    if (songRenameItem.title !== trimmedTitle) changes.push(`Song name changed to "${trimmedTitle}"`);
    if (songRenameItem.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
    if (songRenameItem.album !== trimmedAlbum) changes.push(`Album name changed to "${trimmedAlbum}"`);

    // 1. Update in library (music_songs)
    let librarySongs = [];
    const savedSongs = readDataSync("music_songs");
    if (savedSongs) {
      try { librarySongs = JSON.parse(savedSongs); } catch (e) {}
    }
    const updatedSongs = librarySongs.map(s => s.id === songRenameItem.id ? {
      ...s,
      title: trimmedTitle,
      artist: trimmedArtist,
      album: trimmedAlbum
    } : s);
    writeDataSync("music_songs", JSON.stringify(updatedSongs));
    
    // 2. Dispatch events so other pages sync
    window.dispatchEvent(new CustomEvent("songsChanged"));

    // 3. Sync changes to all playlists
    const updatedSong = updatedSongs.find(s => s.id === songRenameItem.id) || {
      ...songRenameItem,
      title: trimmedTitle,
      artist: trimmedArtist,
      album: trimmedAlbum
    };
    syncSongUpdateInPlaylists(updatedSong);

    // 4. Sync current playing track
    const savedCurrent = readDataSync("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === songRenameItem.title.toLowerCase()) {
          const updatedTrack = { ...currentTrack, title: trimmedTitle, artist: trimmedArtist, album: trimmedAlbum };
          writeDataSync("music_current_track", JSON.stringify(updatedTrack));
          window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
        }
      } catch (e) {}
    }

    // 5. Sync liked songs list
    const savedLiked = readDataSync("music_liked_songs");
    if (savedLiked) {
      try {
        const likedList = JSON.parse(savedLiked);
        const updatedLiked = likedList.map(song => song.title.toLowerCase() === songRenameItem.title.toLowerCase() ? {
          ...song,
          title: trimmedTitle,
          artist: trimmedArtist,
          album: trimmedAlbum
        } : song);
        writeDataSync("music_liked_songs", JSON.stringify(updatedLiked));
        window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
      } catch (e) {}
    }

    // 6. Reload current playlist track list to reflect rename immediately
    if (selectedPlaylist) {
      const savedPlaylistSongs = readDataSync(`music_playlist_songs_${selectedPlaylist.title}`);
      if (savedPlaylistSongs) {
        try {
          setPlaylistTracks(JSON.parse(savedPlaylistSongs));
        } catch (e) {}
      }
    }

    setIsSongRenameOpen(false);
    setSongRenameItem(null);
    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleSongCoverClick = (song) => {
    setSongCoverItem(song);
    setSongEditImage(song.image || "");
    setIsSongCoverOpen(true);
    setActiveSongMenuId(null);
  };

  const handleSaveSongCover = () => {
    if (!songCoverItem) return;
    const newImage = songEditImage.trim();

    // 1. Update in library (music_songs)
    let librarySongs = [];
    const savedSongs = readDataSync("music_songs");
    if (savedSongs) {
      try { librarySongs = JSON.parse(savedSongs); } catch (e) {}
    }
    const updatedSongs = librarySongs.map(s => s.id === songCoverItem.id ? {
      ...s,
      image: newImage,
      isCustomImage: true
    } : s);
    writeDataSync("music_songs", JSON.stringify(updatedSongs));
    window.dispatchEvent(new CustomEvent("songsChanged"));

    // 2. Sync to other playlists
    const updatedSong = updatedSongs.find(s => s.id === songCoverItem.id) || {
      ...songCoverItem,
      image: newImage,
      isCustomImage: true
    };
    syncSongUpdateInPlaylists(updatedSong);

    // 3. Update parent album cover
    if (songCoverItem.album) {
      let allAlbums = [];
      const savedAlbums = readDataSync("music_albums");
      if (savedAlbums) {
        try {
          allAlbums = JSON.parse(savedAlbums);
          const updatedAlbums = allAlbums.map(album => {
            if (album.title.toLowerCase() === songCoverItem.album.toLowerCase()) {
              return { ...album, image: newImage, isCustomImage: true };
            }
            return album;
          });
          writeDataSync("music_albums", JSON.stringify(updatedAlbums));
          window.dispatchEvent(new CustomEvent("albumsChanged"));
        } catch (e) {}
      }
    }

    // 4. Update current playing track
    const savedCurrent = readDataSync("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === songCoverItem.title.toLowerCase()) {
          const updatedTrack = { ...currentTrack, image: newImage, isCustomImage: true };
          writeDataSync("music_current_track", JSON.stringify(updatedTrack));
          window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
        }
      } catch (e) {}
    }

    // 5. Update liked songs list
    const savedLiked = readDataSync("music_liked_songs");
    if (savedLiked) {
      try {
        const likedList = JSON.parse(savedLiked);
        const updatedLiked = likedList.map(song => song.title.toLowerCase() === songCoverItem.title.toLowerCase() ? {
          ...song,
          image: newImage,
          isCustomImage: true
        } : song);
        writeDataSync("music_liked_songs", JSON.stringify(updatedLiked));
        window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
      } catch (e) {}
    }

    // 6. Reload current playlist track list
    if (selectedPlaylist) {
      const savedPlaylistSongs = readDataSync(`music_playlist_songs_${selectedPlaylist.title}`);
      if (savedPlaylistSongs) {
        try {
          setPlaylistTracks(JSON.parse(savedPlaylistSongs));
        } catch (e) {}
      }
    }

    setIsSongCoverOpen(false);
    setSongCoverItem(null);
    showToast("Song cover art updated.");
  };

  const handleDeleteSongFromLibrary = (song) => {
    if (!window.confirm(`Are you sure you want to delete "${song.title}" from your library entirely? This will also remove it from all playlists.`)) {
      return;
    }
    
    // 1. Remove from library (music_songs)
    let librarySongs = [];
    const savedSongs = readDataSync("music_songs");
    if (savedSongs) {
      try { librarySongs = JSON.parse(savedSongs); } catch (e) {}
    }
    const updatedSongs = librarySongs.filter(s => s.id !== song.id);
    writeDataSync("music_songs", JSON.stringify(updatedSongs));
    window.dispatchEvent(new CustomEvent("songsChanged"));

    // 2. Remove from all playlists
    syncSongDeleteInPlaylists(song.id);

    // 3. Reload current playlist track list
    if (selectedPlaylist) {
      const savedPlaylistSongs = readDataSync(`music_playlist_songs_${selectedPlaylist.title}`);
      if (savedPlaylistSongs) {
        try {
          setPlaylistTracks(JSON.parse(savedPlaylistSongs));
        } catch (e) {}
      }
    }

    setActiveSongMenuId(null);
    showToast(`"${song.title}" deleted from library.`);
  };

  const handleViewLocationSong = (song) => {
    setActiveSongMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(song.path);
      showToast(`Copied location: ${song.path}`);
    } else {
      showToast(`Location: ${song.path}`);
    }
  };

  const handleAddToOtherPlaylist = (song, targetPlaylistName) => {
    setActiveSongMenuId(null);
    const saved = readDataSync(`music_playlist_songs_${targetPlaylistName}`);
    let playlistSongs = [];
    if (saved) {
      try { playlistSongs = JSON.parse(saved); } catch (e) {}
    }

    if (playlistSongs.some(s => s.id === song.id)) {
      showToast(`"${song.title}" is already in "${targetPlaylistName}"`);
      return;
    }

    const updated = [...playlistSongs, song];
    writeDataSync(`music_playlist_songs_${targetPlaylistName}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
    showToast(`Added "${song.title}" to "${targetPlaylistName}"`);
  };

  const handleCreatePlaylistBtn = () => {
    window.dispatchEvent(new CustomEvent("open-create-playlist-modal"));
  };

  return (
    <div className="home-container">
      {toast && <div className="toast-banner">{toast}</div>}
      
      <section className="home-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className="section-header" style={{ margin: 0 }}>Your Playlists</h2>
          <button 
            className="create-playlist-header-btn"
            onClick={handleCreatePlaylistBtn}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#6c5ce7",
              color: "white",
              border: "none",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Plus size={16} />
            Create Playlist
          </button>
        </div>

        <div className="card-grid">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id} 
              className="album-card" 
              onClick={() => handlePlaylistClick(playlist)}
              style={{ display: "flex", flexDirection: "column", position: "relative", cursor: "pointer" }}
            >
              <div className="card-image-container">
                <ImageWithFallback src={playlist.image} alt={playlist.title} className="card-image" />
                <button 
                  className="card-play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const savedSongs = readDataSync(`music_playlist_songs_${playlist.title}`);
                    if (savedSongs) {
                      try {
                        const tracks = JSON.parse(savedSongs);
                        if (tracks.length > 0) {
                          playTrack(tracks[0], tracks);
                          showToast(`Playing playlist "${playlist.title}"`);
                        } else {
                          showToast("Playlist is empty");
                        }
                      } catch (err) {}
                    } else {
                      showToast("Playlist is empty");
                    }
                  }}
                >
                  <Play size={24} fill="currentColor" className="play-icon-nudge" />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                <h4 className="card-title" style={{ margin: 0, flex: 1 }}>{playlist.title}</h4>
                
                <div className="menu-wrapper" ref={activeMenuId === playlist.id ? activeMenuRef : null}>
                  <button
                    className="album-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === playlist.id ? null : playlist.id);
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
                  {activeMenuId === playlist.id && (
                    <div 
                      className="context-menu" 
                      style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="context-menu-item" onClick={() => handleRenameClick(playlist)}>
                        <Edit3 size={14} />
                        Rename
                      </button>
                      <button className="context-menu-item" onClick={() => handleDeletePlaylist(playlist.id)}>
                        <Trash2 size={14} />
                        Delete
                      </button>
                      <button className="context-menu-item" onClick={() => handleViewLocation(playlist)}>
                        <Clipboard size={14} />
                        View Location
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="card-artist" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <ListMusic size={14} />
                {playlist.songsCount} songs
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* EDIT PLAYLIST DETAILS POPUP MODAL DIALOG */}
      {isRenameModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRenameModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Playlist Details</h3>
              <button className="close-btn" onClick={() => setIsRenameModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                <label className="modal-label" style={{ marginBottom: "8px" }}>Playlist Cover Preview</label>
                {editImage ? (
                  <img 
                    src={editImage} 
                    alt="Playlist Cover" 
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Music size={40} color="#a0a0a0" />
                  </div>
                )}
              </div>

              <div className="modal-field">
                <label className="modal-label">Playlist Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Playlist Name"
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Upload Custom Cover</label>
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
                    id="playlist-cover-pic-input"
                  />
                  <label 
                    htmlFor="playlist-cover-pic-input" 
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
              <button className="modal-btn cancel" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveRename} disabled={!editTitle.trim()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SONG DETAILS POPUP MODAL DIALOG */}
      {isSongRenameOpen && (
        <div className="modal-backdrop" onClick={() => setIsSongRenameOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Song Details</h3>
              <button className="close-btn" onClick={() => setIsSongRenameOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Title</label>
                <input
                  type="text"
                  className="modal-input"
                  value={songEditTitle}
                  onChange={(e) => setSongEditTitle(e.target.value)}
                  placeholder="Song Title"
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Artist</label>
                <input
                  type="text"
                  className="modal-input"
                  value={songEditArtist}
                  onChange={(e) => setSongEditArtist(e.target.value)}
                  placeholder="Artist"
                  maxLength={50}
                />
              </div>
              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Album</label>
                <input
                  type="text"
                  className="modal-input"
                  value={songEditAlbum}
                  onChange={(e) => setSongEditAlbum(e.target.value)}
                  placeholder="Album"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsSongRenameOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveSongRename} disabled={!songEditTitle.trim()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SONG COVER POPUP MODAL DIALOG */}
      {isSongCoverOpen && (
        <div className="modal-backdrop" onClick={() => setIsSongCoverOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Song Cover Art</h3>
              <button className="close-btn" onClick={() => setIsSongCoverOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                <label className="modal-label" style={{ marginBottom: "8px" }}>Cover Art Preview</label>
                {songEditImage ? (
                  <img 
                    src={songEditImage} 
                    alt="Song Cover Preview" 
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Music size={40} color="#a0a0a0" />
                  </div>
                )}
              </div>

              <div className="modal-field">
                <label className="modal-label">Upload Custom Cover</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSongEditImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                    id="song-cover-pic-input"
                  />
                  <label 
                    htmlFor="song-cover-pic-input" 
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
                  {songEditImage && (
                    <button
                      type="button"
                      className="modal-btn delete-cover-btn"
                      onClick={() => setSongEditImage("")}
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
              <button className="modal-btn cancel" onClick={() => setIsSongCoverOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveSongCover}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYLIST DETAIL POPUP MODAL OVERLAY */}
      {selectedPlaylist && (
        <div className="modal-backdrop" onClick={() => setSelectedPlaylist(null)}>
          <div 
            className="modal-content artist-detail-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: "680px", maxWidth: "95%", height: "80vh", display: "flex", flexDirection: "column" }}
          >
            {/* Header section with cover banner details */}
            <div 
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "24px",
                background: `linear-gradient(transparent, rgba(0,0,0,0.85)), linear-gradient(135deg, #6c5ce7 0%, #2a2a2a 100%)`,
                padding: "40px 24px 20px 24px",
                position: "relative"
              }}
            >
              <button 
                className="close-btn" 
                onClick={() => setSelectedPlaylist(null)} 
                style={{ 
                  position: "absolute", 
                  top: "16px", 
                  right: "16px", 
                  background: "rgba(0,0,0,0.3)", 
                  border: "none", 
                  color: "#ffffff", 
                  cursor: "pointer",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
              
              <ImageWithFallback 
                src={selectedPlaylist.image} 
                alt={selectedPlaylist.title} 
                style={{ width: "110px", height: "110px", borderRadius: "8px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} 
              />
              <div>
                <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#a0a0a0" }}>Playlist</span>
                <h1 style={{ fontSize: "36px", margin: "4px 0", fontWeight: "800", color: "#fff" }}>{selectedPlaylist.title}</h1>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                  {playlistTracks.length} Songs • {calculateTotalDuration(playlistTracks)}
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable Songs Table */}
            <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {playlistTracks.length === 0 ? (
                <div style={{ color: "#a0a0a0", textAlign: "center", padding: "40px" }}>
                  No tracks inside this playlist. Use context menus on songs to add them.
                </div>
              ) : (
                <table className="songs-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th className="song-index" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>#</th>
                      <th style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>Title</th>
                      <th style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>Album</th>
                      <th style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0", width: "80px" }}>
                        <Clock size={15} style={{ display: "inline-block", verticalAlign: "middle" }} />
                      </th>
                      <th className="song-actions-col" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", width: "100px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {playlistTracks.map((song, idx) => (
                      <tr 
                        key={song.id} 
                        className="song-row"
                        onClick={() => {
                          playTrack(song, playlistTracks);
                          showToast(`Playing "${song.title}"`);
                        }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <td className="song-index" style={{ color: "#a0a0a0" }}>{idx + 1}</td>
                        <td>
                          <div className="song-info-col">
                            <ImageWithFallback src={song.image} alt={song.title} className="song-thumbnail" size={16} />
                            <div className="song-details">
                              <span className="song-name" style={{ color: "#fff", fontWeight: "600" }}>{song.title}</span>
                              <span className="song-artist" style={{ color: "#a0a0a0", fontSize: "12px" }}>{song.artist}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="song-album-col" style={{ color: "#a0a0a0" }}>{song.album}</span>
                        </td>
                        <td>
                          <span className="song-duration-col" style={{ color: "#a0a0a0" }}>{song.duration}</span>
                        </td>
                        <td className="song-actions-col" onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                            <button 
                              className="row-action-btn" 
                              title={isSongLiked(song.title) ? "Unlike" : "Like"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeSong(song);
                              }}
                              style={{
                                opacity: isSongLiked(song.title) ? 1 : undefined,
                                color: isSongLiked(song.title) ? "#6c5ce7" : undefined,
                                background: "none",
                                border: "none",
                                cursor: "pointer"
                              }}
                            >
                              <Heart size={15} fill={isSongLiked(song.title) ? "#6c5ce7" : "none"} />
                            </button>
                            
                            <div className="menu-wrapper" ref={activeSongMenuId === song.id ? activeSongMenuRef : null}>
                              <button 
                                className="row-action-btn" 
                                title="Options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSongMenuId(activeSongMenuId === song.id ? null : song.id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  transition: "background-color 0.2s",
                                  opacity: activeSongMenuId === song.id ? 1 : undefined
                                }}
                              >
                                <MoreVertical size={15} />
                              </button>
                              {activeSongMenuId === song.id && (
                                <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                                  <button className="context-menu-item" onClick={() => handleSongRenameClick(song)}>
                                    <Edit3 size={14} />
                                    Rename
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleSongCoverClick(song)}>
                                    <Image size={14} />
                                    Change Album Cover
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleRemoveSong(song.id)}>
                                    <Trash2 size={14} style={{ color: "#eb4d4b" }} />
                                    Remove from Playlist
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleDeleteSongFromLibrary(song)}>
                                    <Trash2 size={14} style={{ color: "#eb4d4b" }} />
                                    Delete from Library
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleViewLocationSong(song)}>
                                    <Clipboard size={14} />
                                    View Location
                                  </button>
                                  <button 
                                    className="context-menu-item" 
                                    onClick={() => {
                                      addToQueue(song);
                                      setActiveSongMenuId(null);
                                      showToast(`Added "${song.title}" to queue.`);
                                    }}
                                  >
                                    <ListMusic size={14} />
                                    Add to Queue
                                  </button>
                                  <div className="context-menu-item">
                                    <FolderPlus size={14} />
                                    Add to Playlist
                                    <div className="context-submenu">
                                      {playlistNames.filter(name => name !== selectedPlaylist.title).map((name, pIdx) => (
                                        <button
                                          key={pIdx}
                                          className="context-menu-item"
                                          onClick={() => handleAddToOtherPlaylist(song, name)}
                                        >
                                          {name}
                                        </button>
                                      ))}
                                      {playlistNames.filter(name => name !== selectedPlaylist.title).length === 0 && (
                                        <div className="context-menu-item" style={{ color: "#a0a0a0", fontSize: "12px", fontStyle: "italic", cursor: "default" }}>
                                          No other playlists
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer" style={{ padding: "14px 20px" }}>
              <button className="modal-btn cancel" onClick={() => setSelectedPlaylist(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
