import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'emergency_app'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function initializeDatabase(): Promise<void> {
  const client = await getClient();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email_domain VARCHAR(255),
        invite_code VARCHAR(50) UNIQUE,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        org_id UUID NOT NULL REFERENCES organizations(id),
        team_id UUID,
        department_id UUID,
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        biometric_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS kb_guides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        media_urls TEXT[],
        is_required BOOLEAN DEFAULT FALSE,
        version INTEGER DEFAULT 1,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS kb_guide_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guide_id UUID NOT NULL REFERENCES kb_guides(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS guide_acknowledgments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        guide_id UUID NOT NULL REFERENCES kb_guides(id),
        acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, guide_id)
      );

      CREATE TABLE IF NOT EXISTS check_ins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        team_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        incident_id UUID,
        is_drill BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        team_ids UUID[],
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_drill BOOLEAN DEFAULT FALSE,
        incident_id UUID
      );

      CREATE TABLE IF NOT EXISTS alert_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        alert_id UUID NOT NULL REFERENCES alerts(id),
        read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        category VARCHAR(100),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tobag_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        is_packed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        is_drill BOOLEAN DEFAULT FALSE,
        created_by UUID NOT NULL REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sos_escalations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        manager_notified_at TIMESTAMP,
        emergency_contacts_notified_at TIMESTAMP,
        team_notified_at TIMESTAMP,
        resolved_at TIMESTAMP,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS offline_maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        building_name VARCHAR(255),
        file_url TEXT NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_team_id ON check_ins(team_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_incident_id ON check_ins(incident_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts(org_id);
      CREATE INDEX IF NOT EXISTS idx_kb_guides_org_id ON kb_guides(org_id);
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export default pool;
