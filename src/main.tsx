import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for caching and offline support
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('Yapp It PWA Service Worker successfully registered:', r?.scope);
  },
  onRegisterError(error) {
    console.error('Yapp It Service Worker registration error:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

