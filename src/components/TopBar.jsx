import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  ListMusic,
  Music,
  Users,
  Disc,
  Heart,
  Folder,
  Plus,
  RefreshCw,
  Trash2,
  PlusSquare,
  Star,
  LogOut,
  Edit,
  X,
  User,
  Image,
  Server,
  Wifi,
} from "lucide-react";
import SearchBar from "./SearchBar";
import "./TopBar.css";
import "./ProfileSelect.css"; // Reuse profile modal styles
import { readDataSync, writeDataSync, removeDataSync, scanMusicDirectory, getAudioMetadata, selectDirectory } from '../utils/tauribridge';
import ImageCropperModal from "./ImageCropperModal";

export default function TopBar() {
  const [isDirOpen, setIsDirOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [newDirPath, setNewDirPath] = useState("");
  const [formType, setFormType] = useState("local"); // "local" or "jellyfin"
  const [jellyfinUrl, setJellyfinUrl] = useState("");
  const [jellyfinUsername, setJellyfinUsername] = useState("");
  const [jellyfinPassword, setJellyfinPassword] = useState("");
  const [toast, setToast] = useState("");
  const dropdownRef = useRef(null);

  // Profile-specific states
  const [activeProfile, setActiveProfile] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [defaultProfileId, setDefaultProfileId] = useState("");
  const profileDropdownRef = useRef(null);

  // Edit profile modal states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileAvatar, setEditProfileAvatar] = useState("");
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);

  const [directories, setDirectories] = useState(() => {
    const saved = readDataSync("music_directories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default if parse fails
      }
    }
    return [];
  });

  // Load profile data on mount
  // Load profile data on mount
  useEffect(() => {
    const profileId = sessionStorage.getItem("music_current_profile_id");
    const savedProfiles = readDataSync("music_profiles");

    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setAllProfiles(parsed);
        if (profileId) {
          const active = parsed.find(p => p.id === profileId);
          if (active) {
            setActiveProfile(active);
            setEditProfileName(active.name);
            setEditProfileAvatar(active.avatar || "");
          }
        }
      } catch (e) {}
    }

    // Startup check: if no directories are specified, clear any stale mock or cached data
    const savedDirs = readDataSync("music_directories");
    let parsedDirs = [];
    if (savedDirs) {
      try {
        parsedDirs = JSON.parse(savedDirs);
      } catch (e) {}
    }
    if (parsedDirs.length === 0) {
      const songs = readDataSync("music_songs");
      const albums = readDataSync("music_albums");
      const artists = readDataSync("music_artists");
      const driveAlbums = readDataSync("music_drive_albums");

      const hasSongs = songs && songs !== "[]";
      const hasAlbums = albums && albums !== "[]";
      const hasArtists = artists && artists !== "[]";
      const hasDrive = driveAlbums && driveAlbums !== "[]";

      if (hasSongs || hasAlbums || hasArtists || hasDrive) {
        writeDataSync("music_songs", JSON.stringify([]));
        writeDataSync("music_albums", JSON.stringify([]));
        writeDataSync("music_artists", JSON.stringify([]));
        writeDataSync("music_drive_albums", JSON.stringify([]));

        window.dispatchEvent(new CustomEvent("songsChanged"));
        window.dispatchEvent(new CustomEvent("albumsChanged"));
        window.dispatchEvent(new CustomEvent("artistsChanged"));
      }
    }

    // Check and wipe old mock playlists from database key
    const playlistsStr = readDataSync("music_playlists");
    if (playlistsStr) {
      try {
        const pls = JSON.parse(playlistsStr);
        if (pls.includes("Chill Acoustic Vibes") || pls.includes("Deep Focus Beats") || pls.includes("Vaporwave Nights") || pls.includes("Heavy Rock Anthems")) {
          writeDataSync("music_playlists", JSON.stringify([]));
          window.dispatchEvent(new CustomEvent("playlistsChanged"));
        }
      } catch (e) {}
    }

    // Check and wipe old mock liked songs from database key
    const likedStr = readDataSync("music_liked_songs");
    if (likedStr) {
      try {
        const liked = JSON.parse(likedStr);
        if (liked.some(song => song.title === "Midnight City" || song.title === "After Hours" || song.title === "Strobe" || song.title === "Blinding Lights" || song.title === "Intro")) {
          writeDataSync("music_liked_songs", JSON.stringify([]));
          window.dispatchEvent(new CustomEvent("likedSongsChanged"));
        }
      } catch (e) {}
    }
  }, []);

  const handleSwitchProfile = () => {
    sessionStorage.removeItem("music_current_profile_id");
    window.location.reload();
  };

  const handleCreatePlaylist = () => {
    window.dispatchEvent(new CustomEvent("open-create-playlist-modal"));
  };

  const handleSaveEditProfile = () => {
    if (!editProfileName.trim() || !activeProfile) return;
    const name = editProfileName.trim();
    const avatar = editProfileAvatar.trim();

    const savedProfiles = readDataSync("music_profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        const updated = parsed.map(p => p.id === activeProfile.id ? { ...p, name, avatar } : p);
        writeDataSync("music_profiles", JSON.stringify(updated));
        
        setActiveProfile({ ...activeProfile, name, avatar });
      } catch (e) {}
    }
    setIsEditProfileModalOpen(false);
    window.location.reload(); // Reload to refresh headers & profile listings
  };

  const handleDeleteActiveProfile = () => {
    if (!activeProfile) return;
    const savedProfiles = readDataSync("music_profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        if (parsed.length <= 1) {
          alert("You must keep at least one profile!");
          return;
        }

        if (window.confirm("Are you sure you want to delete your current profile? All playlists and folders will be deleted permanently.")) {
          const updated = parsed.filter(p => p.id !== activeProfile.id);
          writeDataSync("music_profiles", JSON.stringify(updated));

          // Clean local storage keys associated with the profile
          removeDataSync("music_playlists_" + activeProfile.id);
          removeDataSync("music_directories_" + activeProfile.id);

          // Clear current active profile and reload to show Selection Screen
          sessionStorage.removeItem("music_current_profile_id");
          setIsEditProfileModalOpen(false);
          window.location.reload();
        }
      } catch (e) {}
    }
  };

  // Save to localStorage whenever directories list changes
  useEffect(() => {
    writeDataSync("music_directories", JSON.stringify(directories));
  }, [directories]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDirOpen(false);
        setIsAdding(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerScan = async (targetDirs) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToast("Scanning library directories...");

    try {
      // scanMusicDirectory and getAudioMetadata are statically imported at the top of the file
      let allScannedSongs = [];

      for (const dir of targetDirs) {
        if (dir.type === "jellyfin") continue;
        try {
          const files = await scanMusicDirectory(dir.path);
          for (const file of files) {
            try {
              const metadata = await getAudioMetadata(file.path);
              if (metadata) {
                allScannedSongs.push({
                  id: file.path,
                  title: metadata.title || file.filename,
                  artist: metadata.artist || "Unknown Artist",
                  album: metadata.album || "Unknown Album",
                  duration: metadata.duration_formatted || "0:00",
                  duration_secs: metadata.duration_secs || 0,
                  image: metadata.cover_art_base64 || "",
                  path: file.path
                });
              }
            } catch (err) {
              console.error("Failed to parse metadata for file:", file.path, err);
            }
          }
        } catch (err) {
          console.error("Failed to scan directory path:", dir.path, err);
        }
      }

      // Read old database values to preserve custom image overrides
      let oldSongs = [];
      const savedSongs = readDataSync("music_songs");
      if (savedSongs) {
        try { oldSongs = JSON.parse(savedSongs); } catch (e) {}
      }

      // Preserve custom song images
      allScannedSongs = allScannedSongs.map(scanned => {
        const matchedOld = oldSongs.find(old => old.id === scanned.id || old.path === scanned.path);
        if (matchedOld && matchedOld.isCustomImage) {
          return {
            ...scanned,
            image: matchedOld.image,
            isCustomImage: true
          };
        }
        return scanned;
      });

      // Save songs
      writeDataSync("music_songs", JSON.stringify(allScannedSongs));

      // Read old albums to preserve custom album images
      let oldAlbums = [];
      const savedAlbums = readDataSync("music_albums");
      if (savedAlbums) {
        try { oldAlbums = JSON.parse(savedAlbums); } catch (e) {}
      }

      // Derive albums
      const albumMap = {};
      allScannedSongs.forEach(song => {
        const albumName = song.album || "Unknown Album";
        const albumKey = `${albumName.toLowerCase()}::${(song.artist || "").toLowerCase()}`;
        if (!albumMap[albumKey]) {
          albumMap[albumKey] = {
            id: albumKey,
            title: albumName,
            artist: song.artist || "Unknown Artist",
            year: "Unknown",
            image: song.image || "",
            path: song.path.substring(0, song.path.lastIndexOf("/"))
          };
        } else if (!albumMap[albumKey].image && song.image) {
          albumMap[albumKey].image = song.image;
        }
      });
      const albumsList = Object.values(albumMap).map(derived => {
        const matchedOld = oldAlbums.find(old => old.id === derived.id || old.title.toLowerCase() === derived.title.toLowerCase());
        if (matchedOld && matchedOld.isCustomImage) {
          return {
            ...derived,
            image: matchedOld.image,
            isCustomImage: true
          };
        }
        return derived;
      });
      writeDataSync("music_albums", JSON.stringify(albumsList));

      // Read old artists to preserve custom artist images
      let oldArtists = [];
      const savedArtists = readDataSync("music_artists");
      if (savedArtists) {
        try { oldArtists = JSON.parse(savedArtists); } catch (e) {}
      }

      // Derive artists
      const artistMap = {};
      allScannedSongs.forEach(song => {
        const artistName = song.artist || "Unknown Artist";
        const artistKey = artistName.toLowerCase();
        if (!artistMap[artistKey]) {
          artistMap[artistKey] = {
            id: artistKey,
            name: artistName,
            genre: "Unknown",
            followers: "0",
            image: song.image || "",
            tracks: []
          };
        } else if (!artistMap[artistKey].image && song.image) {
          artistMap[artistKey].image = song.image;
        }
        artistMap[artistKey].tracks.push({
          id: song.id,
          title: song.title,
          album: song.album || "Unknown Album",
          duration: song.duration,
          path: song.path
        });
      });
      const artistsList = Object.values(artistMap).map(derived => {
        const matchedOld = oldArtists.find(old => old.id === derived.id || old.name.toLowerCase() === derived.name.toLowerCase());
        if (matchedOld && matchedOld.isCustomImage) {
          return {
            ...derived,
            image: matchedOld.image,
            isCustomImage: true
          };
        }
        return derived;
      });
      writeDataSync("music_artists", JSON.stringify(artistsList));

      // Read old drive albums to preserve custom drive album images
      let oldDriveAlbums = [];
      const savedDrive = readDataSync("music_drive_albums");
      if (savedDrive) {
        try { oldDriveAlbums = JSON.parse(savedDrive); } catch (e) {}
      }

      // Also derive drive albums for the Home page
      const driveMap = {};
      allScannedSongs.forEach(song => {
        const folderPath = song.path.substring(0, song.path.lastIndexOf("/"));
        const folderName = folderPath.substring(folderPath.lastIndexOf("/") + 1);
        if (!driveMap[folderPath]) {
          driveMap[folderPath] = {
            id: folderPath,
            title: folderName || "Music Folder",
            artist: song.artist || "Unknown Artist",
            image: song.image || "",
            path: folderPath,
            dateAdded: "Scanned folder",
            timestamp: Date.now()
          };
        } else if (!driveMap[folderPath].image && song.image) {
          driveMap[folderPath].image = song.image;
        }
      });
      const driveAlbumsList = Object.values(driveMap).map(derived => {
        const matchedOld = oldDriveAlbums.find(old => old.id === derived.id || old.path === derived.path);
        if (matchedOld && matchedOld.isCustomImage) {
          return {
            ...derived,
            image: matchedOld.image,
            isCustomImage: true
          };
        }
        return derived;
      });
      writeDataSync("music_drive_albums", JSON.stringify(driveAlbumsList));

      // Dispatch change events
      window.dispatchEvent(new CustomEvent("songsChanged"));
      window.dispatchEvent(new CustomEvent("albumsChanged"));
      window.dispatchEvent(new CustomEvent("artistsChanged"));

      setToast(`Scanned successfully! Found ${allScannedSongs.length} songs.`);
    } catch (e) {
      console.error("Refresh scan failed:", e);
      setToast("Scan failed!");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    triggerScan(directories);
  };

  const handleAddDirectory = (e) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    let updatedDirs = [...directories];
    if (formType === "local") {
      if (!newDirPath.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: newDirPath.trim(),
        type: "local"
      };
      updatedDirs = [...directories, newDir];
      setDirectories(updatedDirs);
      setNewDirName("");
      setNewDirPath("");
      setIsAdding(false);
      setToast("Directory added! Scanning folder...");
    } else {
      if (!jellyfinUrl.trim() || !jellyfinUsername.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: jellyfinUrl.trim(),
        type: "jellyfin",
        url: jellyfinUrl.trim(),
        username: jellyfinUsername.trim(),
        password: jellyfinPassword.trim(),
        connected: true
      };
      updatedDirs = [...directories, newDir];
      setDirectories(updatedDirs);
      setNewDirName("");
      setJellyfinUrl("");
      setJellyfinUsername("");
      setJellyfinPassword("");
      setFormType("local");
      setIsAdding(false);
      setToast("Jellyfin server connected!");
    }
    setTimeout(() => setToast(""), 3000);
    triggerScan(updatedDirs);
  };

  const handleDeleteDirectory = (id, e) => {
    e.stopPropagation();
    const updatedDirs = directories.filter((d) => d.id !== id);
    setDirectories(updatedDirs);
    setToast("Directory removed. Scanning updated folders...");
    setTimeout(() => setToast(""), 3000);
    triggerScan(updatedDirs);
  };

  const handleSelectLocalFolder = async () => {
    const path = await selectDirectory();
    if (path) {
      setNewDirPath(path);
      // Auto-populate name from folder name if name is empty
      if (!newDirName.trim()) {
        const parts = path.split('/');
        const folderName = parts[parts.length - 1] || "Music Folder";
        setNewDirName(folderName);
      }
    }
  };

  return (
    <header className="top-bar">
      {/* LEFT: Logo & Main Navigation */}
      <div className="top-bar-left">
        <div className="logo-container">
          <Music size={28} color="#6c5ce7" />
          <h2>MusicApp</h2>
        </div>

        <nav className="top-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <ListMusic size={20} />
            <span>Playlists</span>
          </NavLink>
          <NavLink
            to="/songs"
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Music size={20} />
            <span>Songs</span>
          </NavLink>
          <NavLink
            to="/artists"
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Users size={20} />
            <span>Artists</span>
          </NavLink>
          <NavLink
            to="/albums"
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Disc size={20} />
            <span>Albums</span>
          </NavLink>
          <NavLink
            to="/liked-songs"
            className={({ isActive }) =>
              `top-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Heart size={20} />
            <span>Liked Songs</span>
          </NavLink>
        </nav>
      </div>

      {/* CENTER: Search Bar */}
      <div className="top-bar-center">
        <SearchBar />
      </div>

      {/* RIGHT: Quick Actions & Profile */}
      <div className="top-bar-right">
        {/* Directories Dropdown Container */}
        <div className="directories-dropdown-container" ref={dropdownRef}>
          <button
            className={`top-icon-btn ${isDirOpen ? "active" : ""}`}
            title="Directories"
            onClick={() => setIsDirOpen(!isDirOpen)}
          >
            <Folder size={20} />
          </button>

          {isDirOpen && (
            <div className="directories-dropdown-menu">
              <div className="directories-header">
                <span className="directories-title">Directories</span>
                <button
                  className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
                  title="Refresh Scan"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {toast && <div className="toast-message">{toast}</div>}

              <div className="directories-list">
                {directories.length === 0 ? (
                  <div style={{ color: "#a0a0a0", fontSize: "12px", textAlign: "center", padding: "8px" }}>
                    No directories added.
                  </div>
                ) : (
                  directories.map((dir) => (
                    <div key={dir.id} className="directory-item" title={dir.path}>
                      <div className="directory-info">
                        {dir.type === "jellyfin" ? (
                          <Server size={16} className="jellyfin-icon" />
                        ) : (
                          <Folder size={16} />
                        )}
                        <div className="directory-text">
                          <span className="directory-name">
                            {dir.name}
                            {dir.type === "jellyfin" && (
                              <span className="jellyfin-badge">
                                <span className="pulse-dot"></span>
                                Connected
                              </span>
                            )}
                          </span>
                          <span className="directory-path">{dir.path}</span>
                        </div>
                      </div>
                      <button
                        className="directory-delete-btn"
                        title="Remove directory"
                        onClick={(e) => handleDeleteDirectory(dir.id, e)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ height: "1px", backgroundColor: "#333", margin: "4px 0" }} />

              {isAdding ? (
                <form onSubmit={handleAddDirectory} className="add-dir-form" onClick={(e) => e.stopPropagation()}>
                  <div className="dir-form-tabs">
                    <button
                      type="button"
                      className={`tab-btn ${formType === "local" ? "active" : ""}`}
                      onClick={() => setFormType("local")}
                    >
                      Local
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${formType === "jellyfin" ? "active" : ""}`}
                      onClick={() => setFormType("jellyfin")}
                    >
                      Jellyfin
                    </button>
                  </div>

                  {formType === "local" ? (
                    <>
                      <input
                        type="text"
                        placeholder="Name (e.g., Chill Hits)"
                        value={newDirName}
                        onChange={(e) => setNewDirName(e.target.value)}
                        required
                        autoFocus
                      />
                      <div className="dir-path-picker-row" style={{ display: "flex", gap: "8px", width: "100%", marginBottom: "12px" }}>
                        <input
                          type="text"
                          placeholder="Path (e.g., D:/Media/Music)"
                          value={newDirPath}
                          onChange={(e) => setNewDirPath(e.target.value)}
                          required
                          style={{ flex: 1, marginBottom: 0 }}
                        />
                        <button
                          type="button"
                          className="btn-browse"
                          onClick={handleSelectLocalFolder}
                          style={{
                            padding: "0 14px",
                            backgroundColor: "#6c5ce7",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#5b4bc4"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "#6c5ce7"}
                        >
                          Browse...
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Server Name (e.g., Home Server)"
                        value={newDirName}
                        onChange={(e) => setNewDirName(e.target.value)}
                        required
                        autoFocus
                      />
                      <input
                        type="url"
                        placeholder="Server URL (e.g., http://localhost:8096)"
                        value={jellyfinUrl}
                        onChange={(e) => setJellyfinUrl(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Username"
                        value={jellyfinUsername}
                        onChange={(e) => setJellyfinUsername(e.target.value)}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password / API Key"
                        value={jellyfinPassword}
                        onChange={(e) => setJellyfinPassword(e.target.value)}
                      />
                    </>
                  )}

                  <div className="add-dir-actions">
                    <button type="submit" className="btn-save">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setIsAdding(false);
                        setNewDirName("");
                        setNewDirPath("");
                        setJellyfinUrl("");
                        setJellyfinUsername("");
                        setJellyfinPassword("");
                        setFormType("local");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button className="add-directory-btn" onClick={() => setIsAdding(true)}>
                  <Plus size={14} />
                  Add Directory
                </button>
              )}
            </div>
          )}
        </div>

        <button className="top-icon-btn" title="Create Playlist" onClick={handleCreatePlaylist}>
          <PlusSquare size={20} />
        </button>

        {/* Profile Dropdown Container */}
        <div className="profile-dropdown-container" ref={profileDropdownRef}>
          <button
            className="profile-avatar-btn"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            title="Profile Options"
          >
            {activeProfile?.avatar ? (
              <img src={activeProfile.avatar} alt={activeProfile.name} />
            ) : (
              <div className="profile-avatar-btn-fallback">
                {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </button>

          {isProfileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-user-info">
                {activeProfile?.avatar ? (
                  <img src={activeProfile.avatar} alt={activeProfile.name} />
                ) : (
                  <div className="profile-dropdown-user-fallback">
                    {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="profile-dropdown-details">
                  <span className="profile-dropdown-name">{activeProfile?.name || "User"}</span>
                </div>
              </div>

              <button className="profile-dropdown-item" onClick={() => { setIsProfileDropdownOpen(false); setIsEditProfileModalOpen(true); }}>
                <Edit size={14} />
                Edit Profile
              </button>

              <button className="profile-dropdown-item" onClick={handleSwitchProfile}>
                <LogOut size={14} />
                Switch Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditProfileModalOpen && (
        <div className="profile-modal-backdrop" onClick={() => setIsEditProfileModalOpen(false)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Edit Profile Details</h3>
              <button className="profile-modal-close" onClick={() => setIsEditProfileModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="profile-modal-body">
              {/* Profile Avatar Preview */}
              <div className="profile-avatar-preview-section">
                {editProfileAvatar ? (
                  <img src={editProfileAvatar} alt="Avatar Preview" className="profile-avatar-large-preview" />
                ) : (
                  <div className="profile-avatar-large-fallback">
                    {editProfileName ? editProfileName.charAt(0).toUpperCase() : <User size={40} />}
                  </div>
                )}
              </div>

              {/* Profile Name Field */}
              <div className="profile-modal-field">
                <label>Profile Name</label>
                <input 
                  type="text" 
                  value={editProfileName} 
                  className="modal-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="E.g. Nijanth"
                  maxLength={16}
                  autoFocus
                  required
                />
              </div>

              {/* Custom File Upload Field */}
              <div className="profile-modal-field">
                <label>Upload Custom File</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    id="topbar-profile-custom-file-input"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempProfileImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                      // Reset value to allow uploading the same file again if canceled
                      e.target.value = null;
                    }}
                  />
                  <label htmlFor="topbar-profile-custom-file-input" className="profile-custom-file-btn" style={{ margin: 0, display: "inline-flex", alignItems: "center" }}>
                    <Image size={14} style={{ marginRight: 6 }} />
                    Choose File
                  </label>
                  {editProfileAvatar && (
                    <button
                      type="button"
                      className="profile-modal-btn delete-avatar-btn"
                      onClick={() => setEditProfileAvatar("")}
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

            <div className="profile-modal-footer" style={{ justifyContent: allProfiles.length > 1 ? "space-between" : "flex-end" }}>
              {allProfiles.length > 1 && (
                <button className="profile-modal-btn delete-btn" style={{ backgroundColor: "#ff7675", color: "white" }} onClick={handleDeleteActiveProfile}>
                  Delete User
                </button>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button className="profile-modal-btn cancel" onClick={() => setIsEditProfileModalOpen(false)}>Cancel</button>
                <button 
                  className="profile-modal-btn save" 
                  onClick={handleSaveEditProfile}
                  disabled={!editProfileName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tempProfileImage && (
        <ImageCropperModal
          imageSrc={tempProfileImage}
          onCropComplete={(croppedBase64) => {
            setEditProfileAvatar(croppedBase64);
            setTempProfileImage(null);
          }}
          onClose={() => setTempProfileImage(null)}
        />
      )}
    </header>
  );
}
