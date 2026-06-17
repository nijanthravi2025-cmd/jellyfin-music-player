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
  const [allProfiles, setAllProfiles] = useState([]);

  const [directories, setDirectories] = useState(() => {
    const saved = localStorage.getItem("music_directories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default if parse fails
      }
    }
    return [
      { id: "1", name: "Downloads", path: "C:/Users/NIJANTH/Downloads" },
      { id: "2", name: "Music Library", path: "C:/Users/NIJANTH/Music" },
      { id: "3", name: "Music Pixel", path: "C:/Users/NIJANTH/Downloads/Web dev/Pixel Player/Music Pixel" },
    ];
  });

  // Load profile data on mount
  // Load profile data on mount
  useEffect(() => {
    const profileId = sessionStorage.getItem("music_current_profile_id");
    const savedProfiles = localStorage.getItem("music_profiles");

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

    const savedProfiles = localStorage.getItem("music_profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        const updated = parsed.map(p => p.id === activeProfile.id ? { ...p, name, avatar } : p);
        localStorage.setItem("music_profiles", JSON.stringify(updated));
        
        setActiveProfile({ ...activeProfile, name, avatar });
      } catch (e) {}
    }
    setIsEditProfileModalOpen(false);
    window.location.reload(); // Reload to refresh headers & profile listings
  };

  const handleDeleteActiveProfile = () => {
    if (!activeProfile) return;
    const savedProfiles = localStorage.getItem("music_profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        if (parsed.length <= 1) {
          alert("You must keep at least one profile!");
          return;
        }

        if (window.confirm("Are you sure you want to delete your current profile? All playlists and folders will be deleted permanently.")) {
          const updated = parsed.filter(p => p.id !== activeProfile.id);
          localStorage.setItem("music_profiles", JSON.stringify(updated));

          // Clean local storage keys associated with the profile
          localStorage.removeItem("music_playlists_" + activeProfile.id);
          localStorage.removeItem("music_directories_" + activeProfile.id);

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
    localStorage.setItem("music_directories", JSON.stringify(directories));
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

  const handleRefresh = (e) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToast("");
    setTimeout(() => {
      setIsRefreshing(false);
      const hasJellyfin = directories.some(d => d.type === "jellyfin");
      if (hasJellyfin) {
        setToast("Directories & Jellyfin library scanned successfully!");
      } else {
        setToast("Directories scanned successfully!");
      }
      setTimeout(() => setToast(""), 3000);
    }, 800);
  };

  const handleAddDirectory = (e) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    if (formType === "local") {
      if (!newDirPath.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: newDirPath.trim(),
        type: "local"
      };
      setDirectories([...directories, newDir]);
      setNewDirName("");
      setNewDirPath("");
      setIsAdding(false);
      setToast("Directory added successfully!");
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
      setDirectories([...directories, newDir]);
      setNewDirName("");
      setJellyfinUrl("");
      setJellyfinUsername("");
      setJellyfinPassword("");
      setFormType("local");
      setIsAdding(false);
      setToast("Jellyfin server connected successfully!");
    }
    setTimeout(() => setToast(""), 3000);
  };

  const handleDeleteDirectory = (id, e) => {
    e.stopPropagation();
    setDirectories(directories.filter((d) => d.id !== id));
    setToast("Directory removed.");
    setTimeout(() => setToast(""), 3000);
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
                      <input
                        type="text"
                        placeholder="Path (e.g., D:/Media/Music)"
                        value={newDirPath}
                        onChange={(e) => setNewDirPath(e.target.value)}
                        required
                      />
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

      {/* EDIT PROFILE MODAL DIALOG */}
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
                          setEditProfileAvatar(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
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
    </header>
  );
}
