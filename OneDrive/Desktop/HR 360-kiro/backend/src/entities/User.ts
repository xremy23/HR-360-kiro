import { query } from '../config/database';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';
  orgId: string;
  teamId?: string;
  departmentId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  biometricEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, first_name, last_name, role, org_id, team_id, department_id, address, latitude, longitude, biometric_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId", 
                 department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled", 
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [data.email, data.firstName, data.lastName, data.role, data.orgId, data.teamId, data.departmentId, 
       data.address, data.latitude, data.longitude, data.biometricEnabled]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findByOrgId(orgId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE org_id = $1 LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    return result.rows;
  }

  static async findByTeamId(teamId: string): Promise<User[]> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE team_id = $1`,
      [teamId]
    );
    return result.rows;
  }

  static async update(id: string, data: Partial<User>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.firstName) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(data.firstName);
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(data.lastName);
    }
    if (data.address) {
      updates.push(`address = $${paramCount++}`);
      values.push(data.address);
    }
    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(data.longitude);
    }
    if (data.biometricEnabled !== undefined) {
      updates.push(`biometric_enabled = $${paramCount++}`);
      values.push(data.biometricEnabled);
    }
    if (data.orgId) {
      updates.push(`org_id = $${paramCount++}`);
      values.push(data.orgId);
    }
    if (data.role) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
                 department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  static async countByOrgId(orgId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM users WHERE org_id = $1`,
      [orgId]
    );
    return parseInt(result.rows[0].count);
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}
