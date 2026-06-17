import React, { useState, useEffect, useRef } from "react";
import { Play, Heart, Clock, MoreVertical, Edit3, Trash2, FolderPlus, Check, X, Clipboard, ListMusic, Image, Music } from "lucide-react";
import "./Songs.css"; // Reuse table styling and menu styling
import { getLikedSongs, toggleLikeSong, isSongLiked, addToQueue, playTrack, syncSongUpdateInPlaylists } from "../utils/musicShared";

export default function LikedSongs() {
  const [songs, setSongs] = useState(() => getLikedSongs());
  const [playlists, setPlaylists] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");

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
          setPlaylists(["Chill Acoustic Vibes", "Deep Focus Beats", "Vaporwave Nights", "Heavy Rock Anthems"]);
        }
      } else {
        const defaultPL = ["Chill Acoustic Vibes", "Deep Focus Beats", "Vaporwave Nights", "Heavy Rock Anthems"];
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

  // Listen to liked songs changed event
  useEffect(() => {
    const handleLikesChange = (e) => {
      setSongs(e.detail || []);
    };
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => window.removeEventListener("likedSongsChanged", handleLikesChange);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (song) => {
    setRenameItem(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album);
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();
    const trimmedAlbum = editAlbum.trim();
    
    let changes = [];
    const oldVal = songs.find(s => s.id === renameItem.id);
    if (oldVal) {
      if (oldVal.title !== trimmedTitle) changes.push(`Song name changed to "${trimmedTitle}"`);
      if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
      if (oldVal.album !== trimmedAlbum) changes.push(`Album name changed to "${trimmedAlbum}"`);
    }

    const updatedSongs = songs.map(song => song.id === renameItem.id ? { 
      ...song, 
      title: trimmedTitle,
      artist: trimmedArtist,
      album: trimmedAlbum
    } : song);

    setSongs(updatedSongs);
    localStorage.setItem("music_liked_songs", JSON.stringify(updatedSongs));
    window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedSongs }));

    const updatedSong = updatedSongs.find(s => s.id === renameItem.id);
    if (updatedSong) {
      syncSongUpdateInPlaylists(updatedSong);
    }

    // Sync all songs list if renamed
    const savedAll = localStorage.getItem("music_songs");
    if (savedAll) {
      try {
        const allList = JSON.parse(savedAll);
        const updatedAll = allList.map(song => song.title.toLowerCase() === renameItem.title.toLowerCase() ? {
          ...song,
          title: trimmedTitle,
          artist: trimmedArtist,
          album: trimmedAlbum
        } : song);
        localStorage.setItem("music_songs", JSON.stringify(updatedAll));
      } catch (e) {}
    }

    // Sync current playing track metadata if renamed
    const savedCurrent = localStorage.getItem("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === renameItem.title.toLowerCase()) {
          const updatedTrack = { 
            ...currentTrack, 
            title: trimmedTitle,
            artist: trimmedArtist,
            album: trimmedAlbum
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

  const handleChangeCoverClick = (song) => {
    setCoverItem(song);
    setEditImage(song.image || "");
    setIsCoverModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveCover = () => {
    if (!coverItem) return;
    const newImage = editImage.trim();

    const updatedSongs = songs.map(song => song.id === coverItem.id ? { 
      ...song, 
      image: newImage
    } : song);

    setSongs(updatedSongs);
    localStorage.setItem("music_liked_songs", JSON.stringify(updatedSongs));
    window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedSongs }));

    const updatedSong = updatedSongs.find(s => s.id === coverItem.id);
    if (updatedSong) {
      syncSongUpdateInPlaylists(updatedSong);
    }

    // Sync all songs list if updated
    const savedAll = localStorage.getItem("music_songs");
    if (savedAll) {
      try {
        const allList = JSON.parse(savedAll);
        const updatedAll = allList.map(song => song.title.toLowerCase() === coverItem.title.toLowerCase() ? {
          ...song,
          image: newImage
        } : song);
        localStorage.setItem("music_songs", JSON.stringify(updatedAll));
      } catch (e) {}
    }

    // Sync current playing track metadata if updated
    const savedCurrent = localStorage.getItem("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === coverItem.title.toLowerCase()) {
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

  const handleDeleteSong = (id) => {
    const song = songs.find(s => s.id === id);
    if (song) {
      toggleLikeSong(song);
      showToast("Removed from Liked Songs.");
    }
    setActiveMenuId(null);
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

  const handleViewLocation = (song) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(song.path);
      showToast(`Copied to clipboard: ${song.path}`);
    } else {
      showToast(`Location: ${song.path}`);
    }
  };

  return (
    <div className="songs-page-container">
      {toast && <div className="toast-banner">{toast}</div>}

      {/* Premium Header Banner */}
      <div 
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "24px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.5)), linear-gradient(135deg, #6c5ce7 0%, #3b1b9e 100%)",
          padding: "32px 24px",
          borderRadius: "8px",
          color: "white",
          minHeight: "180px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
        }}
      >
        <div 
          style={{
            width: "120px",
            height: "120px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
          }}
        >
          <Heart size={64} fill="white" color="white" />
        </div>
        <div>
          <span style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase" }}>Playlist</span>
          <h1 style={{ fontSize: "48px", margin: "4px 0", fontWeight: "800" }}>Liked Songs</h1>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>{songs.length} songs</span>
        </div>
      </div>

      <table className="songs-table" style={{ marginTop: "32px" }}>
        <thead>
          <tr>
            <th className="song-index">#</th>
            <th>Title</th>
            <th>Album</th>
            <th>
              <Clock size={16} />
            </th>
            <th className="song-actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, idx) => (
            <tr 
              key={song.id} 
              className="song-row"
              onClick={() => {
                playTrack(song);
                showToast(`Playing "${song.title}"`);
              }}
            >
              <td className="song-index">{idx + 1}</td>
              <td>
                <div className="song-info-col">
                  {song.image ? (
                    <img src={song.image} alt={song.title} className="song-thumbnail" />
                  ) : (
                    <div className="song-thumbnail" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>
                      <Music size={16} color="#a0a0a0" />
                    </div>
                  )}
                  <div className="song-details">
                    <>
                      <span className="song-name">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                    </>
                  </div>
                </div>
              </td>
              <td>
                <span className="song-album-col">{song.album}</span>
              </td>
              <td>
                <span className="song-duration-col">{song.duration}</span>
              </td>
              <td className="song-actions-col">
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                  <button 
                    className="row-action-btn" 
                    title="Unlike" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSong(song.id);
                    }}
                    style={{ opacity: 1, color: "#6c5ce7" }}
                  >
                    <Heart size={16} fill="#6c5ce7" />
                  </button>
                  <div className="menu-wrapper" ref={activeMenuId === song.id ? activeMenuRef : null}>
                    <button
                      className="row-action-btn"
                      title="Options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === song.id ? null : song.id);
                      }}
                      style={{ opacity: activeMenuId === song.id ? 1 : undefined }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === song.id && (
                      <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="context-menu-item" onClick={() => handleRenameClick(song)}>
                          <Edit3 size={14} />
                          Rename
                        </button>
                        <button className="context-menu-item" onClick={() => handleChangeCoverClick(song)}>
                          <Image size={14} />
                          Change Album Cover
                        </button>
                        <button className="context-menu-item" onClick={() => handleDeleteSong(song.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button className="context-menu-item" onClick={() => handleViewLocation(song)}>
                          <Clipboard size={14} />
                          View Location
                        </button>
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
                          <div className="context-submenu">
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
                <label className="modal-label">Song Name</label>
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
              <div className="modal-field">
                <label className="modal-label">Album Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
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
                    id="liked-cover-file-input"
                  />
                  <label 
                    htmlFor="liked-cover-file-input" 
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
