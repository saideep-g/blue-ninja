import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DevModeProvider } from './context/DevModeContext'

/**
 * Global Keyboard Shortcut Listener
 * * WHY: We use a global listener to toggle the Nexus Terminal (Dev Mode).
 * CHANGE: Moved from Ctrl+Shift+D to Alt+Shift+D to avoid browser bookmarking conflicts.
 * SECURITY: This listener only attaches if the environment is strictly 'development'.
 */
if (import.meta.env.DEV) {
  window.addEventListener('keydown', (e) => {
    // Check for Alt + Shift + D (e.altKey)
    // We use preventDefault() as a best practice to ensure the OS doesn't 
    // intercept the combination for accessibility or language switching.
    if ((e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))) {

      e.preventDefault();

      const isDevMode = localStorage.getItem('DEV_MODE') === 'true';
      const newState = !isDevMode;

      localStorage.setItem('DEV_MODE', newState ? 'true' : 'false');

      console.log(`🔧 Nexus Terminal: ${newState ? 'SECURE_ENABLED ✅' : 'DISABLED ❌'}`);

      // Reload triggers the DevModeProvider to re-evaluate the local storage state
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* DevModeProvider manages the IndexedDB connection (NexusDB) 
        and the scenario injection logic for 1Q/2Q testing.
    */}
    <DevModeProvider>
      <App />
    </DevModeProvider>
  </StrictMode>,
)