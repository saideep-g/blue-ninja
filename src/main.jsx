import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DevModeProvider } from './context/DevModeContext'

/**
 * Global Keyboard Shortcut Listener
 * * WHY: We use a global listener to toggle the Nexus Terminal (Dev Mode).
 * FIX: Switched from e.key to e.code. e.key is modified by Alt/Option (e.g., 'Î'), 
 * causing shortcut failure. e.code ('KeyD') is modifier-agnostic.
 * CHANGE: Moved from Ctrl+Shift+D to Alt+Shift+D to avoid browser bookmarking conflicts.
 * SECURITY: This listener only attaches if the environment is strictly 'development'.
 */
if (import.meta.env.DEV) {
  // We use the capture phase (true) to ensure the shortcut is caught before 
  // other component-level listeners or browser default actions.
  window.addEventListener('keydown', (e) => {
    // Check for (Alt + Shift + D) OR (Ctrl + Shift + D)
    // Using e.code 'KeyD' ensures this works even if Alt modifies the character output.
    const isDKey = e.code === 'KeyD';
    const isAltShift = e.altKey && e.shiftKey;
    const isCtrlShift = e.ctrlKey && e.shiftKey;

    if (isDKey && (isAltShift || isCtrlShift)) {
      // Prevent browser defaults (like Chrome's "Bookmark All Tabs" for Ctrl+Shift+D)
      e.preventDefault();
      // Stop propagation to prevent React components from reacting to the key
      e.stopPropagation();

      const isDevMode = localStorage.getItem('DEV_MODE') === 'true';
      const newState = !isDevMode;

      // Update the persistence layer
      localStorage.setItem('DEV_MODE', newState ? 'true' : 'false');

      console.log(`🔧 Nexus Terminal: ${newState ? 'SECURE_ENABLED ✅' : 'DISABLED ❌'}`);

      // A full window reload is required to re-initialize the DevModeProvider state
      // and either mount or unmount the Dev Menu routing logic.
      window.location.reload();
    }
  }, true); // Enable capture phase for high-priority interception
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