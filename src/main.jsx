import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// LocalStorage overrides for profile-specific key routing
const originalGetItem = localStorage.getItem;
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.getItem = function (key) {
  if (key === "music_playlists" || key === "music_directories" || key.startsWith("music_playlist_songs_")) {
    const profileId = sessionStorage.getItem("music_current_profile_id");
    if (profileId) {
      return originalGetItem.call(localStorage, `${key}_${profileId}`);
    }
  }
  return originalGetItem.call(localStorage, key);
};

localStorage.setItem = function (key, value) {
  if (key === "music_playlists" || key === "music_directories" || key.startsWith("music_playlist_songs_")) {
    const profileId = sessionStorage.getItem("music_current_profile_id");
    if (profileId) {
      return originalSetItem.call(localStorage, `${key}_${profileId}`, value);
    }
  }
  return originalSetItem.call(localStorage, key, value);
};

localStorage.removeItem = function (key) {
  if (key === "music_playlists" || key === "music_directories" || key.startsWith("music_playlist_songs_")) {
    const profileId = sessionStorage.getItem("music_current_profile_id");
    if (profileId) {
      return originalRemoveItem.call(localStorage, `${key}_${profileId}`);
    }
  }
  return originalRemoveItem.call(localStorage, key);
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
