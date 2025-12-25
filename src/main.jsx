import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DevModeProvider } from './context/DevModeContext'

// SAFETY GATE: Only enable the keyboard listener in local development
if (import.meta.env.DEV) {
  window.addEventListener('keydown', (e) => {
    // Requires specific Ctrl+Shift+D combination
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      const isDevMode = localStorage.getItem('DEV_MODE') === 'true';
      localStorage.setItem('DEV_MODE', !isDevMode ? 'true' : 'false');
      console.log(`🔧 Nexus Terminal: ${!isDevMode ? 'SECURE_ENABLED' : 'DISABLED'}`);
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DevModeProvider>
      <App />
    </DevModeProvider>
  </StrictMode>,
)