import React, { useState, useEffect, useRef } from "react";
import { Play, MoreVertical, Edit3, Trash2, FolderPlus, Check, X, Clipboard, ListMusic, Image, Music } from "lucide-react";
import "./Home.css";
import "./Songs.css"; // Reuse context menu styles
import { addToQueue, playTrack } from "../utils/musicShared";

const defaultMockAlbums = [
  {
    id: 1,
    title: "After Hours",
    artist: "The Weeknd",
    year: "2020",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250&h=250",
    path: "C:/Users/NIJANTH/Music/The Weeknd/After Hours"
  },
  {
    id: 2,
    title: "Random Access Memories",
    artist: "Daft Punk",
    year: "2013",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250&h=250",
    path: "D:/Media/Music/Daft Punk/Random Access Memories"
  },
  {
    id: 3,
    title: "Interstellar OST",
    artist: "Hans Zimmer",
    year: "2014",
    image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=250&h=250",
    path: "E:/Audio/Soundtracks/Interstellar OST"
  },
  {
    id: 4,
    title: "When We All Fall Asleep",
    artist: "Billie Eilish",
    year: "2019",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=250&h=250",
    path: "C:/Users/NIJANTH/Music/Billie Eilish/When We All Fall Asleep"
  },
];

export default function Albums() {
  const [albums, setAlbums] = useState(() => {
    const saved = localStorage.getItem("music_albums");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultMockAlbums;
  });
  const [playlists, setPlaylists] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  // Cover Modal States
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverItem, setCoverItem] = useState(null);
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

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (album) => {
    setRenameItem(album);
    setEditTitle(album.title);
    setEditArtist(album.artist);
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();

    let changes = [];
    const oldVal = albums.find(al => al.id === renameItem.id);
    if (oldVal) {
      if (oldVal.title !== trimmedTitle) changes.push(`Album name changed to "${trimmedTitle}"`);
      if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
    }

    const updatedAlbums = albums.map(album => album.id === renameItem.id ? { 
      ...album, 
      title: trimmedTitle,
      artist: trimmedArtist
    } : album);

    setAlbums(updatedAlbums);
    localStorage.setItem("music_albums", JSON.stringify(updatedAlbums));

    // Update current playing track metadata if it happens to be in this album
    const savedCurrent = localStorage.getItem("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.album && currentTrack.album.toLowerCase() === renameItem.title.toLowerCase()) {
          const updatedTrack = { 
            ...currentTrack, 
            album: trimmedTitle,
            artist: trimmedArtist
          };
          localStorage.setItem("music_current_track", JSON.stringify(updatedTrack));
          window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
        }
      } catch (e) {}
    }

    setIsRenameModalOpen(false);
    setRenameItem(null);

    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleChangeCoverClick = (album) => {
    setCoverItem(album);
    setEditImage(album.image || "");
    setIsCoverModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveCover = () => {
    if (!coverItem) return;
    const newImage = editImage.trim();

    const updatedAlbums = albums.map(album => album.id === coverItem.id ? { 
      ...album, 
      image: newImage
    } : album);

    setAlbums(updatedAlbums);
    localStorage.setItem("music_albums", JSON.stringify(updatedAlbums));

    // Also update current playing track metadata if it belongs to this album
    const savedCurrent = localStorage.getItem("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.album && currentTrack.album.toLowerCase() === coverItem.title.toLowerCase()) {
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

  const handleDeleteAlbum = (id) => {
    const updatedAlbums = albums.filter(album => album.id !== id);
    setAlbums(updatedAlbums);
    localStorage.setItem("music_albums", JSON.stringify(updatedAlbums));
    setActiveMenuId(null);
    showToast("Album deleted.");
  };

  const handleAddToPlaylist = (album, playlistName) => {
    setActiveMenuId(null);
    let allSongs = [];
    const savedSongs = localStorage.getItem("music_songs");
    if (savedSongs) {
      try { allSongs = JSON.parse(savedSongs); } catch (e) {}
    }

    const albumTracks = allSongs.filter(s => s.album.toLowerCase() === album.title.toLowerCase());
    if (albumTracks.length === 0) {
      showToast(`No tracks found for "${album.title}".`);
      return;
    }

    const saved = localStorage.getItem(`music_playlist_songs_${playlistName}`);
    let playlistSongs = [];
    if (saved) {
      try { playlistSongs = JSON.parse(saved); } catch (e) {}
    }

    let addedCount = 0;
    const nextSongs = [...playlistSongs];
    albumTracks.forEach(song => {
      if (!nextSongs.some(s => s.id === song.id)) {
        nextSongs.push(song);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      showToast(`Tracks from "${album.title}" are already in "${playlistName}"`);
      return;
    }

    localStorage.setItem(`music_playlist_songs_${playlistName}`, JSON.stringify(nextSongs));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
    showToast(`Added ${addedCount} tracks from "${album.title}" to "${playlistName}"`);
  };

  const handleCreatePlaylist = (album) => {
    setActiveMenuId(null);
    window.dispatchEvent(new CustomEvent("open-create-playlist-modal"));
  };

  const handleViewLocation = (album) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(album.path);
      showToast(`Copied to clipboard: ${album.path}`);
    } else {
      showToast(`Location: ${album.path}`);
    }
  };

  return (
    <div className="home-container">
      {toast && <div className="toast-banner">{toast}</div>}
      <section className="home-section">
        <h2 className="section-header">Albums</h2>
        <div className="card-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-image-container">
                {album.image ? (
                  <img src={album.image} alt={album.title} className="card-image" />
                ) : (
                  <div className="card-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", height: "100%" }}>
                    <Music size={48} color="#a0a0a0" />
                  </div>
                )}
                <button 
                  className="card-play-btn"
                  onClick={() => {
                    playTrack(album);
                    showToast(`Playing album "${album.title}"`);
                  }}
                >
                  <Play size={24} fill="currentColor" className="play-icon-nudge" />
                </button>
              </div>
              
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                  <h4 className="card-title" style={{ margin: 0, flex: 1 }}>{album.title}</h4>
                  <div className="menu-wrapper" ref={activeMenuId === album.id ? activeMenuRef : null}>
                    <button
                      className="album-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === album.id ? null : album.id);
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
                    {activeMenuId === album.id && (
                      <div 
                        className="context-menu" 
                        style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="context-menu-item" onClick={() => handleRenameClick(album)}>
                          <Edit3 size={14} />
                          Rename
                        </button>
                        <button className="context-menu-item" onClick={() => handleChangeCoverClick(album)}>
                          <Image size={14} />
                          Change Album Cover
                        </button>
                        <button className="context-menu-item" onClick={() => handleDeleteAlbum(album.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button className="context-menu-item" onClick={() => handleViewLocation(album)}>
                          <Clipboard size={14} />
                          View Location
                        </button>
                        <button 
                          className="context-menu-item" 
                          onClick={() => {
                            addToQueue(album);
                            setActiveMenuId(null);
                            showToast(`Added album "${album.title}" to queue.`);
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
                              onClick={() => handleCreatePlaylist(album)}
                            >
                              + Create Playlist
                            </button>
                            {playlists.map((pl, pIdx) => (
                              <button
                                key={pIdx}
                                className="context-menu-item"
                                onClick={() => handleAddToPlaylist(album, pl)}
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
              <p className="card-artist" style={{ marginTop: "4px" }}>{album.artist} • {album.year}</p>
            </div>
          ))}
        </div>
      </section>

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
                <label className="modal-label">Album Name</label>
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
                    id="album-cover-file-input-albums"
                  />
                  <label 
                    htmlFor="album-cover-file-input-albums" 
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
