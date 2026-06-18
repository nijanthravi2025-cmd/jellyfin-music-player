import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, Heart, Clock, MoreVertical, Edit3, Trash2, FolderPlus, Check, X, Clipboard, Music, Disc, Users, ListMusic, Image } from "lucide-react";
import { toggleLikeSong, isSongLiked, addToQueue, playTrack } from "../utils/musicShared";
import "./Home.css"; // Reuse card-grid and card layouts
import "./Songs.css"; // Reuse table styling and toast banners
import "./Artists.css"; // Reuse artists-grid layout styling
import { readDataSync, writeDataSync } from '../utils/tauribridge';

// Shared database of all mock songs in the app
const INITIAL_SEARCH_SONGS = [];
const INITIAL_SEARCH_ALBUMS = [];
const INITIAL_SEARCH_ARTISTS = [];

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [songs, setSongs] = useState(() => {
    const saved = readDataSync("music_songs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [albums, setAlbums] = useState(() => {
    const saved = readDataSync("music_albums");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [artists, setArtists] = useState(() => {
    const saved = readDataSync("music_artists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Listen to library scan updates
  useEffect(() => {
    const handleLibraryChange = () => {
      const savedSongs = readDataSync("music_songs");
      if (savedSongs) {
        try { setSongs(JSON.parse(savedSongs)); } catch (e) {}
      } else {
        setSongs([]);
      }
      const savedAlbums = readDataSync("music_albums");
      if (savedAlbums) {
        try { setAlbums(JSON.parse(savedAlbums)); } catch (e) {}
      } else {
        setAlbums([]);
      }
      const savedArtists = readDataSync("music_artists");
      if (savedArtists) {
        try { setArtists(JSON.parse(savedArtists)); } catch (e) {}
      } else {
        setArtists([]);
      }
    };
    window.addEventListener("songsChanged", handleLibraryChange);
    window.addEventListener("albumsChanged", handleLibraryChange);
    window.addEventListener("artistsChanged", handleLibraryChange);
    return () => {
      window.removeEventListener("songsChanged", handleLibraryChange);
      window.removeEventListener("albumsChanged", handleLibraryChange);
      window.removeEventListener("artistsChanged", handleLibraryChange);
    };
  }, []);
  const [playlists, setPlaylists] = useState([]);
  
  const [activeMenuId, setActiveMenuId] = useState(null); // format: 'song-ID', 'album-ID', 'artist-ID', 'top-...'
  
  // Rename Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [renameType, setRenameType] = useState(""); // "song", "album", "artist"
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");

  // Cover Modal States
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverItem, setCoverItem] = useState(null);
  const [coverType, setCoverType] = useState(""); // "song", "album"
  const [editImage, setEditImage] = useState("");

  const [toast, setToast] = useState("");
  
  const activeMenuRef = useRef(null);

  // Load playlists from localStorage
  useEffect(() => {
    const loadPlaylistsList = () => {
      const saved = readDataSync("music_playlists");
      if (saved) {
        try {
          setPlaylists(JSON.parse(saved));
        } catch (e) {
          setPlaylists([]);
        }
      } else {
        const defaultPL = [];
        writeDataSync("music_playlists", JSON.stringify(defaultPL));
        setPlaylists(defaultPL);
      }
    };
    
    loadPlaylistsList();
    window.addEventListener("playlistsChanged", loadPlaylistsList);
    return () => window.removeEventListener("playlistsChanged", loadPlaylistsList);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeMenuRef.current && !activeMenuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [likedListVersion, setLikedListVersion] = useState(0);

  // Listen to liked songs changed event to trigger re-renders
  useEffect(() => {
    const handleLikesChange = () => {
      setLikedListVersion(prev => prev + 1);
    };
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => window.removeEventListener("likedSongsChanged", handleLikesChange);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const handleRenameClick = (item, type) => {
    setRenameItem(item);
    setRenameType(type);
    setEditTitle(item.title || item.name || "");
    setEditArtist(item.artist || "");
    setEditAlbum(item.album || "");
    setIsRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (!renameItem || !editTitle.trim()) return;
    const trimmedTitle = editTitle.trim();
    const trimmedArtist = editArtist.trim();
    const trimmedAlbum = editAlbum.trim();
    
    let changes = [];
    if (renameType === "song") {
      const oldVal = songs.find(s => s.id === renameItem.id);
      if (oldVal) {
        if (oldVal.title !== trimmedTitle) changes.push(`Song name changed to "${trimmedTitle}"`);
        if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
        if (oldVal.album !== trimmedAlbum) changes.push(`Album name changed to "${trimmedAlbum}"`);
      }
      
      const updatedSongs = songs.map(song => song.id === renameItem.id ? { 
        ...song, 
        title: trimmedTitle,
        artist: trimmedArtist,
        album: trimmedAlbum
      } : song);
      setSongs(updatedSongs);
      writeDataSync("music_songs", JSON.stringify(updatedSongs));

      // Sync liked songs list if renamed
      const savedLiked = readDataSync("music_liked_songs");
      if (savedLiked) {
        try {
          const likedList = JSON.parse(savedLiked);
          const updatedLiked = likedList.map(song => song.title.toLowerCase() === renameItem.title.toLowerCase() ? {
            ...song,
            title: trimmedTitle,
            artist: trimmedArtist,
            album: trimmedAlbum
          } : song);
          writeDataSync("music_liked_songs", JSON.stringify(updatedLiked));
          window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
        } catch (e) {}
      }

      // Sync current playing track metadata if renamed
      const savedCurrent = readDataSync("music_current_track");
      if (savedCurrent) {
        try {
          const currentTrack = JSON.parse(savedCurrent);
          if (currentTrack.title.toLowerCase() === renameItem.title.toLowerCase()) {
            const updatedTrack = { 
              ...currentTrack, 
              title: trimmedTitle,
              artist: trimmedArtist,
              album: trimmedAlbum
            };
            writeDataSync("music_current_track", JSON.stringify(updatedTrack));
            window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
          }
        } catch (e) {}
      }
    } else if (renameType === "album") {
      const oldVal = albums.find(al => al.id === renameItem.id);
      if (oldVal) {
        if (oldVal.title !== trimmedTitle) changes.push(`Album name changed to "${trimmedTitle}"`);
        if (oldVal.artist !== trimmedArtist) changes.push(`Artist name changed to "${trimmedArtist}"`);
      }
      
      const updatedAlbums = albums.map(album => album.id === renameItem.id ? { 
        ...album, 
        title: trimmedTitle,
        artist: trimmedArtist
      } : album);
      setAlbums(updatedAlbums);
      writeDataSync("music_albums", JSON.stringify(updatedAlbums));
    } else if (renameType === "artist") {
      const oldVal = artists.find(art => art.id === renameItem.id);
      if (oldVal && oldVal.name !== trimmedTitle) {
        changes.push(`Artist name changed to "${trimmedTitle}"`);
      }
      
      const updatedArtists = artists.map(artist => artist.id === renameItem.id ? { 
        ...artist, 
        name: trimmedTitle
      } : artist);
      setArtists(updatedArtists);
      writeDataSync("music_artists", JSON.stringify(updatedArtists));

      // Also update any tracks references!
      const savedSongs = readDataSync("music_songs");
      if (savedSongs) {
        try {
          const parsedSongs = JSON.parse(savedSongs);
          const updatedSongs = parsedSongs.map(s => s.artist.toLowerCase() === renameItem.name.toLowerCase() ? {
            ...s,
            artist: trimmedTitle
          } : s);
          writeDataSync("music_songs", JSON.stringify(updatedSongs));
          window.dispatchEvent(new CustomEvent("songsChanged"));
        } catch (e) {}
      }
    }
    
    setIsRenameModalOpen(false);
    setRenameItem(null);
    
    if (changes.length > 0) {
      showToast(changes.join(", "));
    } else {
      showToast("No details were changed.");
    }
  };

  const handleChangeCoverClick = (item, type) => {
    setCoverItem(item);
    setCoverType(type);
    setEditImage(item.image || "");
    setIsCoverModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveCover = () => {
    if (!coverItem) return;
    const newImage = editImage.trim();

    if (coverType === "song") {
      const updatedSongs = songs.map(song => song.id === coverItem.id ? { ...song, image: newImage } : song);
      setSongs(updatedSongs);
      writeDataSync("music_songs", JSON.stringify(updatedSongs));

      // Sync liked songs list if updated
      const savedLiked = readDataSync("music_liked_songs");
      if (savedLiked) {
        try {
          const likedList = JSON.parse(savedLiked);
          const updatedLiked = likedList.map(song => song.title.toLowerCase() === coverItem.title.toLowerCase() ? {
            ...song,
            image: newImage
          } : song);
          writeDataSync("music_liked_songs", JSON.stringify(updatedLiked));
          window.dispatchEvent(new CustomEvent("likedSongsChanged", { detail: updatedLiked }));
        } catch (e) {}
      }
    } else if (coverType === "album") {
      const updatedAlbums = albums.map(album => album.id === coverItem.id ? { ...album, image: newImage } : album);
      setAlbums(updatedAlbums);
      writeDataSync("music_albums", JSON.stringify(updatedAlbums));
    }

    // Sync current playing track metadata if updated
    const savedCurrent = readDataSync("music_current_track");
    if (savedCurrent) {
      try {
        const currentTrack = JSON.parse(savedCurrent);
        if (currentTrack.title.toLowerCase() === coverItem.title?.toLowerCase() || 
            (currentTrack.album && currentTrack.album.toLowerCase() === coverItem.title?.toLowerCase())) {
          const updatedTrack = { ...currentTrack, image: newImage };
          writeDataSync("music_current_track", JSON.stringify(updatedTrack));
          window.dispatchEvent(new CustomEvent("currentTrackChanged", { detail: updatedTrack }));
        }
      } catch (e) {}
    }

    setIsCoverModalOpen(false);
    setCoverItem(null);
    showToast("Album cover updated.");
  };

  const handleDeleteItem = (id, type) => {
    if (type === "song") {
      const updatedSongs = songs.filter(song => song.id !== id);
      setSongs(updatedSongs);
      writeDataSync("music_songs", JSON.stringify(updatedSongs));
      showToast("Song removed from results.");
    } else if (type === "album") {
      const updatedAlbums = albums.filter(album => album.id !== id);
      setAlbums(updatedAlbums);
      writeDataSync("music_albums", JSON.stringify(updatedAlbums));
      showToast("Album removed from results.");
    } else if (type === "artist") {
      const updatedArtists = artists.filter(artist => artist.id !== id);
      setArtists(updatedArtists);
      writeDataSync("music_artists", JSON.stringify(updatedArtists));
      showToast("Artist removed from results.");
    }
    setActiveMenuId(null);
  };

  const handleAddToPlaylist = (item, playlistName) => {
    setActiveMenuId(null);
    let allSongs = [];
    const savedSongs = readDataSync("music_songs");
    if (savedSongs) {
      try { allSongs = JSON.parse(savedSongs); } catch (e) {}
    }

    let songsToAdd = [];
    if (typeof item === "string") {
      const found = allSongs.find(s => s.title.toLowerCase() === item.toLowerCase());
      if (found) songsToAdd.push(found);
    } else if (item && item.duration) {
      songsToAdd.push(item);
    } else if (item) {
      const albumTracks = allSongs.filter(s => s.album.toLowerCase() === item.title.toLowerCase());
      songsToAdd.push(...albumTracks);
    }

    if (songsToAdd.length === 0) {
      showToast(`No tracks found to add.`);
      return;
    }

    const saved = readDataSync(`music_playlist_songs_${playlistName}`);
    let playlistSongs = [];
    if (saved) {
      try { playlistSongs = JSON.parse(saved); } catch (e) {}
    }

    let addedCount = 0;
    const nextSongs = [...playlistSongs];
    songsToAdd.forEach(song => {
      if (!nextSongs.some(s => s.id === song.id)) {
        nextSongs.push(song);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      showToast(`Tracks are already in "${playlistName}"`);
      return;
    }

    writeDataSync(`music_playlist_songs_${playlistName}`, JSON.stringify(nextSongs));
    window.dispatchEvent(new CustomEvent("playlistsChanged"));

    if (typeof item === "object" && !item.duration) {
      showToast(`Added ${addedCount} tracks from "${item.title}" to "${playlistName}"`);
    } else {
      showToast(`Added "${songsToAdd[0].title}" to "${playlistName}"`);
    }
  };

  const handleCreatePlaylist = (item) => {
    setActiveMenuId(null);
    let preselectedSong = null;
    if (item && item.duration) {
      preselectedSong = item;
    } else if (typeof item === "string") {
      let allSongs = [];
      const savedSongs = readDataSync("music_songs");
      if (savedSongs) {
        try { allSongs = JSON.parse(savedSongs); } catch (e) {}
      }
      preselectedSong = allSongs.find(s => s.title.toLowerCase() === item.toLowerCase()) || null;
    }

    window.dispatchEvent(new CustomEvent("open-create-playlist-modal", {
      detail: { song: preselectedSong }
    }));
  };

  const handleViewLocation = (path) => {
    setActiveMenuId(null);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path);
      showToast(`Copied to clipboard: ${path}`);
    } else {
      showToast(`Location: ${path}`);
    }
  };

  const handleViewArtistLocation = (artistName) => {
    setActiveMenuId(null);
    const path = `C:/Users/NIJANTH/Music/Artists/${artistName.replace(/\s+/g, "_")}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path);
      showToast(`Copied artist folder: ${path}`);
    } else {
      showToast(`Location: ${path}`);
    }
  };

  // Filter matching items
  const normalizedQuery = query.toLowerCase().trim();
  const matchingSongs = normalizedQuery
    ? songs.filter(
        (song) =>
          song.title.toLowerCase().includes(normalizedQuery) ||
          song.artist.toLowerCase().includes(normalizedQuery) ||
          song.album.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const matchingAlbums = normalizedQuery
    ? albums.filter(
        (album) =>
          album.title.toLowerCase().includes(normalizedQuery) ||
          album.artist.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const matchingArtists = normalizedQuery
    ? artists.filter(
        (artist) =>
          artist.name.toLowerCase().includes(normalizedQuery) ||
          artist.genre.toLowerCase().includes(normalizedQuery)
      )
    : [];

  // Calculate Top Match
  let topMatch = null;
  if (normalizedQuery) {
    const exactArtist = artists.find(a => a.name.toLowerCase() === normalizedQuery);
    const exactSong = songs.find(s => s.title.toLowerCase() === normalizedQuery);
    const exactAlbum = albums.find(al => al.title.toLowerCase() === normalizedQuery);
    
    if (exactArtist) topMatch = { type: "artist", item: exactArtist };
    else if (exactSong) topMatch = { type: "song", item: exactSong };
    else if (exactAlbum) topMatch = { type: "album", item: exactAlbum };
    
    if (!topMatch) {
      const startsArtist = artists.find(a => a.name.toLowerCase().startsWith(normalizedQuery));
      const startsSong = songs.find(s => s.title.toLowerCase().startsWith(normalizedQuery));
      const startsAlbum = albums.find(al => al.title.toLowerCase().startsWith(normalizedQuery));
      
      if (startsArtist) topMatch = { type: "artist", item: startsArtist };
      else if (startsSong) topMatch = { type: "song", item: startsSong };
      else if (startsAlbum) topMatch = { type: "album", item: startsAlbum };
    }
    
    if (!topMatch) {
      const containsArtist = artists.find(a => a.name.toLowerCase().includes(normalizedQuery));
      const containsSong = songs.find(s => s.title.toLowerCase().includes(normalizedQuery));
      const containsAlbum = albums.find(al => al.title.toLowerCase().includes(normalizedQuery));
      
      if (containsArtist) topMatch = { type: "artist", item: containsArtist };
      else if (containsSong) topMatch = { type: "song", item: containsSong };
      else if (containsAlbum) topMatch = { type: "album", item: containsAlbum };
    }
  }

  return (
    <div className="songs-page-container">
      {toast && <div className="toast-banner">{toast}</div>}

      <div className="songs-header-row" style={{ borderBottom: "1px solid #222", paddingBottom: "16px" }}>
        <div>
          <h2 className="section-header" style={{ margin: 0 }}>Search</h2>
          <p style={{ color: "#a0a0a0", fontSize: "14px", margin: "4px 0 0 0" }}>
            {query ? `Search results for "${query}"` : "Find your favorite songs, albums, and artists."}
          </p>
        </div>
      </div>

      {!query ? (
        <div style={{ textAlign: "center", padding: "64px 16px", color: "#a0a0a0" }}>
          <Music size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <h3>Type in the search bar above to start searching.</h3>
        </div>
      ) : matchingSongs.length === 0 && matchingAlbums.length === 0 && matchingArtists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 16px", color: "#a0a0a0" }}>
          <X size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <h3>No results found for "{query}".</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "24px" }}>
          
          {/* 1. TOP MATCH SECTION (PREFERENCE TO MATCH) */}
          {topMatch && (
            <div>
              <h3 className="section-header" style={{ fontSize: "18px", color: "white", marginBottom: "12px" }}>Top Match</h3>
              <div 
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "12px",
                  width: "280px",
                  position: "relative",
                  cursor: topMatch.type !== "artist" ? "pointer" : "default"
                }}
                onClick={() => {
                  if (topMatch.type !== "artist") {
                    playTrack(topMatch.item);
                    showToast(`Playing "${topMatch.item.title}"`);
                  }
                }}
              >
                {topMatch.item.image ? (
                  <img 
                    src={topMatch.item.image} 
                    alt={topMatch.item.title || topMatch.item.name} 
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: topMatch.type === "artist" ? "50%" : "6px",
                      objectFit: "cover",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: topMatch.type === "artist" ? "50%" : "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#6c5ce7"
                    }}
                  >
                    {topMatch.type === "artist" ? topMatch.item.name.charAt(0).toUpperCase() : <Music size={40} color="#a0a0a0" />}
                  </div>
                )}
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <h2 
                      style={{ 
                        fontSize: "20px", 
                        fontWeight: "800", 
                        margin: 0, 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap", 
                        flex: 1, 
                        color: "white" 
                      }}
                      title={topMatch.item.title || topMatch.item.name}
                    >
                      {topMatch.item.title || topMatch.item.name}
                    </h2>
                    
                    <div className="menu-wrapper" ref={activeMenuId === `top-${topMatch.item.id}` ? activeMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === `top-${topMatch.item.id}` ? null : `top-${topMatch.item.id}`);
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "none",
                          color: "#a0a0a0",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === `top-${topMatch.item.id}` && (
                        <div 
                          className="context-menu" 
                          style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="context-menu-item" onClick={() => handleRenameClick(topMatch.item, topMatch.type)}>
                            <Edit3 size={14} />
                            Rename
                          </button>
                          {(topMatch.type === "song" || topMatch.type === "album") && (
                            <button className="context-menu-item" onClick={() => handleChangeCoverClick(topMatch.item, topMatch.type)}>
                              <Image size={14} />
                              Change Album Cover
                            </button>
                          )}
                          <button className="context-menu-item" onClick={() => handleDeleteItem(topMatch.item.id, topMatch.type)}>
                            <Trash2 size={14} />
                            Delete
                          </button>
                          {topMatch.type !== "artist" ? (
                            <button className="context-menu-item" onClick={() => handleViewLocation(topMatch.item.path)}>
                              <Clipboard size={14} />
                              View Location
                            </button>
                          ) : (
                            <button className="context-menu-item" onClick={() => handleViewArtistLocation(topMatch.item.name)}>
                              <Clipboard size={14} />
                              View Location
                            </button>
                          )}
                          {topMatch.type !== "artist" && (
                             <button 
                               className="context-menu-item" 
                               onClick={() => {
                                 addToQueue(topMatch.item);
                                 setActiveMenuId(null);
                                 showToast(`Added "${topMatch.item.title}" to queue.`);
                               }}
                             >
                               <ListMusic size={14} />
                               Add to Queue
                             </button>
                           )}
                          {topMatch.type !== "artist" && (
                            <div className="context-menu-item">
                              <FolderPlus size={14} />
                              Add to Playlist
                              <div className="context-submenu" style={{ bottom: 0, top: "auto" }}>
                                <button
                                  className="context-menu-item"
                                  style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                                  onClick={() => handleCreatePlaylist(topMatch.item.title)}
                                >
                                  + Create Playlist
                                </button>
                                {playlists.map((pl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    className="context-menu-item"
                                    onClick={() => handleAddToPlaylist(topMatch.item.title, pl)}
                                  >
                                    {pl}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span 
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      backgroundColor: "rgba(108, 92, 231, 0.2)",
                      color: "#9c8df6",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      display: "inline-block",
                      marginTop: "6px"
                    }}
                  >
                    {topMatch.type}
                  </span>
                  
                  {topMatch.type !== "artist" && (
                    <p style={{ color: "#a0a0a0", fontSize: "13px", margin: "4px 0 0 0" }}>
                      Artist: {topMatch.item.artist}
                    </p>
                  )}
                  {topMatch.type === "artist" && (
                    <p style={{ color: "#a0a0a0", fontSize: "13px", margin: "4px 0 0 0" }}>
                      {topMatch.item.genre}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. SONGS SECTION */}
          {matchingSongs.length > 0 && (
            <div>
              <h3 className="section-header" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Music size={18} color="#6c5ce7" />
                Songs
              </h3>
              <table className="songs-table">
                <thead>
                  <tr>
                    <th className="song-index">#</th>
                    <th>Title</th>
                    <th>Album</th>
                    <th style={{ width: "100px" }}><Clock size={16} /></th>
                    <th className="song-actions-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {matchingSongs.map((song, idx) => {
                    const menuKey = `song-${song.id}`;
                    return (
                      <tr 
                        key={song.id} 
                        className="song-row"
                        onClick={() => {
                          playTrack(song);
                          showToast(`Playing "${song.title}"`);
                        }}
                      >
                        <td className="song-index">{idx + 1}</td>
                        <td>
                          <div className="song-info-col">
                            {song.image ? (
                              <img src={song.image} alt={song.title} className="song-thumbnail" />
                            ) : (
                              <div className="song-thumbnail" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>
                                <Music size={16} color="#a0a0a0" />
                              </div>
                            )}
                            <div className="song-details">
                              <span className="song-name">{song.title}</span>
                              <span className="song-artist">{song.artist}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="song-album-col">{song.album}</span>
                        </td>
                        <td>
                          <span className="song-duration-col">{song.duration}</span>
                        </td>
                        <td className="song-actions-col">
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                            <button 
                              className="row-action-btn" 
                              title={isSongLiked(song.title) ? "Unlike" : "Like"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeSong(song);
                              }}
                              style={{
                                opacity: isSongLiked(song.title) ? 1 : undefined,
                                color: isSongLiked(song.title) ? "#6c5ce7" : undefined
                              }}
                            >
                              <Heart size={16} fill={isSongLiked(song.title) ? "#6c5ce7" : "none"} />
                            </button>
                            <div className="menu-wrapper" ref={activeMenuId === menuKey ? activeMenuRef : null}>
                              <button
                                className="row-action-btn"
                                title="Options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === menuKey ? null : menuKey);
                                }}
                                style={{ opacity: activeMenuId === menuKey ? 1 : undefined }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === menuKey && (
                                <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                                  <button className="context-menu-item" onClick={() => handleRenameClick(song, "song")}>
                                    <Edit3 size={14} />
                                    Rename
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleChangeCoverClick(song, "song")}>
                                    <Image size={14} />
                                    Change Album Cover
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleDeleteItem(song.id, "song")}>
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                  <button className="context-menu-item" onClick={() => handleViewLocation(song.path)}>
                                    <Clipboard size={14} />
                                    View Location
                                  </button>
                                  <button 
                                    className="context-menu-item" 
                                    onClick={() => {
                                      addToQueue(song);
                                      setActiveMenuId(null);
                                      showToast(`Added "${song.title}" to queue.`);
                                    }}
                                  >
                                    <ListMusic size={14} />
                                    Add to Queue
                                  </button>
                                  <div className="context-menu-item">
                                    <FolderPlus size={14} />
                                    Add to Playlist
                                    <div className="context-submenu">
                                      <button
                                        className="context-menu-item"
                                        style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                                        onClick={() => handleCreatePlaylist(song)}
                                      >
                                        + Create Playlist
                                      </button>
                                      {playlists.map((pl, pIdx) => (
                                        <button
                                          key={pIdx}
                                          className="context-menu-item"
                                          onClick={() => handleAddToPlaylist(song, pl)}
                                        >
                                          {pl}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. ALBUMS SECTION */}
          {matchingAlbums.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3 className="section-header" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Disc size={18} color="#6c5ce7" />
                Albums
              </h3>
              <div className="card-grid">
                {matchingAlbums.map((album) => {
                  const menuKey = `album-${album.id}`;
                  return (
                    <div key={album.id} className="album-card" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                      <div className="card-image-container">
                        {album.image ? (
                          <img src={album.image} alt={album.title} className="card-image" />
                        ) : (
                          <div className="card-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", height: "100%" }}>
                            <Music size={48} color="#a0a0a0" />
                          </div>
                        )}
                        <button className="card-play-btn">
                          <Play size={24} fill="currentColor" className="play-icon-nudge" />
                        </button>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                        <h4 className="card-title" style={{ margin: 0, flex: 1 }}>{album.title}</h4>
                        <div className="menu-wrapper" ref={activeMenuId === menuKey ? activeMenuRef : null}>
                          <button
                            className="album-menu-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === menuKey ? null : menuKey);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#a0a0a0",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeMenuId === menuKey && (
                            <div 
                              className="context-menu" 
                              style={{ right: 0, bottom: "100%", top: "auto", marginBottom: "8px" }} 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="context-menu-item" onClick={() => handleRenameClick(album, "album")}>
                                <Edit3 size={14} />
                                Rename
                              </button>
                              <button className="context-menu-item" onClick={() => handleChangeCoverClick(album, "album")}>
                                <Image size={14} />
                                Change Album Cover
                              </button>
                              <button className="context-menu-item" onClick={() => handleDeleteItem(album.id, "album")}>
                                  <Trash2 size={14} />
                                  Delete
                              </button>
                              <button className="context-menu-item" onClick={() => handleViewLocation(album.path)}>
                                <Clipboard size={14} />
                                View Location
                              </button>
                              <div className="context-menu-item">
                                <FolderPlus size={14} />
                                Add to Playlist
                                <div className="context-submenu" style={{ bottom: 0, top: "auto" }}>
                                  <button
                                    className="context-menu-item"
                                    style={{ fontWeight: "bold", borderBottom: "1px solid #333", color: "#6c5ce7" }}
                                    onClick={() => handleCreatePlaylist(album.title)}
                                  >
                                    + Create Playlist
                                  </button>
                                  {playlists.map((pl, pIdx) => (
                                    <button
                                      key={pIdx}
                                      className="context-menu-item"
                                      onClick={() => handleAddToPlaylist(album.title, pl)}
                                    >
                                      {pl}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="card-artist" style={{ marginTop: "4px" }}>{album.artist} • {album.year}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. ARTISTS SECTION */}
          {matchingArtists.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3 className="section-header" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Users size={18} color="#6c5ce7" />
                Artists
              </h3>
              <div className="artists-grid">
                {matchingArtists.map((artist) => {
                  const menuKey = `artist-${artist.id}`;
                  return (
                    <div key={artist.id} className="artist-card" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                      <div className="artist-avatar-container">
                        {artist.image ? (
                          <img src={artist.image} alt={artist.name} className="artist-avatar" />
                        ) : (
                          <div className="artist-avatar-fallback" style={{ fontSize: "32px" }}>
                            {artist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", width: "100%", marginTop: "8px" }}>
                        <h4 className="artist-name" style={{ margin: 0 }}>{artist.name}</h4>
                        <div className="menu-wrapper" ref={activeMenuId === menuKey ? activeMenuRef : null}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === menuKey ? null : menuKey);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#a0a0a0",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Options"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {activeMenuId === menuKey && (
                            <div 
                              className="context-menu" 
                              style={{ right: "50%", transform: "translateX(50%)", bottom: "100%", top: "auto", marginBottom: "8px" }} 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="context-menu-item" onClick={() => handleRenameClick(artist, "artist")}>
                                <Edit3 size={14} />
                                Rename
                              </button>
                              <button className="context-menu-item" onClick={() => handleDeleteItem(artist.id, "artist")}>
                                <Trash2 size={14} />
                                Delete
                              </button>
                              <button className="context-menu-item" onClick={() => handleViewArtistLocation(artist.name)}>
                                <Clipboard size={14} />
                                View Location
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="artist-type" style={{ marginTop: "4px" }}>{artist.type} • {artist.genre}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENAME POPUP MODAL DIALOG */}
      {isRenameModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRenameModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename Details</h3>
              <button className="close-btn" onClick={() => setIsRenameModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">
                  {renameType === "artist" ? "Artist Name" : renameType === "album" ? "Album Name" : "Song Name"}
                </label>
                <input
                  type="text"
                  className="modal-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
              {renameType !== "artist" && (
                <div className="modal-field">
                  <label className="modal-label">Artist Name</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                  />
                </div>
              )}
              {renameType === "song" && (
                <div className="modal-field">
                  <label className="modal-label">Album Name</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveRename}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE COVER POPUP MODAL DIALOG */}
      {isCoverModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCoverModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Album Cover</h3>
              <button className="close-btn" onClick={() => setIsCoverModalOpen(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                <label className="modal-label" style={{ marginBottom: "8px" }}>Preview</label>
                {editImage ? (
                  <img 
                    src={editImage} 
                    alt="Preview" 
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                  />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <Music size={40} color="#a0a0a0" />
                  </div>
                )}
              </div>
              <div className="modal-field" style={{ marginTop: "12px" }}>
                <label className="modal-label">Upload Local Image</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                    id="album-cover-file-input"
                  />
                  <label 
                    htmlFor="album-cover-file-input" 
                    className="modal-btn" 
                    style={{ 
                      display: "inline-block", 
                      padding: "8px 16px", 
                      backgroundColor: "rgba(255,255,255,0.08)", 
                      borderRadius: "6px", 
                      cursor: "pointer", 
                      textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.15)"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.08)"}
                  >
                    Choose File
                  </label>
                  {editImage && (
                    <button
                      type="button"
                      className="modal-btn delete-cover-btn"
                      onClick={() => setEditImage("")}
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
                      Delete Cover
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setIsCoverModalOpen(false)}>Cancel</button>
              <button className="modal-btn save" onClick={handleSaveCover}>Save Image</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
