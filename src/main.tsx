import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { purgeMockStorage } from './lib/cleanSlate';

// Bootstrap clean slate: purge any legacy mock data in storage
purgeMockStorage();

// In development, unregister any active service workers to prevent refresh loops & stale caching
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  } else {
    // In production, safely register service worker for PWA
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
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

