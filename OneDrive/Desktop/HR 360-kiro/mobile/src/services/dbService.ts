import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, KBGuide, CheckIn, Contact, ToBagItem, Alert, Incident, SyncQueue } from '@types/index';

const DB_NAME = 'emergency_app.db';

class DatabaseService {
  private db: SQLite.Database | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL,
        orgId TEXT NOT NULL,
        teamId TEXT,
        departmentId TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        biometricEnabled INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,

      // Emergency Contacts table
      `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        isPrimary INTEGER DEFAULT 0,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`,

      // KB Guides table
      `CREATE TABLE IF NOT EXISTS kb_guides (
        id TEXT PRIMARY KEY,
        orgId TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        mediaUrls TEXT,
        isRequired INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        updatedBy TEXT NOT NULL
      );`,

      // KB Guide Versions table
      `CREATE TABLE IF NOT EXISTS kb_guide_versions (
        id TEXT PRIMARY KEY,
        guideId TEXT NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY(guideId) REFERENCES kb_guides(id)
      );`,

      // Guide Acknowledgments table
      `CREATE TABLE IF NOT EXISTS guide_acknowledgments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        guideId TEXT NOT NULL,
        acknowledgedAt TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(guideId) REFERENCES kb_guides(id)
      );`,

      // Check-ins table
      `CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        teamId TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        latitude REAL,
        longitude REAL,
        timestamp TEXT NOT NULL,
        incidentId TEXT,
        isDrill INTEGER DEFAULT 0,
        syncedToServer INTEGER DEFAULT 0,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`,

      // Alerts table
      `CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        orgId TEXT NOT NULL,
        teamIds TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        type TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        expiresAt TEXT,
        isDrill INTEGER DEFAULT 0,
        incidentId TEXT
      );`,

      // Alert Notifications table
      `CREATE TABLE IF NOT EXISTS alert_notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        alertId TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        readAt TEXT,
        receivedAt TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(alertId) REFERENCES alerts(id)
      );`,

      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        category TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        isPinned INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`,

      // To-Go Bag Items table
      `CREATE TABLE IF NOT EXISTS tobag_items (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        isPacked INTEGER DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`,

      // Incidents table
      `CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        orgId TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        isDrill INTEGER DEFAULT 0,
        createdBy TEXT NOT NULL
      );`,

      // Sync Queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );`,

      // Offline Maps table
      `CREATE TABLE IF NOT EXISTS offline_maps (
        id TEXT PRIMARY KEY,
        orgId TEXT NOT NULL,
        name TEXT NOT NULL,
        buildingName TEXT,
        fileUrl TEXT NOT NULL,
        fileType TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );`,

      // Biometric Settings table
      `CREATE TABLE IF NOT EXISTS biometric_settings (
        userId TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 0,
        type TEXT,
        lastAuthAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`,

