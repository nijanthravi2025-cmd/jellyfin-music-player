const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'TopBar.jsx');
let content = fs.readFileSync(file, 'utf-8');

// Normalize line endings to LF for replacement
const hasCRLF = content.includes('\r\n');
if (hasCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

// Replacement 1: Directories fallback
const target1 = `    return [
      { id: "1", name: "Downloads", path: "C:/Users/NIJANTH/Downloads" },
      { id: "2", name: "Music Library", path: "C:/Users/NIJANTH/Music" },
      { id: "3", name: "Music Pixel", path: "C:/Users/NIJANTH/Downloads/Web dev/Pixel Player/Music Pixel" },
    ];`;
const replacement1 = `    return [];`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log("Replaced target1 successfully!");
} else {
  console.error("Could not find target1!");
}

// Replacement 2: Handlers
const target2 = `  const handleRefresh = (e) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToast("");
    setTimeout(() => {
      setIsRefreshing(false);
      const hasJellyfin = directories.some(d => d.type === "jellyfin");
      if (hasJellyfin) {
        setToast("Directories & Jellyfin library scanned successfully!");
      } else {
        setToast("Directories scanned successfully!");
      }
      setTimeout(() => setToast(""), 3000);
    }, 800);
  };

  const handleAddDirectory = (e) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    if (formType === "local") {
      if (!newDirPath.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: newDirPath.trim(),
        type: "local"
      };
      setDirectories([...directories, newDir]);
      setNewDirName("");
      setNewDirPath("");
      setIsAdding(false);
      setToast("Directory added successfully!");
    } else {
      if (!jellyfinUrl.trim() || !jellyfinUsername.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: jellyfinUrl.trim(),
        type: "jellyfin",
        url: jellyfinUrl.trim(),
        username: jellyfinUsername.trim(),
        password: jellyfinPassword.trim(),
        connected: true
      };
      setDirectories([...directories, newDir]);
      setNewDirName("");
      setJellyfinUrl("");
      setJellyfinUsername("");
      setJellyfinPassword("");
      setFormType("local");
      setIsAdding(false);
      setToast("Jellyfin server connected successfully!");
    }
    setTimeout(() => setToast(""), 3000);
  };

  const handleDeleteDirectory = (id, e) => {
    e.stopPropagation();
    setDirectories(directories.filter((d) => d.id !== id));
    setToast("Directory removed.");
    setTimeout(() => setToast(""), 3000);
  };`;

