import React, { useState, useEffect, useRef } from "react";
import { Play, Heart, MoreVertical, FolderPlus, ListMusic, X, Clock, Music, Edit3 } from "lucide-react";
import { playTrack, toggleLikeSong, isSongLiked, addToQueue } from "../utils/musicShared";
import "./Artists.css";
import "./Songs.css"; // Reuse modal and table styling

const mockArtists = [
  {
    id: 1,
    name: "The Weeknd",
    type: "Artist",
    genre: "R&B / Pop",
    followers: "78.4M",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 1001, title: "After Hours", album: "After Hours", duration: "6:01", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/After Hours.mp3" },
      { id: 1002, title: "Blinding Lights", album: "After Hours", duration: "3:20", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/Blinding Lights.mp3" },
      { id: 1003, title: "Starboy", album: "Starboy", duration: "3:50", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&q=80&w=150&h=150", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/Starboy.mp3" }
    ]
  },
  {
    id: 2,
    name: "Daft Punk",
    type: "Duo",
    genre: "Electronic / House",
    followers: "18.2M",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 1004, title: "Get Lucky", album: "Random Access Memories", duration: "6:09", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150&h=150", artist: "Daft Punk", path: "C:/Users/NIJANTH/Music/Get Lucky.mp3" },
      { id: 1005, title: "One More Time", album: "Discovery", duration: "5:20", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150", artist: "Daft Punk", path: "C:/Users/NIJANTH/Music/One More Time.mp3" },
      { id: 1006, title: "Harder, Better, Faster, Stronger", album: "Discovery", duration: "3:44", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150", artist: "Daft Punk", path: "C:/Users/NIJANTH/Music/Harder Better Faster Stronger.mp3" }
    ]
  },
  {
    id: 3,
    name: "Hans Zimmer",
    type: "Composer",
    genre: "Cinematic / Classical",
    followers: "12.5M",
    image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 1007, title: "Cornfield Chase", album: "Interstellar OST", duration: "2:06", image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=150&h=150", artist: "Hans Zimmer", path: "C:/Users/NIJANTH/Music/Cornfield Chase.mp3" },
      { id: 1008, title: "Time", album: "Inception OST", duration: "4:35", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=150&h=150", artist: "Hans Zimmer", path: "C:/Users/NIJANTH/Music/Time.mp3" },
      { id: 1009, title: "Stay", album: "Interstellar OST", duration: "6:52", image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=150&h=150", artist: "Hans Zimmer", path: "C:/Users/NIJANTH/Music/Stay.mp3" }
    ]
  },
  {
    id: 4,
    name: "Billie Eilish",
    type: "Artist",
    genre: "Alternative / Pop",
    followers: "48.9M",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250",
    tracks: [
      { id: 1010, title: "Bad Guy", album: "When We All Fall Asleep", duration: "3:14", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=150&h=150", artist: "Billie Eilish", path: "C:/Users/NIJANTH/Music/Bad Guy.mp3" },
      { id: 1011, title: "Ocean Eyes", album: "Don't Smile at Me", duration: "3:20", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=150&h=150", artist: "Billie Eilish", path: "C:/Users/NIJANTH/Music/Ocean Eyes.mp3" },
      { id: 1012, title: "Happier Than Ever", album: "Happier Than Ever", duration: "4:58", image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=150&h=150", artist: "Billie Eilish", path: "C:/Users/NIJANTH/Music/Happier Than Ever.mp3" }
    ]
  },
];

export default function Artists() {
  const [artists, setArtists] = useState(() => {
    const saved = localStorage.getItem("music_artists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem("music_artists", JSON.stringify(mockArtists));
    return mockArtists;
  });

  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistTracks, setArtistTracks] = useState([]);

  // Edit Artist Modal States
  const [isEditArtistModalOpen, setIsEditArtistModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editArtistName, setEditArtistName] = useState("");
  const [editArtistImage, setEditArtistImage] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [likedListVersion, setLikedListVersion] = useState(0);
  const [toast, setToast] = useState("");
  const activeMenuRef = useRef(null);

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

  // Listen to liked songs changed event to re-render hearts
  useEffect(() => {
    const handleLikesChange = () => {
      setLikedListVersion(prev => prev + 1);
    };
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => window.removeEventListener("likedSongsChanged", handleLikesChange);
  }, []);

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

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleArtistClick = (artist) => {
    // Reload artist data from state to catch changes
    const currentArtist = artists.find(a => a.id === artist.id) || artist;
    let librarySongs = [];
    const savedSongs = localStorage.getItem("music_songs");
    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        librarySongs = parsed.filter(s => s.artist.toLowerCase() === currentArtist.name.toLowerCase());
      } catch (e) {}
    }

    const combined = [...librarySongs];
    const presets = currentArtist.tracks || [];
    presets.forEach(preset => {
      if (!combined.some(s => s.title.toLowerCase() === preset.title.toLowerCase())) {
        combined.push(preset);
      }
    });

    setArtistTracks(combined);
    setSelectedArtist(currentArtist);
  };

  const handleEditArtistClick = (artist) => {
    setEditingArtist(artist);
    setEditArtistName(artist.name);
    setEditArtistImage(artist.image || "");
    setIsEditArtistModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveArtist = () => {
    if (!editingArtist || !editArtistName.trim()) return;
    const trimmedName = editArtistName.trim();
    const newImage = editArtistImage.trim();

    const updated = artists.map(art => art.id === editingArtist.id ? {
      ...art,
      name: trimmedName,
      image: newImage
    } : art);

    setArtists(updated);
    localStorage.setItem("music_artists", JSON.stringify(updated));

    // Also update any reference inside other tracks if their artist matches old name!
    const savedSongs = localStorage.getItem("music_songs");
    if (savedSongs) {
      try {
        const parsedSongs = JSON.parse(savedSongs);
        const updatedSongs = parsedSongs.map(s => s.artist.toLowerCase() === editingArtist.name.toLowerCase() ? {
          ...s,
          artist: trimmedName
        } : s);
        localStorage.setItem("music_songs", JSON.stringify(updatedSongs));
        window.dispatchEvent(new CustomEvent("songsChanged"));
        window.dispatchEvent(new CustomEvent("likedSongsChanged"));
      } catch (e) {}
    }

    if (selectedArtist && selectedArtist.id === editingArtist.id) {
      setSelectedArtist({
        ...selectedArtist,
        name: trimmedName,
        image: newImage
      });
    }

    setIsEditArtistModalOpen(false);
    setEditingArtist(null);
    showToast("Artist updated successfully.");
  };

  const handleAddToPlaylist = (song, playlistName) => {
    setActiveMenuId(null);
    const saved = localStorage.getItem(`music_playlist_songs_${playlistName}`);
    let playlistSongs = [];
    if (saved) {
      try {
        playlistSongs = JSON.parse(saved);
      } catch (e) {}
    }

    if (playlistSongs.some(s => s.id === song.id)) {
      showToast(`"${song.title}" is already in "${playlistName}"`);
      return;
    }

    const updated = [...playlistSongs, song];
    localStorage.setItem(`music_playlist_songs_${playlistName}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
    showToast(`Added "${song.title}" to "${playlistName}"`);
  };

  const handleCreatePlaylist = (song) => {
    setActiveMenuId(null);
    window.dispatchEvent(new CustomEvent("open-create-playlist-modal", {
      detail: { song }
    }));
  };

  return (
    <div className="home-container">
      {toast && <div className="toast-banner">{toast}</div>}

      <section className="home-section">
        <h2 className="section-header">Artists</h2>
        <div className="artists-grid">
          {artists.map((artist) => (
            <div 
              key={artist.id} 
              className="artist-card"
              onClick={() => handleArtistClick(artist)}
              title={`View ${artist.name}`}
              style={{ position: "relative" }}
            >
              <div className="artist-avatar-container">
                {artist.image ? (
                  <img src={artist.image} alt={artist.name} className="artist-avatar" />
                ) : (
                  <div className="artist-avatar-fallback">
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center", position: "relative" }}>
                <h4 className="artist-name" style={{ margin: 0, paddingRight: "20px" }}>{artist.name}</h4>
                <div 
                  className="menu-wrapper" 
                  ref={activeMenuId === artist.id ? activeMenuRef : null} 
                  style={{ position: "absolute", right: 0 }}
                >
                  <button
                    className="album-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === artist.id ? null : artist.id);
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
                    <MoreVertical size={14} />
                  </button>
                  {activeMenuId === artist.id && (
                    <div 
                      className="context-menu" 
                      style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="context-menu-item" onClick={() => handleEditArtistClick(artist)}>
                        <Edit3 size={14} style={{ marginRight: 6 }} />
                        Edit Artist
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="artist-type" style={{ marginTop: "4px" }}>{artist.type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARTIST DETAILED TRACK VIEW MODAL OVERLAY */}
      {selectedArtist && (
        <div className="modal-backdrop" onClick={() => setSelectedArtist(null)}>
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
                onClick={() => setSelectedArtist(null)} 
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
              
              {selectedArtist.image ? (
                <img 
                  src={selectedArtist.image} 
                  alt={selectedArtist.name} 
                  style={{ width: "110px", height: "110px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} 
                />
              ) : (
                <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", fontSize: "36px", fontWeight: "bold", color: "#6c5ce7" }}>
                  {selectedArtist.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#a0a0a0" }}>{selectedArtist.type}</span>
                <h1 style={{ fontSize: "36px", margin: "4px 0", fontWeight: "800", color: "#fff" }}>{selectedArtist.name}</h1>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                  {selectedArtist.genre} • {selectedArtist.followers} Followers
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable Songs Table */}
            <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#fff" }}>Popular Tracks</h3>
              
              {artistTracks.length === 0 ? (
                <div style={{ color: "#a0a0a0", textAlign: "center", padding: "40px" }}>
                  No tracks found for this artist.
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
                    {artistTracks.map((song, idx) => (
                      <tr 
                        key={song.id} 
                        className="song-row"
                        onClick={() => {
                          playTrack(song);
                          showToast(`Playing "${song.title}"`);
                        }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <td className="song-index" style={{ color: "#a0a0a0" }}>{idx + 1}</td>
                        <td>
                          <div className="song-info-col">
                            <img src={song.image} alt={song.title} className="song-thumbnail" />
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
                            
                            <div className="menu-wrapper" ref={activeMenuId === song.id ? activeMenuRef : null}>
                              <button
                                className="row-action-btn"
                                title="Options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === song.id ? null : song.id);
                                }}
                                style={{
                                  opacity: activeMenuId === song.id ? 1 : undefined,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#a0a0a0"
                                }}
                              >
                                <MoreVertical size={15} />
                              </button>
                              
                              {activeMenuId === song.id && (
                                <div className="context-menu" style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    className="context-menu-item"
                                    onClick={() => {
                                      addToQueue(song);
                                      setActiveMenuId(null);
                                      showToast(`Added "${song.title}" to queue.`);
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
                                        onClick={() => handleCreatePlaylist(song)}
                                      >
                                        + Create Playlist
                                      </button>
                                      {playlists.map((pl, pIdx) => (
                                        <button
                                          key={pIdx}
                                          className="context-menu-item"
                                          onClick={() => handleAddToPlaylist(song, pl)}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer" style={{ padding: "14px 20px" }}>
              <button className="modal-btn cancel" onClick={() => setSelectedArtist(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
            
      {/* EDIT ARTIST MODAL */}
      {isEditArtistModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditArtistModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Artist Details</h3>
              <button className="close-btn" onClick={() => setIsEditArtistModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                <label className="modal-label" style={{ marginBottom: "8px" }}>Preview</label>
                {editArtistImage ? (
                  <img 
                    src={editArtistImage} 
                    alt="Preview" 
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <Music size={40} color="#a0a0a0" />
                  </div>
                )}
              </div>
              <div className="modal-field">
                <label className="modal-label">Artist Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={editArtistName}
                  onChange={(e) => setEditArtistName(e.target.value)}
                  placeholder="Artist Name"
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Upload Profile Picture</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditArtistImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                    id="artist-profile-pic-input"
                  />
                  <label 
                    htmlFor="artist-profile-pic-input" 
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
                  {editArtistImage && (
                    <button
                      type="button"
                      className="modal-btn delete-cover-btn"
                      onClick={() => setEditArtistImage("")}
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
                      Delete Picture
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsEditArtistModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveArtist} disabled={!editArtistName.trim()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
