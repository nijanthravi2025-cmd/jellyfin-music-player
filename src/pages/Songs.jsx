import React, { useState, useEffect, useRef } from "react";
import { Play, Heart, Clock, MoreVertical, Edit3, Trash2, FolderPlus, Check, X, Clipboard, ArrowUpDown, ListMusic, Image, Music } from "lucide-react";
import "./Songs.css";
import { toggleLikeSong, isSongLiked, addToQueue, playTrack, syncSongUpdateInPlaylists, syncSongDeleteInPlaylists } from "../utils/musicShared";

const mockSongs = [
  {
    id: 1,
    title: "After Hours",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "6:01",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150",
    path: "C:/Users/NIJANTH/Music/After Hours.mp3"
  },
  {
    id: 2,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150",
    path: "C:/Users/NIJANTH/Music/Blinding Lights.mp3"
  },
  {
    id: 3,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: "4:03",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150",
    path: "C:/Users/NIJANTH/Downloads/Midnight City.wav"
  },
  {
    id: 4,
    title: "Strobe",
    artist: "deadmau5",
    album: "For Lack of a Better Name",
    duration: "10:37",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150&h=150",
    path: "D:/Media/Audio/Electronic/Strobe.flac"
  },
  {
    id: 5,
    title: "Intro",
    artist: "The xx",
    album: "xx",
    duration: "2:08",
    image: "https://images.unsplash.com/photo-1460036521480-c4b50f6a6c11?auto=format&fit=crop&q=80&w=150&h=150",
    path: "D:/Media/Tracks/The xx - Intro.mp3"
  },
];

export default function Songs() {
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem("music_songs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSongs;
  });
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
  
  // Sorting states
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

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

  const [likedListVersion, setLikedListVersion] = useState(0);

  // Sync liked songs updates across pages
  useEffect(() => {
    const handleLikesChange = () => {
      setLikedListVersion(prev => prev + 1);
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
    localStorage.setItem("music_songs", JSON.stringify(updatedSongs));

    const updatedSong = updatedSongs.find(s => s.id === renameItem.id);
    if (updatedSong) {
      syncSongUpdateInPlaylists(updatedSong);
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

    // Sync liked songs list if renamed
    const savedLiked = localStorage.getItem("music_liked_songs");
    if (savedLiked) {
      try {
        const likedList = JSON.parse(savedLiked);
        const updatedLiked = likedList.map(song => song.title.toLowerCase() === renameItem.title.toLowerCase() ? {
          ...song,
          title: trimmedTitle,
          artist: trimmedArtist,
          album: trimmedAlbum
        } : song);
        localStorage.setItem("music_liked_songs", JSON.stringify(updatedLiked));
        window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
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
    localStorage.setItem("music_songs", JSON.stringify(updatedSongs));

    const updatedSong = updatedSongs.find(s => s.id === coverItem.id);
    if (updatedSong) {
      syncSongUpdateInPlaylists(updatedSong);
    }

    // Update liked songs list if this song is liked
    const savedLiked = localStorage.getItem("music_liked_songs");
    if (savedLiked) {
      try {
        const likedList = JSON.parse(savedLiked);
        const updatedLiked = likedList.map(song => song.title.toLowerCase() === coverItem.title.toLowerCase() ? {
          ...song,
          image: newImage
        } : song);
        localStorage.setItem("music_liked_songs", JSON.stringify(updatedLiked));
        window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
      } catch (e) {}
    }

    // Update current playing track if it matches
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
    const updatedSongs = songs.filter(song => song.id !== id);
    setSongs(updatedSongs);
    localStorage.setItem("music_songs", JSON.stringify(updatedSongs));
    syncSongDeleteInPlaylists(id);
    setActiveMenuId(null);
    showToast("Song deleted.");
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

  // Helper to parse duration string 'MM:SS' to seconds integer for sorting
  const parseDuration = (durStr) => {
    const parts = durStr.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  // Sorting Handler
  const handleSortHeader = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Dynamic sorting function
  const sortedSongs = [...songs].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === "artist") {
      comparison = a.artist.localeCompare(b.artist);
    } else if (sortBy === "album") {
      comparison = a.album.localeCompare(b.album);
    } else if (sortBy === "duration") {
      comparison = parseDuration(a.duration) - parseDuration(b.duration);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleDropdownSortChange = (e) => {
    const val = e.target.value;
    if (val === "title-asc") { setSortBy("title"); setSortOrder("asc"); }
    else if (val === "title-desc") { setSortBy("title"); setSortOrder("desc"); }
    else if (val === "artist-asc") { setSortBy("artist"); setSortOrder("asc"); }
    else if (val === "artist-desc") { setSortBy("artist"); setSortOrder("desc"); }
    else if (val === "album-asc") { setSortBy("album"); setSortOrder("asc"); }
    else if (val === "album-desc") { setSortBy("album"); setSortOrder("desc"); }
    else if (val === "time-asc") { setSortBy("duration"); setSortOrder("asc"); }
    else if (val === "time-desc") { setSortBy("duration"); setSortOrder("desc"); }
  };

  const renderSortArrow = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="songs-page-container">
      <div className="songs-header-row">
        <h2 className="section-header" style={{ margin: 0 }}>All Songs</h2>
        
        <div className="sort-dropdown-container">
          <span>Sort by:</span>
          <select 
            className="sort-select" 
            onChange={handleDropdownSortChange}
            value={`${sortBy === "duration" ? "time" : sortBy}-${sortOrder}`}
          >
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="artist-asc">Artist (A-Z)</option>
            <option value="artist-desc">Artist (Z-A)</option>
            <option value="album-asc">Album (A-Z)</option>
            <option value="album-desc">Album (Z-A)</option>
            <option value="time-asc">Time (Shortest)</option>
            <option value="time-desc">Time (Longest)</option>
          </select>
        </div>
      </div>

      {toast && <div className="toast-banner">{toast}</div>}

      <table className="songs-table">
        <thead>
          <tr>
            <th className="song-index">#</th>
            <th className="sortable-header" onClick={() => handleSortHeader("title")}>
              Title {renderSortArrow("title")}
            </th>
            <th className="sortable-header" onClick={() => handleSortHeader("album")}>
              Album {renderSortArrow("album")}
            </th>
            <th className="sortable-header" onClick={() => handleSortHeader("duration")} style={{ width: "100px" }}>
              <Clock size={16} style={{ display: "inline-block", verticalAlign: "middle" }} />
              {renderSortArrow("duration")}
            </th>
            <th className="song-actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {sortedSongs.map((song, idx) => (
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
                    <span className="song-name">{song.title}</span>
                    <span className="song-artist">{song.artist}</span>
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
                    title={isSongLiked(song.title) ? "Unlike" : "Like"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeSong(song);
                    }}
                    style={{
                      opacity: isSongLiked(song.title) ? 1 : undefined,
                      color: isSongLiked(song.title) ? "#6c5ce7" : undefined
                    }}
                  >
                    <Heart size={16} fill={isSongLiked(song.title) ? "#6c5ce7" : "none"} />
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
                    id="album-cover-file-input"
                  />
                  <label 
                    htmlFor="album-cover-file-input" 
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
