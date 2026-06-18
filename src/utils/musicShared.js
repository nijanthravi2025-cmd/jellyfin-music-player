import { readDataSync, writeDataSync, removeDataSync } from './tauribridge';

export const getLikedSongs = () => {
  const saved = readDataSync("music_liked_songs");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  const initial = [];
  writeDataSync("music_liked_songs", JSON.stringify(initial));
  return initial;
};

export const isSongLiked = (title) => {
  if (!title) return false;
  const liked = getLikedSongs();
  return liked.some(s => s.title.toLowerCase() === title.toLowerCase());
};

export const toggleLikeSong = (song) => {
  if (!song) return false;
  const title = song.title || song.name;
  if (!title) return false;
  
  const liked = getLikedSongs();
  const index = liked.findIndex(s => s.title.toLowerCase() === title.toLowerCase());
  let updated;
  let isLiked = false;
  
  if (index >= 0) {
    updated = liked.filter((_, i) => i !== index);
    isLiked = false;
  } else {
    const newLiked = {
      id: song.id || Date.now(),
      title: title,
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      duration: song.duration || "3:00",
      image: song.image || "",
      path: song.path || ""
    };
    updated = [...liked, newLiked];
    isLiked = true;
  }
  
  writeDataSync("music_liked_songs", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updated }));
  
  // If we liked/unliked the currently playing song, we should update current track state too
  const current = getCurrentTrack();
  if (current && (current.title || current.name || "").toLowerCase() === title.toLowerCase()) {
    setCurrentTrack({ ...current, isLiked });
  }
  
  return isLiked;
};

export const addToQueue = (song) => {
  if (!song) return;
  const title = song.title || song.name;
  if (!title) return;

  const event = new CustomEvent("addToQueue", { 
    detail: {
      id: song.id || Date.now() + Math.random(),
      title: title,
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      duration: song.duration || "3:00",
      image: song.image || "",
      path: song.path || ""
    } 
  });
  window.dispatchEvent(event);
};

export const playTrack = (song) => {
  if (!song) return;
  const title = song.title || song.name;
  if (!title) return;

  const current = {
    id: song.id || Date.now(),
    title: title,
    artist: song.artist || "Unknown Artist",
    album: song.album || "Unknown Album",
    duration: song.duration || "3:00",
    image: song.image || "",
    path: song.path || "",
    isLiked: isSongLiked(title)
  };
  
  setCurrentTrack(current);
};

export const getCurrentTrack = () => {
  const saved = readDataSync("music_current_track");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
};

export const setCurrentTrack = (track) => {
  if (track) {
    writeDataSync("music_current_track", JSON.stringify(track));
  } else {
    removeDataSync("music_current_track");
  }
  window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: track }));
};

export const syncSongUpdateInPlaylists = (updatedSong) => {
  if (!updatedSong) return;
  const savedPlaylists = readDataSync("music_playlists");
  if (!savedPlaylists) return;
  try {
    const playlistNames = JSON.parse(savedPlaylists);
    playlistNames.forEach(name => {
      const playlistSongsKey = `music_playlist_songs_${name}`;
      const savedSongs = readDataSync(playlistSongsKey);
      if (savedSongs) {
        const songsList = JSON.parse(savedSongs);
        let changed = false;
        const updatedList = songsList.map(song => {
          if (song.id === updatedSong.id) {
            changed = true;
            return {
              ...song,
              title: updatedSong.title,
              artist: updatedSong.artist,
              album: updatedSong.album || "",
              image: updatedSong.image || "",
              duration: updatedSong.duration || "3:00",
              path: updatedSong.path || ""
            };
          }
          return song;
        });
        if (changed) {
          writeDataSync(playlistSongsKey, JSON.stringify(updatedList));
        }
      }
    });
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
  } catch (e) {
    console.error("Error syncing song updates to playlists", e);
  }
};

export const syncSongDeleteInPlaylists = (songId) => {
  if (!songId) return;
  const savedPlaylists = readDataSync("music_playlists");
  if (!savedPlaylists) return;
  try {
    const playlistNames = JSON.parse(savedPlaylists);
    playlistNames.forEach(name => {
      const playlistSongsKey = `music_playlist_songs_${name}`;
      const savedSongs = readDataSync(playlistSongsKey);
      if (savedSongs) {
        const songsList = JSON.parse(savedSongs);
        const originalLength = songsList.length;
        const updatedList = songsList.filter(song => song.id !== songId);
        if (updatedList.length !== originalLength) {
          writeDataSync(playlistSongsKey, JSON.stringify(updatedList));
        }
      }
    });
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
  } catch (e) {
    console.error("Error syncing song deletes from playlists", e);
  }
};
