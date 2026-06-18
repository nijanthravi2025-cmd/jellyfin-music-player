import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { getCurrentTrack, toggleLikeSong, playTrack, getQueue, setQueue } from "../utils/musicShared";
import { getAssetUrl, isTauri, readDataSync } from "../utils/tauribridge";
import RightQueue from "./RightQueue";
import ImageWithFallback from "./ImageWithFallback";

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

  // Real audio playback state
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState(null);


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
      const newTrack = e.detail;
      setCurrentTrack(prev => {
        if (prev && newTrack && prev.path === newTrack.path) {
          // Metadata update only (e.g. liked/unliked) - preserve current playing state
          return newTrack;
        }
        if (newTrack) {
          setIsPlaying(true);
          setAudioError(null);
        }
        return newTrack;
      });
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

  // ── Real Audio Playback ──────────────────────────────────────────────────

  // Load and play audio when the current track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const path = currentTrack.path;
    if (path) {
      const url = getAssetUrl(path);
      // Only reload if the source actually changed
      if (audio.src !== url) {
        audio.src = url;
        audio.load();
      }
      audio.play().catch(err => {
        console.warn("Audio play failed:", err);
        setAudioError("Could not play file");
      });
    }
  }, [currentTrack?.path]);

  // Sync play/pause state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume and mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  const getAllSongs = useCallback(() => {
    const saved = readDataSync("music_songs");
    let allSongs = [];
    if (saved) {
      try { allSongs = JSON.parse(saved); } catch(e) {}
    }
    return allSongs;
  }, []);

  const handleSkipNext = useCallback((autoTrigger = false) => {
    const currentQueue = getQueue();
    if (currentQueue && currentQueue.length > 0) {
      if (isShuffle) {
        const randomIdx = Math.floor(Math.random() * currentQueue.length);
        const nextTrack = currentQueue[randomIdx];
        const updatedQueue = currentQueue.filter((_, idx) => idx !== randomIdx);
        setQueue(updatedQueue);
        playTrack(nextTrack);
      } else {
        const nextTrack = currentQueue[0];
        const updatedQueue = currentQueue.slice(1);
        setQueue(updatedQueue);
        playTrack(nextTrack);
      }
      return;
    }

    const allSongs = getAllSongs();
    if (allSongs.length === 0) return;

    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * allSongs.length);
      playTrack(allSongs[randomIdx]);
      return;
    }

    if (currentTrack) {
      const idx = allSongs.findIndex(s => s.title.toLowerCase() === currentTrack.title.toLowerCase());
      if (idx === -1) {
        playTrack(allSongs[0]);
        return;
      }

      if (idx === allSongs.length - 1) {
        // Last song in the list
        if (autoTrigger && repeatMode === "off") {
          // If automatically triggered and repeat is off, stop playing at the end of the queue
          const audio = audioRef.current;
          if (audio) audio.currentTime = 0;
          setIsPlaying(false);
        } else {
          // Wrap around if manually skipped or repeat is infinite
          playTrack(allSongs[0]);
        }
      } else {
        playTrack(allSongs[idx + 1]);
      }
    } else {
      playTrack(allSongs[0]);
    }
  }, [currentTrack, isShuffle, repeatMode, getAllSongs, getQueue, setQueue]);

  const handleSkipPrev = useCallback(() => {
    // If we're more than 3 seconds in, restart the current track
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const allSongs = getAllSongs();
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * allSongs.length);
      playTrack(allSongs[randomIdx]);
      return;
    }
    if (currentTrack) {
      const idx = allSongs.findIndex(s => s.title.toLowerCase() === currentTrack.title.toLowerCase());
      const prevIdx = (idx - 1 + allSongs.length) % allSongs.length;
      playTrack(allSongs[prevIdx]);
    } else if (allSongs.length > 0) {
      playTrack(allSongs[allSongs.length - 1]);
    }
  }, [currentTrack, isShuffle, getAllSongs]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeatMode === "once") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleSkipNext(true); // Pass true to indicate automatic song end
      }
    };
    const onError = () => {
      if (audio.src && audio.src !== window.location.href) {
        setAudioError("File not found or unsupported format");
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [repeatMode, handleSkipNext]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keypresses if the user is typing in inputs or contenteditable fields
      const activeEl = document.activeElement;
      if (
        activeEl && (
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable
        )
      ) {
        return;
      }

      const audio = audioRef.current;

      switch (e.key.toLowerCase()) {
        case "escape":
          setIsFullScreen(false);
          break;
        case " ": // Spacebar
          e.preventDefault(); // Prevent default page scrolling
          togglePlay();
          break;
        case "arrowleft":
          if (audio) {
            e.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - 5);
          }
          break;
        case "arrowright":
          if (audio) {
            e.preventDefault();
            audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
          }
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(prev => {
            const nextVolume = Math.max(0, Math.min(1, prev + 0.05));
            if (nextVolume > 0) setIsMuted(false);
            return nextVolume;
          });
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(prev => Math.max(0, Math.min(1, prev - 0.05)));
          break;
        case "m":
          setIsMuted(prev => !prev);
          break;
        case "n":
          handleSkipNext();
          break;
        case "p":
          handleSkipPrev();
          break;
        case "l":
          if (currentTrack) {
            toggleLikeSong(currentTrack);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTrack, handleSkipNext, handleSkipPrev, togglePlay, setIsFullScreen]);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (currentTrack) {
      toggleLikeSong(currentTrack);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audio.currentTime = pct * duration;
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setVolume(pct);
    if (pct > 0 && isMuted) setIsMuted(false);
  };

  // Format seconds to M:SS
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden audio element for real playback */}
      <audio ref={audioRef} preload="auto" />

      <div className={`dock-container ${isVisible ? "is-visible" : "is-hidden"}`} style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <div className="content">
          {/* 1. Track Info */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button 
              className="icon-wrapper" 
              style={{ display: "flex", alignItems: "center" }}
              onClick={() => setIsFullScreen(true)}
              title="Open Fullscreen Player"
            >
              <div style={{ width: "24px", height: "24px", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageWithFallback 
                  src={currentTrack?.image} 
                  alt={currentTrack?.title || "Music"} 
                  style={{ width: "24px", height: "24px" }} 
                  size={14}
                />
              </div>
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
          <div className="dock-volume-container">
            <button className="icon-wrapper" onClick={toggleMute} style={{ padding: 0 }} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? (
                <VolumeX className="icons" color="#a0a0a0" size={20} />
              ) : (
                <Volume2 className="icons" color="white" size={20} />
              )}
            </button>
            <div className="dock-volume-slider-wrapper">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume} 
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="dock-volume-slider"
              />
            </div>
          </div>

          {/* NEW QUEUE BUTTON */}
          <button className="icon-wrapper" onClick={toggleQueue}>
            <ListMusic className="icons" color="white" size={20} />
            <span className="tooltip">Queue</span>
          </button>
        </div>

        <div className="dock-progress-row">
          <span className="dock-time-label left">{formatTime(currentTime)}</span>
          <div className="dock-progress-bar-wrapper" onClick={handleSeek}>
            <div className="dock-progress-bg">
              <div className="dock-progress-fill" style={{ width: `${progressPct}%` }}>
                <div className="dock-progress-dot"></div>
              </div>
            </div>
          </div>
          <span className="dock-time-label right">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Full-Screen Player Overlay */}
      <div className={`fullscreen-overlay ${isFullScreen ? "active" : ""}`} onClick={() => setIsFullScreen(false)}>
        {/* Ambient background glow */}
        <div 
          className="fullscreen-ambient-glow" 
          style={{
            backgroundImage: currentTrack?.image ? `url(${getAssetUrl(currentTrack.image)})` : "none"
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
              <ImageWithFallback 
                src={currentTrack?.image} 
                alt={currentTrack?.title || "Music"} 
                className="fullscreen-album-art" 
                fallbackClassName="fullscreen-placeholder-art"
                size={120}
              />
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
              <div className="fullscreen-progress-bar-wrapper" onClick={handleSeek}>
                <div className="fullscreen-progress-bar">
                  <div className="fullscreen-progress-fill" style={{ width: `${progressPct}%` }}>
                    <div className="fullscreen-progress-dot"></div>
                  </div>
                </div>
              </div>
              <div className="fullscreen-time-info">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Audio error indicator */}
            {audioError && (
              <div style={{ 
                color: "#ff6b6b", 
                fontSize: "12px", 
                textAlign: "center", 
                marginTop: "8px",
                opacity: 0.8 
              }}>
                {audioError}
              </div>
            )}
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
