import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App';
import './index.css';

// Schema v1 data (pre-revision) is not migrated; drop the stale keys.
for (const key of ['pet:library', 'pet:encounters']) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
