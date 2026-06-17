import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, User, Image, Music } from "lucide-react";
import "./ProfileSelect.css";

export default function ProfileSelect({ onSelectProfile }) {
  const [profiles, setProfiles] = useState([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create", "edit"
  const [editingProfile, setEditingProfile] = useState(null);
  
  // Fields
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  // Load profiles from localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem("music_profiles");

    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        initDefaultProfile();
      }
    } else {
      initDefaultProfile();
    }
  }, []);

  const initDefaultProfile = () => {
    const initial = [
      {
        id: "profile_default",
        name: "Default Profile",
        avatar: ""
      }
    ];
    localStorage.setItem("music_profiles", JSON.stringify(initial));
    setProfiles(initial);
  };

  const saveProfilesToStorage = (updatedList) => {
    localStorage.setItem("music_profiles", JSON.stringify(updatedList));
    setProfiles(updatedList);
  };

  const handleOpenCreateModal = () => {
    setModalType("create");
    setEditingProfile(null);
    setProfileName("");
    setProfileAvatar("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, profile) => {
    e.stopPropagation(); // Avoid selecting the profile
    setModalType("edit");
    setEditingProfile(profile);
    setProfileName(profile.name);
    setProfileAvatar(profile.avatar);
    setIsModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    const name = profileName.trim();
    const avatar = profileAvatar.trim();

    if (modalType === "create") {
      const newProfile = {
        id: "profile_" + Date.now(),
        name,
        avatar
      };
      const newList = [...profiles, newProfile];
      saveProfilesToStorage(newList);
    } else if (modalType === "edit" && editingProfile) {
      const newList = profiles.map(p => 
        p.id === editingProfile.id ? { ...p, name, avatar } : p
      );
      saveProfilesToStorage(newList);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProfile = (e, profileId) => {
    e.stopPropagation(); // Avoid selecting
    if (profiles.length <= 1) {
      alert("You must keep at least one profile!");
      return;
    }

    if (window.confirm("Are you sure you want to delete this profile? All associated playlists and folders will be deleted permanently.")) {
      const newList = profiles.filter(p => p.id !== profileId);
      saveProfilesToStorage(newList);

      // Clean local storage keys associated with the profile
      localStorage.removeItem("music_playlists_" + profileId);
      localStorage.removeItem("music_directories_" + profileId);
    }
  };

  return (
    <div className="profile-select-container">
      <div className="profile-select-wrapper">
        <div className="profile-select-header">
          <div className="profile-app-logo">
            <Music size={40} color="#6c5ce7" />
            <h1>MusicApp</h1>
          </div>
          <h2>Who is listening?</h2>
          <p className="profile-no-login-badge">
            Local Profile System • No login or internet required
          </p>
        </div>

        <div className="profiles-grid">
          {profiles.map((profile) => {
            return (
              <div 
                key={profile.id} 
                className="profile-card"
                onClick={() => onSelectProfile(profile.id)}
              >
                <div className="profile-avatar-wrapper">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-fallback">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="profile-card-name">{profile.name}</span>

                <div className="profile-card-hover-actions">
                  <button 
                    className="profile-action-circle-btn"
                    title="Edit profile"
                    onClick={(e) => handleOpenEditModal(e, profile)}
                  >
                    <Edit size={13} />
                  </button>
                  {profiles.length > 1 && (
                    <button 
                      className="profile-action-circle-btn delete-btn"
                      title="Delete profile"
                      onClick={(e) => handleDeleteProfile(e, profile.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="profile-card create-profile-card" onClick={handleOpenCreateModal}>
            <div className="profile-avatar-wrapper add-avatar-circle">
              <Plus size={40} color="#a0a0a0" />
            </div>
            <span className="profile-card-name" style={{ color: "#a0a0a0" }}>Add Profile</span>
          </div>
        </div>
      </div>

      {/* CREATE & EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="profile-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>{modalType === "create" ? "Create Profile" : "Edit Profile Details"}</h3>
              <button className="profile-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="profile-modal-body">
              {/* Profile Avatar Preview */}
              <div className="profile-avatar-preview-section">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Avatar Preview" className="profile-avatar-large-preview" />
                ) : (
                  <div className="profile-avatar-large-fallback">
                    {profileName ? profileName.charAt(0).toUpperCase() : <User size={40} />}
                  </div>
                )}
              </div>

              {/* Profile Name Field */}
              <div className="profile-modal-field">
                <label>Profile Name</label>
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
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
                    id="profile-custom-file-input"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileAvatar(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="profile-custom-file-input" className="profile-custom-file-btn" style={{ margin: 0, display: "inline-flex", alignItems: "center" }}>
                    <Image size={14} style={{ marginRight: 6 }} />
                    Choose File
                  </label>
                  {profileAvatar && (
                    <button
                      type="button"
                      className="profile-modal-btn delete-avatar-btn"
                      onClick={() => setProfileAvatar("")}
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

            <div className="profile-modal-footer" style={{ justifyContent: modalType === "edit" && profiles.length > 1 ? "space-between" : "flex-end" }}>
              {modalType === "edit" && profiles.length > 1 && (
                <button 
                  className="profile-modal-btn delete-btn" 
                  style={{ backgroundColor: "#ff7675", color: "white" }} 
                  onClick={(e) => {
                    handleDeleteProfile(e, editingProfile.id);
                  }}
                >
                  Delete User
                </button>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button className="profile-modal-btn cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button 
                  className="profile-modal-btn save" 
                  onClick={handleSaveProfile}
                  disabled={!profileName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
