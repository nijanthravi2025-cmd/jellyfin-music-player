import React, { useState, useEffect } from "react";
import {
  Music,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Heart,
  ChevronDown,
} from "lucide-react";
import "./FloatingDock.css";
import { getCurrentTrack, toggleLikeSong, playTrack } from "../utils/musicShared";
import RightQueue from "./RightQueue";

// Accept toggleQueue and isQueueOpen as props from Layout
export default function FloatingDock({ toggleQueue, isQueueOpen }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // "off", "infinite", "once"
  const [currentTrack, setCurrentTrack] = useState(() => getCurrentTrack());
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === "off") return "once";
      if (prev === "once") return "infinite";
      return "off";
    });
  };

  const getRepeatTooltip = () => {
    if (repeatMode === "infinite") return "Repeat Infinite";
    if (repeatMode === "once") return "Repeat Once";
    return "Repeat";
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleTrackChange = (e) => {
      setCurrentTrack(e.detail);
      if (e.detail) {
        setIsPlaying(true);
      }
    };
    const handleLikesChange = (e) => {
      setCurrentTrack(prev => {
        if (!prev) return null;
        const likedList = e.detail || [];
        const isLiked = likedList.some(s => s.title.toLowerCase() === prev.title.toLowerCase());
        return { ...prev, isLiked };
      });
    };
    window.addEventListener("currentTrackChanged", handleTrackChange);
    window.addEventListener("likedSongsChanged", handleLikesChange);
    return () => {
      window.removeEventListener("currentTrackChanged", handleTrackChange);
      window.removeEventListener("likedSongsChanged", handleLikesChange);
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (currentTrack) {
      toggleLikeSong(currentTrack);
    }
  };

  const handleSkipNext = () => {
    const saved = localStorage.getItem("music_songs");
    let allSongs = [];
    if (saved) {
      try { allSongs = JSON.parse(saved); } catch(e) {}
    }
    if (allSongs.length === 0) {
      allSongs = [
        { id: 1, title: "After Hours", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/After Hours.mp3", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150" },
        { id: 2, title: "Blinding Lights", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/Blinding Lights.mp3", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150" },
        { id: 3, title: "Midnight City", artist: "M83", path: "C:/Users/NIJANTH/Downloads/Midnight City.wav", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150" }
      ];
    }
    if (currentTrack) {
      const idx = allSongs.findIndex(s => s.title.toLowerCase() === currentTrack.title.toLowerCase());
      const nextIdx = (idx + 1) % allSongs.length;
      playTrack(allSongs[nextIdx]);
    } else if (allSongs.length > 0) {
      playTrack(allSongs[0]);
    }
  };

  const handleSkipPrev = () => {
    const saved = localStorage.getItem("music_songs");
    let allSongs = [];
    if (saved) {
      try { allSongs = JSON.parse(saved); } catch(e) {}
    }
    if (allSongs.length === 0) {
      allSongs = [
        { id: 1, title: "After Hours", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/After Hours.mp3", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150" },
        { id: 2, title: "Blinding Lights", artist: "The Weeknd", path: "C:/Users/NIJANTH/Music/Blinding Lights.mp3", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150&h=150" },
        { id: 3, title: "Midnight City", artist: "M83", path: "C:/Users/NIJANTH/Downloads/Midnight City.wav", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150" }
      ];
    }
    if (currentTrack) {
      const idx = allSongs.findIndex(s => s.title.toLowerCase() === currentTrack.title.toLowerCase());
      const prevIdx = (idx - 1 + allSongs.length) % allSongs.length;
      playTrack(allSongs[prevIdx]);
    } else if (allSongs.length > 0) {
      playTrack(allSongs[allSongs.length - 1]);
    }
  };

  return (
    <>
      <div className={`dock-container ${isVisible ? "is-visible" : "is-hidden"}`}>
        <div className="content">
          {/* 1. Track Info */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button 
              className="icon-wrapper" 
              style={{ display: "flex", alignItems: "center" }}
              onClick={() => setIsFullScreen(true)}
              title="Open Fullscreen Player"
            >
              {currentTrack?.image ? (
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.title} 
                  style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} 
                />
              ) : (
                <Music className="icons" color="white" size={24} />
              )}
              <div className="tooltip track-tooltip">
                <span className="track-title">{currentTrack ? currentTrack.title : "Not Playing"}</span>
                <span className="track-subtitle">{currentTrack ? currentTrack.artist : "Select a track"}</span>
              </div>
            </button>
          </div>
          
          <button 
            className="icon-wrapper" 
            onClick={handleLikeClick}
            disabled={!currentTrack}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "4px", 
              opacity: currentTrack ? 1 : 0.3, 
              cursor: currentTrack ? "pointer" : "default" 
            }}
            title={currentTrack ? (currentTrack.isLiked ? "Unlike" : "Like") : "Like"}
          >
            <Heart 
              className="icons" 
              color={currentTrack?.isLiked ? "#6c5ce7" : "#a0a0a0"} 
              fill={currentTrack?.isLiked ? "#6c5ce7" : "none"} 
              size={18} 
            />
            <span className="tooltip">{currentTrack ? (currentTrack.isLiked ? "Unlike" : "Like") : "Like"}</span>
          </button>

          <div className="dock-separator"></div>

          {/* 2. Playback Controls */}
          <button className="icon-wrapper" onClick={toggleShuffle} title={isShuffle ? "Shuffle On" : "Shuffle Off"}>
            <Shuffle className="icons" color={isShuffle ? "#8c7ae6" : "#a0a0a0"} size={20} />
            <span className="tooltip">{isShuffle ? "Shuffle On" : "Shuffle"}</span>
          </button>

          <button className="icon-wrapper" onClick={handleSkipPrev} title="Previous">
            <SkipBack
              className="icons"
              color="white"
              size={24}
              fill="currentColor"
            />
            <span className="tooltip">Previous</span>
          </button>

          <button className="icon-wrapper" onClick={togglePlay}>
            {isPlaying ? (
              <Pause
                className="icons play-btn"
                color="#8c7ae6"
                size={28}
                fill="currentColor"
              />
            ) : (
              <Play
                className="icons play-btn play-nudge"
                color="#8c7ae6"
                size={28}
                fill="currentColor"
              />
            )}
            <span className="tooltip">{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button className="icon-wrapper" onClick={handleSkipNext} title="Next">
            <SkipForward
              className="icons"
              color="white"
              size={24}
              fill="currentColor"
            />
            <span className="tooltip">Next</span>
          </button>

          <button className="icon-wrapper" onClick={toggleRepeat} title={getRepeatTooltip()}>
            {repeatMode === "once" ? (
              <Repeat1 className="icons" color="#8c7ae6" size={20} />
            ) : (
              <Repeat className="icons" color={repeatMode === "infinite" ? "#8c7ae6" : "#a0a0a0"} size={20} />
            )}
            <span className="tooltip">{getRepeatTooltip()}</span>
          </button>

          <div className="dock-separator"></div>

          {/* 3. Volume & Queue Control */}
          <button className="icon-wrapper" onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="icons" color="#a0a0a0" size={20} />
            ) : (
              <Volume2 className="icons" color="white" size={20} />
            )}
            <span className="tooltip">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* NEW QUEUE BUTTON */}
          <button className="icon-wrapper" onClick={toggleQueue}>
            <ListMusic className="icons" color="white" size={20} />
            <span className="tooltip">Queue</span>
          </button>
        </div>

        <div className="mini-progress-container">
          <div className="mini-progress-fill"></div>
        </div>
      </div>

      {/* Full-Screen Player Overlay */}
      <div className={`fullscreen-overlay ${isFullScreen ? "active" : ""}`} onClick={() => setIsFullScreen(false)}>
        {/* Ambient background glow */}
        <div 
          className="fullscreen-ambient-glow" 
          style={{
            backgroundImage: currentTrack?.image ? `url(${currentTrack.image})` : "none"
          }}
        ></div>
        
        <div className="fullscreen-layout-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="fullscreen-content">
            {/* Header area with close button */}
            <div className="fullscreen-header">
              <button className="fullscreen-close-btn" onClick={() => setIsFullScreen(false)} title="Close Player">
                <ChevronDown size={32} color="white" />
              </button>
              <span className="fullscreen-header-title">Now Playing</span>
              <div style={{ width: 32 }}></div>
            </div>

            {/* Large Album Art with expansion container */}
            <div className="fullscreen-art-container">
              {currentTrack?.image ? (
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.title} 
                  className="fullscreen-album-art" 
                />
              ) : (
                <div className="fullscreen-placeholder-art">
                  <Music size={120} color="#a0a0a0" />
                </div>
              )}
            </div>

            {/* Metadata Block: Title, Artist, Heart (Like) button */}
            <div className="fullscreen-metadata">
              <div className="fullscreen-info">
                <h2 className="fullscreen-title">{currentTrack ? currentTrack.title : "Not Playing"}</h2>
                <p className="fullscreen-artist">{currentTrack ? currentTrack.artist : "Select a track"}</p>
              </div>
              <button 
                className="fullscreen-like-btn" 
                onClick={handleLikeClick}
                disabled={!currentTrack}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  opacity: currentTrack ? 1 : 0.3, 
                  cursor: currentTrack ? "pointer" : "default" 
                }}
                title={currentTrack ? (currentTrack.isLiked ? "Unlike" : "Like") : "Like"}
              >
                <Heart 
                  color={currentTrack?.isLiked ? "#8c7ae6" : "#a0a0a0"} 
                  fill={currentTrack?.isLiked ? "#8c7ae6" : "none"} 
                  size={28} 
                />
              </button>
            </div>

            {/* Playback Controls Section */}
            <div className="fullscreen-controls">
              <button className="fullscreen-control-btn" onClick={toggleShuffle} title={isShuffle ? "Shuffle On" : "Shuffle Off"}>
                <Shuffle className="icons" color={isShuffle ? "#8c7ae6" : "#a0a0a0"} size={22} />
              </button>

              <button className="fullscreen-control-btn" onClick={handleSkipPrev} title="Previous">
                <SkipBack className="icons" color="white" size={28} fill="currentColor" />
              </button>

              <button className="fullscreen-control-btn play-pause-wrapper" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? (
                  <Pause className="icons play-btn" color="#8c7ae6" size={40} fill="currentColor" />
                ) : (
                  <Play className="icons play-btn play-nudge" color="#8c7ae6" size={40} fill="currentColor" />
                )}
              </button>

              <button className="fullscreen-control-btn" onClick={handleSkipNext} title="Next">
                <SkipForward className="icons" color="white" size={28} fill="currentColor" />
              </button>

              <button className="fullscreen-control-btn" onClick={toggleRepeat} title={getRepeatTooltip()}>
                {repeatMode === "once" ? (
                  <Repeat1 className="icons" color="#8c7ae6" size={22} />
                ) : (
                  <Repeat className="icons" color={repeatMode === "infinite" ? "#8c7ae6" : "#a0a0a0"} size={22} />
                )}
              </button>

              <button className="fullscreen-control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? (
                  <VolumeX className="icons" color="#8c7ae6" size={22} />
                ) : (
                  <Volume2 className="icons" color="white" size={22} />
                )}
              </button>

              <button className="fullscreen-control-btn" onClick={toggleQueue} title="Queue">
                <ListMusic className="icons" color={isQueueOpen ? "#8c7ae6" : "white"} size={22} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="fullscreen-progress-container">
              <div className="fullscreen-progress-bar">
                <div className="fullscreen-progress-fill"></div>
              </div>
              <div className="fullscreen-time-info">
                <span>0:45</span>
                <span>3:30</span>
              </div>
            </div>
          </div>
          {isQueueOpen && (
            <div className="fullscreen-queue-sidebar">
              <RightQueue isOpen={true} onClose={toggleQueue} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
