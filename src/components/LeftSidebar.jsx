import React, { useState } from "react";
import { NavLink } from "react-router-dom";
// Ensure Menu is imported here!
import {
  Home,
  Library,
  PlusSquare,
  Heart,
  Music,
  Folder,
  Plus,
  RefreshCw,
  Menu,
} from "lucide-react";
import "./Sidebars.css";

export default function LeftSidebar({ isOpen, toggleSidebar }) {
  const [localDirectories] = useState([
    { id: 1, name: "Downloads", path: "C:/Users/PC/Downloads" },
    { id: 2, name: "Music Library", path: "D:/Media/Music" },
    { id: 3, name: "Projects", path: "C:/Projects/Audio" },
    { id: 4, name: "Backup", path: "E:/Backups/Music" },
  ]);

  return (
    <aside className={`left-sidebar ${!isOpen ? "collapsed" : ""}`}>
      <div className="logo-container">
        {isOpen && <h2>MusicApp</h2>}
        {/* The Hamburger Menu is now safely INSIDE the sidebar! */}
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
          <Menu size={24} color="#a0a0a0" />
        </button>
      </div>

      <div className="sidebar-section-header">
        <span className="nav-label">Main</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Home size={24} />
          <span className="nav-label">Home</span>
          <div className="sidebar-tooltip">Home</div>
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Library size={24} />
          <span className="nav-label">Your Library</span>
          <div className="sidebar-tooltip">Your Library</div>
        </NavLink>

        <button className="nav-item">
          <PlusSquare size={24} />
          <span className="nav-label">Create Playlist</span>
          <div className="sidebar-tooltip">Create Playlist</div>
        </button>
        <button className="nav-item">
          <Heart size={24} />
          <span className="nav-label">Liked Songs</span>
          <div className="sidebar-tooltip">Liked Songs</div>
        </button>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-section-header">
        <span className="nav-label">Directories</span>
      </div>

      <nav className="sidebar-nav directories-list">
        {localDirectories.map((dir) => (
          <button key={dir.id} className="nav-item" title={dir.path}>
            <Folder size={24} />
            <span className="nav-label">{dir.name}</span>
            <div className="sidebar-tooltip">{dir.name}</div>
          </button>
        ))}
      </nav>

      <div className="sidebar-actions directory-pills">
        <button className="action-pill-btn">
          <Plus size={20} />
          <span className="nav-label">Add Directory</span>
          <div className="sidebar-tooltip">Add Directory</div>
        </button>
        <button className="action-pill-btn">
          <RefreshCw size={20} />
          <span className="nav-label">Refresh</span>
          <div className="sidebar-tooltip">Refresh</div>
        </button>
      </div>
    </aside>
  );
}
