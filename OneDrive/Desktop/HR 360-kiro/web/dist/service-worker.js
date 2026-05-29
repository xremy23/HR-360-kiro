// Service Worker is disabled - this file should not be used
// The app uses browser caching instead for performance

// Respond to install event and fail (prevent registration)
self.addEventListener('install', event => {
  // Do nothing - let installation fail
  console.log('Service Worker install attempted but disabled');
});

// Respond to activate event and fail
self.addEventListener('activate', event => {
  console.log('Service Worker activate attempted but disabled');
});

// Do not respond to fetch events - let browser handle all requests