const replacement2 = `  const triggerScan = async (targetDirs) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToast("Scanning library directories...");

    try {
      const { scanMusicDirectory, getAudioMetadata } = await import("../utils/tauribridge");
      let allScannedSongs = [];

      for (const dir of targetDirs) {
        if (dir.type === "jellyfin") continue;
        try {
          const files = await scanMusicDirectory(dir.path);
          for (const file of files) {
            try {
              const metadata = await getAudioMetadata(file.path);
              if (metadata) {
                allScannedSongs.push({
                  id: file.path,
                  title: metadata.title || file.filename,
                  artist: metadata.artist || "Unknown Artist",
                  album: metadata.album || "Unknown Album",
                  duration: metadata.duration_formatted || "0:00",
                  duration_secs: metadata.duration_secs || 0,
                  image: metadata.cover_art_base64 || "",
                  path: file.path
                });
              }
            } catch (err) {
              console.error("Failed to parse metadata for file:", file.path, err);
            }
          }
        } catch (err) {
          console.error("Failed to scan directory path:", dir.path, err);
        }
      }

      // Save songs
      writeDataSync("music_songs", JSON.stringify(allScannedSongs));

      // Derive albums
      const albumMap = {};
      allScannedSongs.forEach(song => {
        const albumName = song.album || "Unknown Album";
        const albumKey = \`\${albumName.toLowerCase()}::\${(song.artist || "").toLowerCase()}\`;
        if (!albumMap[albumKey]) {
          albumMap[albumKey] = {
            id: albumKey,
            title: albumName,
            artist: song.artist || "Unknown Artist",
            year: "Unknown",
            image: song.image || "",
            path: song.path.substring(0, song.path.lastIndexOf("/"))
          };
        } else if (!albumMap[albumKey].image && song.image) {
          albumMap[albumKey].image = song.image;
        }
      });
      const albums = Object.values(albumMap);
      writeDataSync("music_albums", JSON.stringify(albums));

      // Derive artists
      const artistMap = {};
      allScannedSongs.forEach(song => {
        const artistName = song.artist || "Unknown Artist";
        const artistKey = artistName.toLowerCase();
        if (!artistMap[artistKey]) {
          artistMap[artistKey] = {
            id: artistKey,
            name: artistName,
            genre: "Unknown",
            followers: "0",
            image: song.image || "",
            tracks: []
          };
        } else if (!artistMap[artistKey].image && song.image) {
          artistMap[artistKey].image = song.image;
        }
        artistMap[artistKey].tracks.push({
          id: song.id,
          title: song.title,
          album: song.album || "Unknown Album",
          duration: song.duration,
          path: song.path
        });
      });
      const artists = Object.values(artistMap);
      writeDataSync("music_artists", JSON.stringify(artists));

      // Also derive drive albums for the Home page
      const driveMap = {};
      allScannedSongs.forEach(song => {
        const folderPath = song.path.substring(0, song.path.lastIndexOf("/"));
        const folderName = folderPath.substring(folderPath.lastIndexOf("/") + 1);
        if (!driveMap[folderPath]) {
          driveMap[folderPath] = {
            id: folderPath,
            title: folderName || "Music Folder",
            artist: song.artist || "Unknown Artist",
            image: song.image || "",
            path: folderPath,
            dateAdded: "Scanned folder",
            timestamp: Date.now()
          };
        } else if (!driveMap[folderPath].image && song.image) {
          driveMap[folderPath].image = song.image;
        }
      });
      const driveAlbums = Object.values(driveMap);
      writeDataSync("music_drive_albums", JSON.stringify(driveAlbums));

      // Dispatch change events
      window.dispatchEvent(new CustomEvent("songsChanged"));
      window.dispatchEvent(new CustomEvent("albumsChanged"));
      window.dispatchEvent(new CustomEvent("artistsChanged"));

      setToast(\`Scanned successfully! Found \${allScannedSongs.length} songs.\`);
    } catch (e) {
      console.error("Refresh scan failed:", e);
      setToast("Scan failed!");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    triggerScan(directories);
  };

  const handleAddDirectory = (e) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    let updatedDirs = [...directories];
    if (formType === "local") {
      if (!newDirPath.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: newDirPath.trim(),
        type: "local"
      };
      updatedDirs = [...directories, newDir];
      setDirectories(updatedDirs);
      setNewDirName("");
      setNewDirPath("");
      setIsAdding(false);
      setToast("Directory added! Scanning folder...");
    } else {
      if (!jellyfinUrl.trim() || !jellyfinUsername.trim()) return;
      const newDir = {
        id: Date.now().toString(),
        name: newDirName.trim(),
        path: jellyfinUrl.trim(),
        type: "jellyfin",
        url: jellyfinUrl.trim(),
        username: jellyfinUsername.trim(),
        password: jellyfinPassword.trim(),
        connected: true
      };
      updatedDirs = [...directories, newDir];
      setDirectories(updatedDirs);
      setNewDirName("");
      setJellyfinUrl("");
      setJellyfinUsername("");
      setJellyfinPassword("");
      setFormType("local");
      setIsAdding(false);
      setToast("Jellyfin server connected!");
    }
    setTimeout(() => setToast(""), 3000);
    triggerScan(updatedDirs);
  };

  const handleDeleteDirectory = (id, e) => {
    e.stopPropagation();
    const updatedDirs = directories.filter((d) => d.id !== id);
    setDirectories(updatedDirs);
    setToast("Directory removed. Scanning updated folders...");
    setTimeout(() => setToast(""), 3000);
    triggerScan(updatedDirs);
  };`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log("Replaced target2 successfully!");
} else {
  console.error("Could not find target2!");
}

// Convert line endings back if needed
if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf-8');
console.log("File saved!");
