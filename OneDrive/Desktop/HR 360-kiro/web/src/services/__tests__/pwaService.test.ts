import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pwaService } from '../pwaService';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('PWAService', () => {
  let originalNavigator: any;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = { ...window.navigator };

    // Reset vi mocks
    vi.clearAllMocks();

    // Mock console methods to keep tests clean
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should handle lack of service worker support', async () => {
      // Create a navigator object without serviceWorker but with other properties
      const navWithoutSW = { ...originalNavigator };
      delete navWithoutSW.serviceWorker;

      Object.defineProperty(window, 'navigator', {
        value: navWithoutSW,
        configurable: true
      });

      await pwaService.initialize();
      expect(console.warn).toHaveBeenCalledWith('Service Workers not supported');
    });

    it('should register service worker if supported', async () => {
      const mockRegister = vi.fn().mockResolvedValue({ update: vi.fn() });
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, serviceWorker: { register: mockRegister } },
        configurable: true
      });

      vi.useFakeTimers();

      await pwaService.initialize();

      expect(mockRegister).toHaveBeenCalledWith('./service-worker.js', { scope: './' });
      expect(console.log).toHaveBeenCalledWith('Service Worker registered successfully');

      vi.useRealTimers();
    });

    it('should handle registration failure', async () => {
      const error = new Error('Registration failed');
      const mockRegister = vi.fn().mockRejectedValue(error);
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, serviceWorker: { register: mockRegister } },
        configurable: true
      });

      await pwaService.initialize();

      expect(console.error).toHaveBeenCalledWith('Service Worker registration failed:', error);
    });

    it('should listen for beforeinstallprompt and appinstalled events', async () => {
        const mockRegister = vi.fn().mockResolvedValue({ update: vi.fn() });
        Object.defineProperty(window, 'navigator', {
            value: { ...originalNavigator, serviceWorker: { register: mockRegister } },
            configurable: true
        });

        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        await pwaService.initialize();

        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    });
  });

  describe('promptInstall', () => {
    it('should warn if install prompt not available', async () => {
      // Need to reset deferred prompt. Since it's private, we'll force it by dispatching appinstalled
      // Create a fresh instance or leverage appinstalled event to nullify deferredPrompt
      window.dispatchEvent(new Event('appinstalled'));

      const result = await pwaService.promptInstall();
      expect(console.warn).toHaveBeenCalledWith('Install prompt not available');
      expect(result).toBe(false);
    });

    it('should trigger prompt and return outcome if available', async () => {
      const mockRegister = vi.fn().mockResolvedValue({ update: vi.fn() });
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, serviceWorker: { register: mockRegister } },
        configurable: true
      });

      await pwaService.initialize();

      const mockPrompt = vi.fn();
      const mockEvent = new Event('beforeinstallprompt') as any;
      mockEvent.prompt = mockPrompt;
      mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
      mockEvent.preventDefault = vi.fn();

      window.dispatchEvent(mockEvent);

      const result = await pwaService.promptInstall();

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('isInstalled', () => {
    it('should return true if standalone mode matches', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
      expect(pwaService.isInstalled()).toBe(true);
    });

    it('should return true if navigator.standalone is true', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, standalone: true },
        configurable: true
      });
      expect(pwaService.isInstalled()).toBe(true);
    });

    it('should return false if neither condition is met', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, standalone: false },
        configurable: true
      });
      expect(pwaService.isInstalled()).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('should return navigator.onLine', () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, onLine: true },
        configurable: true
      });
      expect(pwaService.isOnline()).toBe(true);

      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, onLine: false },
        configurable: true
      });
      expect(pwaService.isOnline()).toBe(false);
    });
  });

  describe('onOnlineStatusChange', () => {
    it('should register and unregister event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const callback = vi.fn();

      const cleanup = pwaService.onOnlineStatusChange(callback);

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      // Trigger online
      window.dispatchEvent(new Event('online'));
      expect(callback).toHaveBeenCalledWith(true);

      // Trigger offline
      window.dispatchEvent(new Event('offline'));
      expect(callback).toHaveBeenCalledWith(false);

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('requestBackgroundSync', () => {
    it('should warn if not supported', async () => {
      const navWithoutSW = { ...originalNavigator };
      delete navWithoutSW.serviceWorker;

      Object.defineProperty(window, 'navigator', {
        value: navWithoutSW,
        configurable: true
      });

      const originalSyncManager = (window as any).SyncManager;
      delete (window as any).SyncManager;

      await pwaService.requestBackgroundSync('test-tag');

      expect(console.warn).toHaveBeenCalledWith('Background Sync not supported');

      if (originalSyncManager !== undefined) {
         (window as any).SyncManager = originalSyncManager;
      }
    });

    it('should register sync if supported', async () => {
      const mockSyncRegister = vi.fn().mockResolvedValue(undefined);
      const mockReady = Promise.resolve({ sync: { register: mockSyncRegister } });

      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, serviceWorker: { ready: mockReady } },
        configurable: true
      });
      Object.defineProperty(window, 'SyncManager', { value: {}, configurable: true });

      await pwaService.requestBackgroundSync('test-tag');

      expect(mockSyncRegister).toHaveBeenCalledWith('test-tag');
      expect(console.log).toHaveBeenCalledWith('Background sync registered:', 'test-tag');
    });
  });

  describe('requestNotificationPermission', () => {
    let originalNotification: any;

    beforeEach(() => {
        originalNotification = window.Notification;
    });

    afterEach(() => {
        window.Notification = originalNotification;
    });

    it('should return denied if not supported', async () => {
        delete (window as any).Notification;

        const result = await pwaService.requestNotificationPermission();
        expect(console.warn).toHaveBeenCalledWith('Notifications not supported');
        expect(result).toBe('denied');
    });

    it('should return granted if already granted', async () => {
        window.Notification = { permission: 'granted' } as any;
        const result = await pwaService.requestNotificationPermission();
        expect(result).toBe('granted');
    });

    it('should request permission if not denied or granted', async () => {
        const mockRequestPermission = vi.fn().mockResolvedValue('granted');
        window.Notification = {
            permission: 'default',
            requestPermission: mockRequestPermission
        } as any;

        const result = await pwaService.requestNotificationPermission();
        expect(mockRequestPermission).toHaveBeenCalled();
        expect(result).toBe('granted');
    });

    it('should return denied if already denied', async () => {
        window.Notification = { permission: 'denied' } as any;
        const result = await pwaService.requestNotificationPermission();
        expect(result).toBe('denied');
    });
  });

  describe('sendNotification', () => {
    it('should warn if service worker not supported', async () => {
      const navWithoutSW = { ...originalNavigator };
      delete navWithoutSW.serviceWorker;

      Object.defineProperty(window, 'navigator', {
        value: navWithoutSW,
        configurable: true
      });

      await pwaService.sendNotification('Test Title');
      expect(console.warn).toHaveBeenCalledWith('Service Workers not supported');
    });

    it('should show notification via service worker', async () => {
      const mockShowNotification = vi.fn().mockResolvedValue(undefined);
      const mockReady = Promise.resolve({ showNotification: mockShowNotification });

      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, serviceWorker: { ready: mockReady } },
        configurable: true
      });

      await pwaService.sendNotification('Test Title', { body: 'Test Body' });

      expect(mockShowNotification).toHaveBeenCalledWith('Test Title', {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        body: 'Test Body'
      });
    });
  });

  describe('requestLocationPermission', () => {
    it('should return false if geolocation not supported', async () => {
      const navWithoutGeo = { ...originalNavigator };
      delete navWithoutGeo.geolocation;

      Object.defineProperty(window, 'navigator', {
        value: navWithoutGeo,
        configurable: true
      });

      const result = await pwaService.requestLocationPermission();
      expect(console.warn).toHaveBeenCalledWith('Geolocation not supported');
      expect(result).toBe(false);
    });

    it('should resolve to true on success', async () => {
      const mockGetCurrentPosition = vi.fn((success) => success({ coords: { latitude: 0, longitude: 0 } }));
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, geolocation: { getCurrentPosition: mockGetCurrentPosition } },
        configurable: true
      });

      const result = await pwaService.requestLocationPermission();
      expect(result).toBe(true);
    });

    it('should resolve to false on error', async () => {
      const mockGetCurrentPosition = vi.fn((success, error) => error(new Error('Denied')));
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, geolocation: { getCurrentPosition: mockGetCurrentPosition } },
        configurable: true
      });

      const result = await pwaService.requestLocationPermission();
      expect(result).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    it('should return false if mediaDevices not supported', async () => {
      const navWithoutMedia = { ...originalNavigator };
      delete navWithoutMedia.mediaDevices;

      Object.defineProperty(window, 'navigator', {
        value: navWithoutMedia,
        configurable: true
      });

      const result = await pwaService.requestCameraPermission();
      expect(console.warn).toHaveBeenCalledWith('Camera not supported');
      expect(result).toBe(false);
    });

    it('should return true and stop tracks on success', async () => {
      const mockStop = vi.fn();
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: mockStop }]
      });

      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, mediaDevices: { getUserMedia: mockGetUserMedia } },
        configurable: true
      });

      const result = await pwaService.requestCameraPermission();
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      expect(mockStop).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false on denial or error', async () => {
      const error = new Error('Denied');
      const mockGetUserMedia = vi.fn().mockRejectedValue(error);

      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, mediaDevices: { getUserMedia: mockGetUserMedia } },
        configurable: true
      });

      const result = await pwaService.requestCameraPermission();
      expect(console.error).toHaveBeenCalledWith('Camera permission denied:', error);
      expect(result).toBe(false);
    });
  });
});
