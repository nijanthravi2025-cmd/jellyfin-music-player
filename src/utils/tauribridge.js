/**
 * Tauri Bridge — auto-detects Tauri vs Browser environment.
 * 
 * When running inside Tauri's webview, uses `invoke()` to call Rust commands.
 * When running in a normal browser, falls back to localStorage.
 */

/**
 * Check if we're running inside a Tauri webview
 */
export const isTauri = () => {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
};

/**
 * Dynamically import Tauri's invoke function
 */
let _invoke = null;
async function getInvoke() {
  if (_invoke) return _invoke;
  if (!isTauri()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    _invoke = invoke;
    return invoke;
  } catch (e) {
    console.warn('Failed to load Tauri API:', e);
    return null;
  }
}

// ── Data Persistence (replaces localStorage) ─────────────────────────────────

// Internal helpers that deal with final raw keys without double prefixing
async function _readData(rawKey) {
  if (isTauri()) {
    try {
      const invoke = await getInvoke();
      if (invoke) {
        return await invoke('read_app_data', { key: rawKey });
      }
    } catch (e) {
      console.warn('Tauri readData failed, falling back to localStorage:', e);
    }
  }
  return localStorage.getItem(rawKey);
}

async function _writeData(rawKey, value) {
  if (isTauri()) {
    try {
      const invoke = await getInvoke();
      if (invoke) {
        await invoke('write_app_data', { key: rawKey, value });
        return;
      }
    } catch (e) {
      console.warn('Tauri writeData failed, falling back to localStorage:', e);
    }
  }
  localStorage.setItem(rawKey, value);
}

async function _removeData(rawKey) {
  if (isTauri()) {
    try {
      const invoke = await getInvoke();
      if (invoke) {
        await invoke('remove_app_data', { key: rawKey });
        return;
      }
    } catch (e) {
      console.warn('Tauri removeData failed, falling back to localStorage:', e);
    }
  }
  localStorage.removeItem(rawKey);
}

/**
 * Route keys to profile-specific keys if a profile is active
 */
export const getProfilePrefixedKey = (key) => {
  if (key === "music_profiles" || key === "music_current_profile_id" || key.startsWith("music_profiles_")) {
    return key;
  }
  const profileId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem("music_current_profile_id") : null;
  if (profileId) {
    return `${key}_${profileId}`;
  }
  return key;
};

/**
 * Read persisted data by key
 */
export async function readData(key) {
  return _readData(getProfilePrefixedKey(key));
}

/**
 * Write persisted data by key
 */
export async function writeData(key, value) {
  return _writeData(getProfilePrefixedKey(key), value);
}

/**
 * Remove persisted data by key
 */
export async function removeData(key) {
  return _removeData(getProfilePrefixedKey(key));
}

/**
 * Synchronous read — always uses localStorage.
 */
export function readDataSync(key) {
  return localStorage.getItem(getProfilePrefixedKey(key));
}

/**
 * Synchronous write — writes to both localStorage and Tauri (fire-and-forget).
 */
export function writeDataSync(key, value) {
  const rawKey = getProfilePrefixedKey(key);
  localStorage.setItem(rawKey, value);
  if (isTauri()) {
    _writeData(rawKey, value).catch(() => {});
  }
}

/**
 * Synchronous remove — removes from both localStorage and Tauri.
 */
export function removeDataSync(key) {
  const rawKey = getProfilePrefixedKey(key);
  localStorage.removeItem(rawKey);
  if (isTauri()) {
    _removeData(rawKey).catch(() => {});
  }
}

/**
 * Restore all profile data files from Tauri app data directory to localStorage on startup
 */
export async function restoreLocalStorageFromTauri() {
  if (!isTauri()) return;
  try {
    const invoke = await getInvoke();
    if (invoke) {
      const keys = await invoke('list_app_data_keys');
      for (const key of keys) {
        const val = await invoke('read_app_data', { key });
        if (val !== null) {
          localStorage.setItem(key, val);
        }
      }
      console.log('Restored localStorage keys from Tauri:', keys);
    }
  } catch (e) {
    console.error('Failed to restore localStorage from Tauri:', e);
  }
}

// ── Music-specific Tauri Commands ────────────────────────────────────────────

/**
 * Scan a local directory for audio files (Tauri only)
 * Returns array of { path, filename }
 */
export async function scanMusicDirectory(dirPath) {
  if (!isTauri()) {
    console.warn('scanMusicDirectory is only available in Tauri');
    return [];
  }
  try {
    const invoke = await getInvoke();
    if (invoke) {
      return await invoke('scan_music_directory', { path: dirPath });
    }
  } catch (e) {
    console.error('scanMusicDirectory failed:', e);
  }
  return [];
}

/**
 * Open native directory selection dialog (Tauri only)
 * Returns the folder path string, or null if cancelled.
 */
export async function selectDirectory() {
  if (!isTauri()) {
    console.warn('selectDirectory is only available in Tauri');
    return null;
  }
  try {
    const invoke = await getInvoke();
    if (invoke) {
      return await invoke('select_directory');
    }
  } catch (e) {
    console.error('selectDirectory failed:', e);
  }
  return null;
}

/**
 * Read audio metadata from a file (Tauri only)
 * Returns { title, artist, album, duration_secs, duration_formatted, cover_art_base64, path }
 */
export async function getAudioMetadata(filePath) {
  if (!isTauri()) {
    console.warn('getAudioMetadata is only available in Tauri');
    return null;
  }
  try {
    const invoke = await getInvoke();
    if (invoke) {
      return await invoke('get_audio_metadata', { path: filePath });
    }
  } catch (e) {
    console.error('getAudioMetadata failed:', e);
  }
  return null;
}

/**
 * Check if a file exists on disk (Tauri only)
 */
export async function fileExists(filePath) {
  if (!isTauri()) return false;
  try {
    const invoke = await getInvoke();
    if (invoke) {
      return await invoke('file_exists', { path: filePath });
    }
  } catch (e) {
    console.error('fileExists failed:', e);
  }
  return false;
}

/**
 * Convert a local file path to a URL the webview can load.
 * In Tauri: uses the asset: protocol
 * In Browser: returns the path as-is (won't work for actual playback)
 */
export function getAssetUrl(filePath) {
  if (!filePath) return '';
  if (isTauri()) {
    // Tauri v2 asset protocol URL format
    const normalized = filePath.replace(/\\/g, '/');
    return `http://asset.localhost/${normalized}`;
  }
  // In browser, return as-is (playback won't work but UI won't break)
  return filePath;
}

/**
 * Open file location in system file explorer (Tauri only)
 * Falls back to copying path to clipboard in browser.
 */
export async function showInExplorer(filePath) {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      // On Windows, use explorer with /select to highlight the file
      const normalized = filePath.replace(/\//g, '\\');
      await open(`explorer /select,"${normalized}"`);
      return true;
    } catch (e) {
      console.warn('showInExplorer failed:', e);
    }
  }
  // Fallback: copy to clipboard
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(filePath);
  }
  return false;
}
