import React, { useState, useEffect } from "react";
import TopBar from "./TopBar"; // <-- Imported TopBar
import RightQueue from "./RightQueue";
import FloatingDock from "./FloatingDock";
import ProfileSelect from "./ProfileSelect";
import CreatePlaylistModal from "./CreatePlaylistModal";
import "./Layout.css";

const Layout = ({ children }) => {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeProfile, setActiveProfile] = useState(() => {
    return sessionStorage.getItem("music_current_profile_id") || null;
  });

  useEffect(() => {
    const handleShowToast = (e) => {
      setToastMessage(e.detail);
      const timer = setTimeout(() => {
        setToastMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    };
    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  const handleToggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  const handleSelectProfile = (id) => {
    sessionStorage.setItem("music_current_profile_id", id);
    setActiveProfile(id);
    window.location.reload(); // Refresh the app to reload profile specific states
  };

  if (!activeProfile) {
    return <ProfileSelect onSelectProfile={handleSelectProfile} />;
  }

  return (
    <div className="app-layout">
      {/* 1. The New Top Navigation */}
      <TopBar />

      {/* 2. The Workspace (Holds the Grid and the Queue side-by-side) */}
      <div className="workspace">
        <main className="main-content">
          <div className="page-content">{children}</div>
        </main>

        <RightQueue isOpen={isQueueOpen} onClose={handleToggleQueue} />
      </div>

      {/* 3. The Dock */}
      <FloatingDock toggleQueue={handleToggleQueue} isQueueOpen={isQueueOpen} />

      {/* 4. Global Modals & Toast Banners */}
      <CreatePlaylistModal />
      {toastMessage && <div className="global-toast-banner">{toastMessage}</div>}
    </div>
  );
};

export default Layout;

