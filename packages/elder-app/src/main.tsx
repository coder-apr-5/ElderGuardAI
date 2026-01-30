import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Suppress extension-related errors so they don't crash the app or show overlays
window.addEventListener('error', (e) => {
  if (e.message.includes('ethereum') || e.message.includes('chrome-extension')) {
    e.stopImmediatePropagation();
    e.preventDefault(); // Prevents the error from showing in the console/overlay
    return true;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
