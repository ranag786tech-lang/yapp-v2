import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { purgeMockStorage } from './lib/cleanSlate';

// Bootstrap clean slate: purge any legacy mock data in storage
purgeMockStorage();

// Auto-register service worker for caching, installability and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((r) => {
        console.log('Yapp It PWA Service Worker registered:', r?.scope);
      })
      .catch((err) => {
        console.warn('Yapp It SW registration note:', err);
      });
  });
}

registerSW({
  immediate: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

