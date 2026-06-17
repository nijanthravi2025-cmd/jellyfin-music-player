export const getLikedSongs = () => {
  const saved = localStorage.getItem("music_liked_songs");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  const initial = [
    {
      id: 3,
      title: "Midnight City",
      artist: "M83",
      album: "Hurry Up, We're Dreaming",
      duration: "4:03",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150",
      path: "C:/Users/NIJANTH/Downloads/Midnight City.wav"
    },
    {
      id: 4,
      title: "Strobe",
      artist: "deadmau5",
      album: "For Lack of a Better Name",
      duration: "10:37",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=150&h=150",
      path: "D:/Media/Audio/Electronic/Strobe.flac"
    }
  ];
  localStorage.setItem("music_liked_songs", JSON.stringify(initial));
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
      image: song.image || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150",
      path: song.path || ""
    };
    updated = [...liked, newLiked];
    isLiked = true;
  }
  
  localStorage.setItem("music_liked_songs", JSON.stringify(updated));
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
      image: song.image || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150",
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
    image: song.image || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150",
    path: song.path || "",
    isLiked: isSongLiked(title)
  };
  
  setCurrentTrack(current);
};

export const getCurrentTrack = () => {
  const saved = localStorage.getItem("music_current_track");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
};

export const setCurrentTrack = (track) => {
  if (track) {
    localStorage.setItem("music_current_track", JSON.stringify(track));
  } else {
    localStorage.removeItem("music_current_track");
  }
  window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: track }));
};

export const syncSongUpdateInPlaylists = (updatedSong) => {
  if (!updatedSong) return;
  const savedPlaylists = localStorage.getItem("music_playlists");
  if (!savedPlaylists) return;
  try {
    const playlistNames = JSON.parse(savedPlaylists);
    playlistNames.forEach(name => {
      const playlistSongsKey = `music_playlist_songs_${name}`;
      const savedSongs = localStorage.getItem(playlistSongsKey);
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
          localStorage.setItem(playlistSongsKey, JSON.stringify(updatedList));
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
  const savedPlaylists = localStorage.getItem("music_playlists");
  if (!savedPlaylists) return;
  try {
    const playlistNames = JSON.parse(savedPlaylists);
    playlistNames.forEach(name => {
      const playlistSongsKey = `music_playlist_songs_${name}`;
      const savedSongs = localStorage.getItem(playlistSongsKey);
      if (savedSongs) {
        const songsList = JSON.parse(savedSongs);
        const originalLength = songsList.length;
        const updatedList = songsList.filter(song => song.id !== songId);
        if (updatedList.length !== originalLength) {
          localStorage.setItem(playlistSongsKey, JSON.stringify(updatedList));
        }
      }
    });
    window.dispatchEvent(new CustomEvent("playlistsChanged"));
  } catch (e) {
    console.error("Error syncing song deletes from playlists", e);
  }
};

