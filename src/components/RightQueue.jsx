import React, { useState, useEffect, useRef } from "react";
import { X, GripVertical, MoreVertical, Edit3, Trash2, Clipboard, FolderPlus, Check, XCircle, Search, Music, Disc, ListMusic } from "lucide-react";
import "./Sidebars.css";
import "../pages/Songs.css"; // Reuse context-menu and modal styles
import { playTrack } from "../utils/musicShared";
import { readDataSync, writeDataSync } from '../utils/tauribridge';

const INITIAL_QUEUE = [];
const INITIAL_SEARCH_SONGS = [];
const INITIAL_SEARCH_ALBUMS = [];

export default function RightQueue({ isOpen, onClose }) {
  const [queue, setQueue] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ songs: [], albums: [], playlists: [] });

  // Handle Search Query filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ songs: [], albums: [], playlists: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    // 1. Search Songs
    const savedSongsStr = readDataSync("music_songs");
    let allSongs = [];
    if (savedSongsStr) {
      try {
        allSongs = JSON.parse(savedSongsStr);
      } catch (e) {}
    }
    if (allSongs.length === 0) {
      allSongs = INITIAL_SEARCH_SONGS;
    }
    const filteredSongs = allSongs.filter(
      song => song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
    );

    // 2. Search Albums
    const savedAlbumsStr = readDataSync("music_albums");
    let allAlbums = [];
    if (savedAlbumsStr) {
      try {
        allAlbums = JSON.parse(savedAlbumsStr);
      } catch (e) {}
    }
    if (allAlbums.length === 0) {
      allAlbums = INITIAL_SEARCH_ALBUMS;
    }
    const filteredAlbums = allAlbums.filter(
      album => album.title.toLowerCase().includes(query) || album.artist.toLowerCase().includes(query)
    );

    // 3. Search Playlists
    const savedPlaylistsStr = readDataSync("music_playlists");
    let allPlaylists = [];
    if (savedPlaylistsStr) {
      try {
        allPlaylists = JSON.parse(savedPlaylistsStr);
      } catch (e) {}
    } else {
      allPlaylists = [];
    }
    const filteredPlaylists = allPlaylists.filter(
      plName => plName.toLowerCase().includes(query)
    );

    setSearchResults({
      songs: filteredSongs.slice(0, 5),
      albums: filteredAlbums.slice(0, 5),
      playlists: filteredPlaylists.slice(0, 5)
    });
  }, [searchQuery]);

  // Click Handlers to add to queue
  const handleAddSongToQueue = (song) => {
    const nextId = queue.length > 0 ? Math.max(...queue.map(t => t.id)) + 1 : 1;
    const newTrack = {
      id: nextId,
      title: song.title,
      artist: song.artist,
      album: song.album || "",
      duration: song.duration || "3:00",
      image: song.image || "",
      path: song.path || ""
    };
    setQueue(prev => [...prev, newTrack]);
    showToast(`Added "${song.title}" to queue.`);
  };

  const handleAddAlbumToQueue = (album) => {
    const savedSongsStr = readDataSync("music_songs");
    let allSongs = [];
    if (savedSongsStr) {
      try {
        allSongs = JSON.parse(savedSongsStr);
      } catch (e) {}
    }
    if (allSongs.length === 0) {
      allSongs = INITIAL_SEARCH_SONGS;
    }
    const albumSongs = allSongs.filter(
      song => song.album && song.album.toLowerCase() === album.title.toLowerCase()
    );

    if (albumSongs.length === 0) {
      showToast(`No songs found in album "${album.title}".`);
      return;
    }

    setQueue(prev => {
      let currentMax = prev.length > 0 ? Math.max(...prev.map(t => t.id)) : 0;
      const newTracks = albumSongs.map(song => ({
        id: ++currentMax,
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        duration: song.duration || "3:00",
        image: song.image || "",
        path: song.path || ""
      }));
      return [...prev, ...newTracks];
    });

    showToast(`Added ${albumSongs.length} songs from "${album.title}" to queue.`);
  };

  const handleAddPlaylistToQueue = (playlistName) => {
    const savedSongsStr = readDataSync(`music_playlist_songs_${playlistName}`);
    let playlistSongs = [];
    if (savedSongsStr) {
      try {
        playlistSongs = JSON.parse(savedSongsStr);
      } catch (e) {}
    }

    if (playlistSongs.length === 0) {
      showToast(`Playlist "${playlistName}" is empty.`);
      return;
    }

    setQueue(prev => {
      let currentMax = prev.length > 0 ? Math.max(...prev.map(t => t.id)) : 0;
      const newTracks = playlistSongs.map(song => ({
        id: ++currentMax,
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        duration: song.duration || "3:00",
        image: song.image || "",
        path: song.path || ""
      }));
      return [...prev, ...newTracks];
    });

    showToast(`Added ${playlistSongs.length} songs from playlist "${playlistName}" to queue.`);
  };
  
  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedQueue = [...queue];
    const draggedItem = updatedQueue[draggedIndex];
    updatedQueue.splice(draggedIndex, 1);
    updatedQueue.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setQueue(updatedQueue);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  
  const [toast, setToast] = useState("");
  
  const activeMenuRef = useRef(null);

  // Load playlists from localStorage
  useEffect(() => {
    const loadPlaylistsList = () => {
      const saved = readDataSync("music_playlists");
      if (saved) {
        try {
          setPlaylists(JSON.parse(saved));
        } catch (e) {
          setPlaylists([]);
        }
      } else {
        const defaultPL = [];
        writeDataSync("music_playlists", JSON.stringify(defaultPL));
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

  // Listen to global add-to-queue event
  useEffect(() => {
    const handleAddToQueue = (e) => {
      if (e.detail) {
        setQueue(prevQueue => [...prevQueue, e.detail]);
      }
    };
    window.addEventListener("addToQueue", handleAddToQueue);
    return () => window.removeEventListener("addToQueue", handleAddToQueue);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (track) => {
    setRenameItem(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();

    let changes = [];
    if (renameItem.title !== trimmedTitle) changes.push(`Song name changed to "${trimmedTitle}"`);
    if (renameItem.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);

    setQueue(queue.map(t => t.id === renameItem.id ? { 
      ...t, 
      title: trimmedTitle,
      artist: trimmedArtist
    } : t));

    setIsRenameModalOpen(false);
    setRenameItem(null);

    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleRemoveTrack = (id) => {
    setQueue(queue.filter(t => t.id !== id));
    setActiveMenuId(null);
    showToast("Removed from queue.");
  };

  const handleAddToPlaylist = (song, playlistName) => {
    setActiveMenuId(null);
    const saved = readDataSync(`music_playlist_songs_${playlistName}`);
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
    writeDataSync(`music_playlist_songs_${playlistName}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
    showToast(`Added "${song.title}" to "${playlistName}"`);
  };

  const handleCreatePlaylist = (song) => {
    setActiveMenuId(null);
    window.dispatchEvent(new CustomEvent("open-create-playlist-modal", {
      detail: { song }
    }));
  };

  const handleViewLocation = (track) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(track.path);
      showToast(`Copied location: ${track.path}`);
    } else {
      showToast(`Location: ${track.path}`);
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    showToast("Queue cleared.");
  };

  return (
    <aside className={`right-queue ${isOpen ? "open" : ""}`} style={{ position: "relative" }}>
      {toast && <div className="toast-banner" style={{ bottom: "24px", right: "24px", fontSize: "12px", padding: "8px 16px" }}>{toast}</div>}

      <div className="queue-header">
        <h3>Next in Queue</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {queue.length > 0 && (
            <button 
              onClick={handleClearQueue}
              style={{
                background: "none",
                border: "none",
                color: "#ff7675",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 118, 117, 0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              Clear Queue
            </button>
          )}
          <button onClick={onClose} className="close-btn" style={{ padding: "4px", display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="queue-search-container" style={{ padding: "0 0 12px 0", position: "relative" }}>
        <div className="queue-search-input-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} className="search-icon" style={{ position: "absolute", left: "12px", color: "#a0a0a0" }} />
          <input
            type="text"
            className="queue-search-input"
            placeholder="Search & add to queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                color: "#a0a0a0",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Panel */}
        {searchQuery.trim() && (
          <div className="queue-search-results">
            {searchResults.songs.length === 0 && searchResults.albums.length === 0 && searchResults.playlists.length === 0 ? (
              <div className="no-results" style={{ padding: "12px", textAlign: "center", color: "#a0a0a0", fontSize: "12px" }}>
                No results found.
              </div>
            ) : (
              <>
                {searchResults.songs.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-title">Songs</div>
                    {searchResults.songs.map((song) => (
                      <div
                        key={song.id}
                        className="search-result-item"
                        onClick={() => {
                          handleAddSongToQueue(song);
                          setSearchQuery("");
                        }}
                      >
                        <Music size={12} className="result-icon" />
                        <div className="result-info">
                          <span className="result-name">{song.title}</span>
                          <span className="result-sub">{song.artist}</span>
                        </div>
                        <span className="add-badge">+ Add</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.albums.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-title">Albums</div>
                    {searchResults.albums.map((album) => (
                      <div
                        key={album.id}
                        className="search-result-item"
                        onClick={() => {
                          handleAddAlbumToQueue(album);
                          setSearchQuery("");
                        }}
                      >
                        <Disc size={12} className="result-icon" />
                        <div className="result-info">
                          <span className="result-name">{album.title}</span>
                          <span className="result-sub">{album.artist}</span>
                        </div>
                        <span className="add-badge">+ Add Album</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.playlists.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-title">Playlists</div>
                    {searchResults.playlists.map((plName, idx) => (
                      <div
                        key={idx}
                        className="search-result-item"
                        onClick={() => {
                          handleAddPlaylistToQueue(plName);
                          setSearchQuery("");
                        }}
                      >
                        <ListMusic size={12} className="result-icon" />
                        <div className="result-info">
                          <span className="result-name">{plName}</span>
                          <span className="result-sub">Playlist</span>
                        </div>
                        <span className="add-badge">+ Add Playlist</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="queue-list" style={{ overflow: "visible" }}>
        {queue.length === 0 ? (
          <div style={{ color: "#a0a0a0", fontSize: "14px", textAlign: "center", padding: "32px 16px" }}>
            Queue is empty.
          </div>
        ) : (
          queue.map((track, idx) => (
            <div 
              key={track.id} 
              className={`queue-item ${draggedIndex === idx ? "dragging" : ""}`} 
              style={{ display: "flex", alignItems: "center", position: "relative", overflow: "visible" }}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <GripVertical size={16} className="drag-handle" />
              
              <div 
                className="queue-track-info" 
                style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                onClick={() => {
                  playTrack(track);
                  showToast(`Playing "${track.title}"`);
                }}
              >
                <span className="q-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </span>
                <span className="q-artist" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist}
                </span>
              </div>

              {/* Options menu */}
              <div className="menu-wrapper" ref={activeMenuId === track.id ? activeMenuRef : null} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === track.id ? null : track.id);
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
                {activeMenuId === track.id && (
                  <div 
                    className="context-menu" 
                    style={{ right: 0, top: "100%", bottom: "auto", marginTop: "6px", width: "150px" }} 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="context-menu-item" onClick={() => handleRenameClick(track)}>
                      <Edit3 size={12} />
                      Rename
                    </button>
                    <button className="context-menu-item" onClick={() => handleRemoveTrack(track.id)}>
                      <Trash2 size={12} />
                      Remove
                    </button>
                    <button className="context-menu-item" onClick={() => handleViewLocation(track)}>
                      <Clipboard size={12} />
                      View Location
                    </button>
                    <div className="context-menu-item">
                      <FolderPlus size={12} />
                      Add to Playlist
                      <div className="context-submenu" style={{ bottom: 0, top: "auto", width: "130px" }}>
                        <button
                          className="context-menu-item"
                          style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7", fontSize: "11px" }}
                          onClick={() => handleCreatePlaylist(track)}
                        >
                          + Create Playlist
                        </button>
                        {playlists.map((pl, pIdx) => (
                          <button
                            key={pIdx}
                            className="context-menu-item"
                            style={{ fontSize: "11px" }}
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
            </div>
          ))
        )}
      </div>

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
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveRename}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}