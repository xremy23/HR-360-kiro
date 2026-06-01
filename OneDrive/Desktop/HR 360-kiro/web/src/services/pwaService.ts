/**
 * PWA Service - Handles Service Worker registration and PWA features
 */

class PWAService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
      });
      console.log('Service Worker registered successfully');

      // Check for updates periodically
      setInterval(() => {
        this.serviceWorkerRegistration?.update();
      }, 60000); // Check every minute
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyInstallPromptAvailable();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.deferredPrompt = null;
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }

  isInstalled(): boolean {
    // Check if app is running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  async requestBackgroundSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }

    return 'denied';
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  async requestCameraPermission(): Promise<boolean> {
    if (!('mediaDevices' in navigator)) {
      console.warn('Camera not supported');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  private notifyInstallPromptAvailable(): void {
    // Dispatch custom event that components can listen to
    window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
  }

  getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.serviceWorkerRegistration;
  }
}

export const pwaService = new PWAService();
