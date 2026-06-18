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

export const getQueue = () => {
  const saved = readDataSync("music_queue");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

export const setQueue = (queue) => {
  writeDataSync("music_queue", JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("queueChanged", { detail: queue }));
};

export const addToQueue = (song) => {
  if (!song) return;
  const title = song.title || song.name;
  if (!title) return;

  const allSongsStr = readDataSync("music_songs");
  let allSongs = [];
  if (allSongsStr) {
    try {
      allSongs = JSON.parse(allSongsStr);
    } catch {}
  }

  const isAudioFile = (p) => {
    if (!p) return false;
    const lower = p.toLowerCase();
    return lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".flac") || lower.endsWith(".mp4");
  };

  const currentQueue = getQueue();
  let songsToAdd = [];

  if (isAudioFile(song.path)) {
    // Single song
    songsToAdd.push({
      id: song.id || Date.now() + Math.random(),
      title: title,
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      duration: song.duration || "3:00",
      image: song.image || "",
      path: song.path
    });
  } else {
    // Album or folder
    const folderPath = song.path ? song.path.toLowerCase().replace(/\\/g, '/') : "";
    const matchedSongs = song.path
      ? allSongs.filter(s => s.path && s.path.toLowerCase().replace(/\\/g, '/').startsWith(folderPath))
      : allSongs.filter(s => s.album && s.album.toLowerCase() === title.toLowerCase());

    if (matchedSongs.length > 0) {
      songsToAdd = matchedSongs.map(s => ({
        id: s.id || Date.now() + Math.random(),
        title: s.title,
        artist: s.artist || "Unknown Artist",
        album: s.album || "Unknown Album",
        duration: s.duration || "3:00",
        image: s.image || song.image || "",
        path: s.path
      }));
    } else {
      // Fallback
      songsToAdd.push({
        id: song.id || Date.now() + Math.random(),
        title: title,
        artist: song.artist || "Unknown Artist",
        album: song.album || "Unknown Album",
        duration: song.duration || "3:00",
        image: song.image || "",
        path: song.path || ""
      });
    }
  }

  let currentMax = currentQueue.length > 0 ? Math.max(...currentQueue.map(t => t.id)) : 0;
  const tracksWithUniqueIds = songsToAdd.map(track => ({
    ...track,
    id: ++currentMax
  }));

  const updatedQueue = [...currentQueue, ...tracksWithUniqueIds];
  setQueue(updatedQueue);
};


export const playTrack = (song, contextSongs = null) => {
  if (!song) return;
  const title = song.title || song.name;
  if (!title) return;

  const isAudioFile = (p) => {
    if (!p) return false;
    const lower = p.toLowerCase();
    return lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".flac") || lower.endsWith(".mp4");
  };

  if (isAudioFile(song.path)) {
    // Single song
    const current = {
      id: song.id || Date.now(),
      title: title,
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      duration: song.duration || "3:00",
      image: song.image || "",
      path: song.path,
      isLiked: isSongLiked(title)
    };
    
    setCurrentTrack(current);

    if (contextSongs && Array.isArray(contextSongs)) {
      const idx = contextSongs.findIndex(s => s.path === song.path);
      if (idx !== -1) {
        let currentMax = 0;
        const remaining = contextSongs.slice(idx + 1).map(s => ({
          id: ++currentMax,
          title: s.title || s.name,
          artist: s.artist || "Unknown Artist",
          album: s.album || "Unknown Album",
          duration: s.duration || "3:00",
          image: s.image || "",
          path: s.path
        }));
        setQueue(remaining);
      }
    }
  } else {
    // Container (Album or Folder)
    const allSongsStr = readDataSync("music_songs");
    let allSongs = [];
    if (allSongsStr) {
      try {
        allSongs = JSON.parse(allSongsStr);
      } catch {}
    }

    const folderPath = song.path ? song.path.toLowerCase().replace(/\\/g, '/') : "";
    const matchedSongs = song.path
      ? allSongs.filter(s => s.path && s.path.toLowerCase().replace(/\\/g, '/').startsWith(folderPath))
      : allSongs.filter(s => s.album && s.album.toLowerCase() === title.toLowerCase());

    if (matchedSongs.length > 0) {
      const first = matchedSongs[0];
      const current = {
        id: first.id || Date.now(),
        title: first.title,
        artist: first.artist || "Unknown Artist",
        album: first.album || "Unknown Album",
        duration: first.duration || "3:00",
        image: first.image || song.image || "",
        path: first.path,
        isLiked: isSongLiked(first.title)
      };
      
      setCurrentTrack(current);

      let currentMax = 0;
      const remaining = matchedSongs.slice(1).map(s => ({
        id: ++currentMax,
        title: s.title,
        artist: s.artist || "Unknown Artist",
        album: s.album || "Unknown Album",
        duration: s.duration || "3:00",
        image: s.image || song.image || "",
        path: s.path
      }));
      setQueue(remaining);
    } else {
      // Fallback
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
    }
  }
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
