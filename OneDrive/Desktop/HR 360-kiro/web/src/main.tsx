import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store/store';
import './index.css';

// Suppress non-critical service worker errors in console
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ServiceWorker')) {
    event.preventDefault();
    return;
  }
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // Suppress InvalidStateError from service worker lifecycle
  if (event.reason && event.reason.name === 'InvalidStateError') {
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
});

// Disable service workers - use browser caching instead
// This prevents the 503 errors and complexity of SW fetch interception
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        registration.unregister().catch(() => {
          // Silent fail - expected when clearing SWs
        });
      });
    })
    .catch(() => {
      // Silent fail - expected
    });
}

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found');
  document.body.innerHTML = '<h1>Error: Root element not found</h1>';
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    document.body.innerHTML = `<h1>Error: ${error instanceof Error ? error.message : 'Unknown error'}</h1><pre>${error instanceof Error ? error.stack : String(error)}</pre>`;
  }
}
