/**
 * Service Worker Registration for PWA
 * Handles offline functionality, caching, and background sync
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('✅ Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 New Service Worker activated');
      // Optionally show update notification
      showUpdateNotification();
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
}

/**
 * Show notification when app update is available
 */
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('HR 360 Updated', {
      body: 'A new version is available. Refresh to update.',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'update-notification'
    });
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Detect if app is installed
 */
export function isAppInstalled(): boolean {
  return isStandalone() || window.matchMedia('(display-mode: fullscreen)').matches;
}

/**
 * Listen for install prompt
 */
export function setupInstallPrompt(callback: (event: BeforeInstallPromptEvent) => void) {
  window.addEventListener('beforeinstallprompt', (event: any) => {
    event.preventDefault();
    callback(event);
  });
}

/**
 * Trigger install prompt
 */
export async function triggerInstallPrompt(event: BeforeInstallPromptEvent) {
  event.prompt();
  const { outcome } = await event.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
}