      // SOS Escalation table
      `CREATE TABLE IF NOT EXISTS sos_escalations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        initiatedAt TEXT NOT NULL,
        status TEXT NOT NULL,
        managerNotifiedAt TEXT,
        emergencyContactsNotifiedAt TEXT,
        teamNotifiedAt TEXT,
        resolvedAt TEXT,
        notes TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );`
    ];

    for (const table of tables) {
      try {
        await this.db.execAsync(table);
      } catch (error) {
        console.error('Error creating table:', error);
      }
    }
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO users 
       (id, email, firstName, lastName, role, orgId, teamId, departmentId, address, latitude, longitude, biometricEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, user.email, user.firstName, user.lastName, user.role, user.orgId,
        user.teamId || null, user.departmentId || null, user.address || null,
        user.latitude || null, user.longitude || null, user.biometricEnabled ? 1 : 0,
        user.createdAt, user.updatedAt
      ]
    );

    // Save emergency contacts
    for (const contact of user.emergencyContacts) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO emergency_contacts 
         (id, userId, name, relationship, phone, email, isPrimary)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [contact.id, user.id, contact.name, contact.relationship, contact.phone, contact.email || null, contact.isPrimary ? 1 : 0]
      );
    }
  }

  async getUser(userId: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!result) return null;

    const contacts = await this.db.getAllAsync<any>(
      'SELECT * FROM emergency_contacts WHERE userId = ?',
      [userId]
    );

    return {
      ...result,
      biometricEnabled: result.biometricEnabled === 1,
      emergencyContacts: contacts.map(c => ({
        ...c,
        isPrimary: c.isPrimary === 1
      }))
    };
  }

  // KB Guide operations
  async saveKBGuide(guide: KBGuide): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO kb_guides 
       (id, orgId, title, category, type, content, mediaUrls, isRequired, version, createdBy, createdAt, updatedAt, updatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guide.id, guide.orgId, guide.title, guide.category, guide.type, guide.content,
        guide.mediaUrls ? JSON.stringify(guide.mediaUrls) : null,
        guide.isRequired ? 1 : 0, guide.version, guide.createdBy, guide.createdAt, guide.updatedAt, guide.updatedBy
      ]
    );
  }

  async getKBGuides(orgId: string, category?: string): Promise<KBGuide[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM kb_guides WHERE orgId = ?';
    const params: any[] = [orgId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const results = await this.db.getAllAsync<any>(query, params);
    
    return results.map(r => ({
      ...r,
      isRequired: r.isRequired === 1,
      mediaUrls: r.mediaUrls ? JSON.parse(r.mediaUrls) : undefined
    }));
  }

  // Check-in operations
  async saveCheckIn(checkIn: CheckIn): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO check_ins 
       (id, userId, teamId, status, notes, latitude, longitude, timestamp, incidentId, isDrill, syncedToServer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkIn.id, checkIn.userId, checkIn.teamId, checkIn.status, checkIn.notes || null,
        checkIn.location?.latitude || null, checkIn.location?.longitude || null,
        checkIn.timestamp, checkIn.incidentId || null, checkIn.isDrill ? 1 : 0, checkIn.syncedToServer ? 1 : 0
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue('create', 'check_in', checkIn.id, checkIn);
  }

  async getCheckInHistory(userId: string, limit: number = 50): Promise<CheckIn[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM check_ins WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );

    return results.map(r => ({
      ...r,
      isDrill: r.isDrill === 1,
      syncedToServer: r.syncedToServer === 1,
      location: r.latitude && r.longitude ? { latitude: r.latitude, longitude: r.longitude } : undefined
    }));
  }

  // Contact operations
  async saveContact(contact: Contact): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO contacts 
       (id, userId, name, type, phone, email, category, address, latitude, longitude, isPinned, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.id, contact.userId, contact.name, contact.type, contact.phone, contact.email || null,
        contact.category || null, contact.address || null, contact.latitude || null, contact.longitude || null,
        contact.isPinned ? 1 : 0, contact.createdAt
      ]
    );
  }

  async getContacts(userId: string): Promise<Contact[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM contacts WHERE userId = ? ORDER BY isPinned DESC, name ASC',
      [userId]
    );

    return results.map(r => ({
      ...r,
      isPinned: r.isPinned === 1
    }));
  }

  // To-Go Bag operations
  async saveToBagItem(item: ToBagItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO tobag_items 
       (id, userId, name, category, quantity, isPacked, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id, item.userId, item.name, item.category, item.quantity,
        item.isPacked ? 1 : 0, item.notes || null, item.createdAt, item.updatedAt
      ]
    );
  }

  async getToBagItems(userId: string): Promise<ToBagItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM tobag_items WHERE userId = ? ORDER BY category, name',
      [userId]
    );

    return results.map(r => ({
      ...r,
      isPacked: r.isPacked === 1
    }));
  }

  // Sync Queue operations
  async addToSyncQueue(action: string, entityType: string, entityId: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `${entityType}_${entityId}_${Date.now()}`;
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, action, entityType, entityId, data, timestamp, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, action, entityType, entityId, JSON.stringify(data), new Date().toISOString(), 0]
    );
  }

  async getPendingSyncItems(): Promise<SyncQueue[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY timestamp ASC'
    );

    return results.map(r => ({
      ...r,
      data: JSON.parse(r.data),
      synced: r.synced === 1
    }));
  }

  async markSyncItemAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'UPDATE sync_queue SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tables = [
      'users', 'emergency_contacts', 'kb_guides', 'kb_guide_versions',
      'guide_acknowledgments', 'check_ins', 'alerts', 'alert_notifications',
      'contacts', 'tobag_items', 'incidents', 'sync_queue', 'offline_maps',
      'biometric_settings', 'sos_escalations'
    ];

    for (const table of tables) {
      try {
        await this.db.execAsync(`DELETE FROM ${table}`);
      } catch (error) {
        console.error(`Error clearing ${table}:`, error);
      }
    }
  }
}

export const dbService = new DatabaseService();
