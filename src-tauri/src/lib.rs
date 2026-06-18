use base64::Engine;
use lofty::file::AudioFile;
use lofty::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use walkdir::WalkDir;

// ── Data Structures ──────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AudioMetadata {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_secs: u64,
    pub duration_formatted: String,
    pub cover_art_base64: Option<String>,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ScannedFile {
    pub path: String,
    pub filename: String,
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/// Get the app data directory and ensure it exists
fn get_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(data_dir)
}

/// Supported audio file extensions
fn is_audio_file(path: &Path) -> bool {
    match path.extension().and_then(|e| e.to_str()) {
        Some(ext) => matches!(
            ext.to_lowercase().as_str(),
            "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac" | "wma" | "opus" | "aiff"
        ),
        None => false,
    }
}

/// Format seconds into "M:SS" string
fn format_duration(secs: u64) -> String {
    let minutes = secs / 60;
    let seconds = secs % 60;
    format!("{}:{:02}", minutes, seconds)
}

// ── Tauri Commands ───────────────────────────────────────────────────────────

/// Scan a directory recursively for audio files
#[tauri::command]
fn scan_music_directory(path: String) -> Result<Vec<ScannedFile>, String> {
    let dir_path = Path::new(&path);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut files: Vec<ScannedFile> = Vec::new();

    for entry in WalkDir::new(dir_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();
        if entry_path.is_file() && is_audio_file(entry_path) {
            let filename = entry_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            files.push(ScannedFile {
                path: entry_path.to_string_lossy().replace('\\', "/"),
                filename,
            });
        }
    }

    Ok(files)
}

/// Read audio metadata (tags + duration) from a single file
#[tauri::command]
fn get_audio_metadata(path: String) -> Result<AudioMetadata, String> {
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let mut title = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let mut artist = "Unknown Artist".to_string();
    let mut album = "Unknown Album".to_string();
    let mut duration_secs = 0;
    let mut cover_art_base64 = None;

    if let Ok(tagged_file) = lofty::read_from_path(file_path) {
        let properties = tagged_file.properties();
        duration_secs = properties.duration().as_secs();

        // Try to get tags (primary tag first, then any tag)
        let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
        if let Some(t) = tag {
            if let Some(t_title) = t.title().map(|s| s.to_string()) {
                title = t_title;
            }
            if let Some(t_artist) = t.artist().map(|s| s.to_string()) {
                artist = t_artist;
            }
            if let Some(t_album) = t.album().map(|s| s.to_string()) {
                album = t_album;
            }
            // Extract cover art if available
            cover_art_base64 = t.pictures().first().map(|pic| {
                let engine = base64::engine::general_purpose::STANDARD;
                let b64 = engine.encode(pic.data());
                let mime = match pic.mime_type() {
                    Some(lofty::picture::MimeType::Png) => "image/png",
                    Some(lofty::picture::MimeType::Jpeg) => "image/jpeg",
                    Some(lofty::picture::MimeType::Bmp) => "image/bmp",
                    Some(lofty::picture::MimeType::Gif) => "image/gif",
                    _ => "image/jpeg",
                };
                format!("data:{};base64,{}", mime, b64)
            });
        }
    }

    Ok(AudioMetadata {
        title,
        artist,
        album,
        duration_secs,
        duration_formatted: format_duration(duration_secs),
        cover_art_base64,
        path: path.replace('\\', "/"),
    })
}

/// Open a native directory picker dialog and return the selected path
#[tauri::command]
fn select_directory() -> Option<String> {
    let folder = rfd::FileDialog::new()
        .set_title("Select Music Folder")
        .pick_folder();
    folder.map(|path| path.to_string_lossy().replace('\\', "/"))
}

/// Read persisted app data by key (replaces localStorage.getItem)
#[tauri::command]
fn read_app_data(app_handle: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    let data_dir = get_data_dir(&app_handle)?;
    let file_path = data_dir.join(format!("{}.json", key));

    if !file_path.exists() {
        return Ok(None);
    }

    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read data file: {}", e))?;
    Ok(Some(content))
}

/// List all keys saved in the app data directory
#[tauri::command]
fn list_app_data_keys(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let data_dir = get_data_dir(&app_handle)?;
    let mut keys = Vec::new();
    if let Ok(entries) = fs::read_dir(data_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    keys.push(stem.to_string());
                }
            }
        }
    }
    Ok(keys)
}

/// Write persisted app data by key (replaces localStorage.setItem)
#[tauri::command]
fn write_app_data(
    app_handle: tauri::AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    let data_dir = get_data_dir(&app_handle)?;
    let file_path = data_dir.join(format!("{}.json", key));

    fs::write(&file_path, &value).map_err(|e| format!("Failed to write data file: {}", e))?;
    Ok(())
}

/// Remove persisted app data by key (replaces localStorage.removeItem)
#[tauri::command]
fn remove_app_data(app_handle: tauri::AppHandle, key: String) -> Result<(), String> {
    let data_dir = get_data_dir(&app_handle)?;
    let file_path = data_dir.join(format!("{}.json", key));

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to remove data file: {}", e))?;
    }
    Ok(())
}

/// Convert a local file path to the Tauri asset protocol URL
#[tauri::command]
fn get_asset_url(path: String) -> String {
    // Tauri v2 asset protocol: convert file path to asset URL
    // On Windows, paths like C:/Users/... need to be URL-encoded
    let encoded = path.replace('\\', "/");
    format!("http://asset.localhost/{}", encoded)
}

/// Check if a file exists
#[tauri::command]
fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

// ── App Entry ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_music_directory,
            get_audio_metadata,
            read_app_data,
            list_app_data_keys,
            write_app_data,
            remove_app_data,
            get_asset_url,
            file_exists,
            select_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
