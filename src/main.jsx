import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { restoreLocalStorageFromTauri } from './utils/tauribridge';

async function initAndMount() {
  try {
    // Restore persisted state from Tauri to local storage on launch
    await restoreLocalStorageFromTauri();
  } catch (e) {
    console.error('Failed to restore localStorage from Tauri on launch:', e);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initAndMount();
