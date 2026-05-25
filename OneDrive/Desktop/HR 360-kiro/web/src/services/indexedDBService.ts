/**
 * IndexedDB Service for offline data storage
 */

const DB_NAME = 'EmergencyAppDB';
const DB_VERSION = 1;

interface PendingOperation {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const store = db.createObjectStore('cachedData', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('kbGuides')) {
          db.createObjectStore('kbGuides', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('checkIns')) {
          db.createObjectStore('checkIns', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' });
        }
      };
    });
  }

  // Pending Operations
  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const id = `${Date.now()}-${Math.random()}`;
    const pendingOp: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pendingOperations', 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.add(pendingOp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pendingOperations', 'readonly');
      const store = transaction.objectStore('pendingOperations');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removePendingOperation(id: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pendingOperations', 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Cached Data
  async setCachedData(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000, // Default 24 hours
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cachedData', 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.put(cacheEntry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cachedData', 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const now = Date.now();
        if (now - result.timestamp > result.ttl) {
          // Cache expired, delete it
          this.deleteCachedData(key);
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cachedData', 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // User Profile
  async saveUserProfile(profile: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('userProfile', 'readwrite');
      const store = transaction.objectStore('userProfile');
      const request = store.put(profile);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUserProfile(): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('userProfile', 'readonly');
      const store = transaction.objectStore('userProfile');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result;
        resolve(results.length > 0 ? results[0] : null);
      };
    });
  }

  // KB Guides
  async saveKBGuides(guides: any[]): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('kbGuides', 'readwrite');
      const store = transaction.objectStore('kbGuides');

      // Clear existing guides
      store.clear();

      // Add new guides
      guides.forEach(guide => {
        store.add(guide);
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async getKBGuides(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('kbGuides', 'readonly');
      const store = transaction.objectStore('kbGuides');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Check-ins
  async saveCheckIn(checkIn: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('checkIns', 'readwrite');
      const store = transaction.objectStore('checkIns');
      const request = store.add(checkIn);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCheckIns(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('checkIns', 'readonly');
      const store = transaction.objectStore('checkIns');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Contacts
  async saveContacts(contacts: any[]): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('contacts', 'readwrite');
      const store = transaction.objectStore('contacts');

      store.clear();
      contacts.forEach(contact => {
        store.add(contact);
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async getContacts(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('contacts', 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Alerts
  async saveAlerts(alerts: any[]): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('alerts', 'readwrite');
      const store = transaction.objectStore('alerts');

      store.clear();
      alerts.forEach(alert => {
        store.add(alert);
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async getAlerts(): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('alerts', 'readonly');
      const store = transaction.objectStore('alerts');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const stores = [
      'pendingOperations',
      'cachedData',
      'userProfile',
      'kbGuides',
      'checkIns',
      'contacts',
      'alerts',
    ];

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(undefined);
      });
    }
  }
}

export const indexedDBService = new IndexedDBService();
