import React, { useState, useEffect, useRef } from "react";
import { X, Search, Music, Check, Plus } from "lucide-react";
import "./CreatePlaylistModal.css";
import { readDataSync, writeDataSync } from '../utils/tauribridge';
import ImageWithFallback from "./ImageWithFallback";

const mockSongs = [];

export default function CreatePlaylistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState(new Set());
  const modalRef = useRef(null);

  useEffect(() => {
    const handleOpen = (e) => {
      // Load songs from localStorage
      let allSongs = [];
      const savedSongs = readDataSync("music_songs");
      if (savedSongs) {
        try {
          allSongs = JSON.parse(savedSongs);
        } catch (err) {
          allSongs = [];
        }
      } else {
        allSongs = [];
      }
      setSongs(allSongs);
      setPlaylistName("");
      setSearchQuery("");
      
      const newSelected = new Set();
      if (e.detail?.song) {
        newSelected.add(e.detail.song.id);
      }
      setSelectedSongIds(newSelected);
      setIsOpen(true);
    };

    window.addEventListener("open-create-playlist-modal", handleOpen);
    return () => window.removeEventListener("open-create-playlist-modal", handleOpen);
  }, []);

  // Close modal when clicking escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSongSelection = (id) => {
    const nextSelected = new Set(selectedSongIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedSongIds(nextSelected);
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredSongs.map(s => s.id);
    const nextSelected = new Set(selectedSongIds);
    const someUnchecked = allFilteredIds.some(id => !selectedSongIds.has(id));

    if (someUnchecked) {
      allFilteredIds.forEach(id => nextSelected.add(id));
    } else {
      allFilteredIds.forEach(id => nextSelected.delete(id));
    }
    setSelectedSongIds(nextSelected);
  };

  const handleSave = () => {
    if (!playlistName.trim()) return;
    const name = playlistName.trim();

    // Check if playlist already exists
    const saved = readDataSync("music_playlists");
    let playlistNames = [];
    if (saved) {
      try {
        playlistNames = JSON.parse(saved);
      } catch (e) {
        playlistNames = [];
      }
    } else {
      playlistNames = [];
    }

    if (playlistNames.map((p) => p.toLowerCase()).includes(name.toLowerCase())) {
      alert("A playlist with this name already exists!");
      return;
    }

    // Save new playlist to list
    const updatedNames = [...playlistNames, name];
    writeDataSync("music_playlists", JSON.stringify(updatedNames));

    // Save checked songs under music_playlist_songs_${playlistName}
    const selectedSongs = songs.filter((s) => selectedSongIds.has(s.id));
    writeDataSync(`music_playlist_songs_${name}`, JSON.stringify(selectedSongs));

    // Notify other components
    window.dispatchEvent(new CustomEvent("playlistsChanged", { detail: updatedNames }));
    window.dispatchEvent(new CustomEvent("show-toast", { detail: `Created playlist "${name}" with ${selectedSongs.length} songs!` }));

    setIsOpen(false);
  };

  return (
    <div className="playlist-modal-backdrop" onClick={() => setIsOpen(false)}>
      <div 
        className="playlist-modal-content" 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="playlist-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Plus size={20} color="#6c5ce7" />
            <h3>Create Playlist</h3>
          </div>
          <button className="playlist-modal-close" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="playlist-modal-body">
          {/* Playlist Name Field */}
          <div className="playlist-modal-field">
            <label className="playlist-modal-label">Playlist Name</label>
            <input
              type="text"
              className="playlist-modal-input"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="e.g. My Acoustic Hits"
              maxLength={30}
              autoFocus
              required
            />
          </div>

          {/* Song Selection Area */}
          <div className="playlist-modal-field" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="playlist-modal-label">Select Songs</label>
              {filteredSongs.length > 0 && (
                <button 
                  className="playlist-modal-select-all-btn" 
                  onClick={handleSelectAll}
                >
                  {filteredSongs.every(s => selectedSongIds.has(s.id)) ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {/* Song Search Bar */}
            <div className="playlist-search-container">
              <Search size={16} className="playlist-search-icon" />
              <input
                type="text"
                placeholder="Search songs in library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="playlist-search-input"
              />
              {searchQuery && (
                <button className="playlist-search-clear" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Song Selection Checklist List */}
            <div className="song-checklist-list">
              {filteredSongs.length === 0 ? (
                <div className="no-songs-found-message">
                  <Music size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <span>No matching songs in library.</span>
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const isChecked = selectedSongIds.has(song.id);
                  return (
                    <div
                      key={song.id}
                      className={`song-checklist-item ${isChecked ? "selected" : ""}`}
                      onClick={() => toggleSongSelection(song.id)}
                    >
                      <div className="song-checklist-info">
                        <ImageWithFallback src={song.image} alt={song.title} className="song-checklist-img" size={16} />
                        <div className="song-checklist-details">
                          <span className="song-checklist-name">{song.title}</span>
                          <span className="song-checklist-artist">{song.artist}</span>
                        </div>
                      </div>
                      <div className={`song-checklist-checkbox ${isChecked ? "checked" : ""}`}>
                        {isChecked && <Check size={12} color="white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="playlist-modal-footer">
          <button className="playlist-modal-btn cancel" onClick={() => setIsOpen(false)}>
            Cancel
          </button>
          <button
            className="playlist-modal-btn save"
            onClick={handleSave}
            disabled={!playlistName.trim()}
          >
            Create Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
