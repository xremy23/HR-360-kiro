import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, requestNotificationPermission } from './pwa/serviceWorkerRegister';

// Initialize PWA
async function initializePWA() {
  // Register Service Worker
  await registerServiceWorker();

  // Request notification permission
  await requestNotificationPermission();

  // Log PWA status
  console.log('✅ PWA initialized');
}

// Initialize PWA before rendering
initializePWA().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
