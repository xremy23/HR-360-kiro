/**
 * CICT Safety Portal - User Entity
 * Represents a user in the disaster preparedness and emergency response system
 */

import { query } from '../config/database';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  position?: string;
  address?: string;
  personalEmergencyContact?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  position?: string;
  address?: string;
  personalEmergencyContact?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  position?: string;
  address?: string;
  personalEmergencyContact?: string;
  isActive?: boolean;
}

export interface UserProfile extends User {
  organizationName?: string;
  departmentName?: string;
  teamName?: string;
  teamHeadName?: string;
}

export class UserEntity implements User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  position?: string;
  address?: string;
  personalEmergencyContact?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.avatarUrl = data.avatarUrl;
    this.role = data.role;
    this.organizationId = data.organizationId;
    this.departmentId = data.departmentId;
    this.teamId = data.teamId;
    this.position = data.position;
    this.address = data.address;
    this.personalEmergencyContact = data.personalEmergencyContact;
    this.isActive = data.isActive;
    this.lastLogin = data.lastLogin;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Get full name
   */
  getFullName(): string {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : this.email;
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.role === 'super_admin';
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Check if user is HR admin
   */
  isHRAdmin(): boolean {
    return this.role === 'hr_admin';
  }

  /**
   * Check if user is Safety admin
   */
  isSafetyAdmin(): boolean {
    return this.role === 'safety_admin';
  }

  /**
   * Check if user is Workplace admin
   */
  isWorkplaceAdmin(): boolean {
    return this.role === 'workplace_admin';
  }

  /**
   * Check if user is HR
   */
  isHR(): boolean {
    return this.role === 'hr_admin';
  }

  /**
   * Check if user is employee
   */
  isEmployee(): boolean {
    return this.role === 'employee';
  }

  /**
   * Check if user is guest
   */
  isGuest(): boolean {
    return this.role === 'guest';
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON(): Partial<User> {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      role: this.role,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      teamId: this.teamId,
      position: this.position,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Static database method: Find user by ID
   */
  static async findById(id: string): Promise<UserEntity | null> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact", 
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? new UserEntity(result.rows[0]) : null;
  }

  /**
   * Static database method: Find user by email
   */
  static async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact", 
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] ? new UserEntity(result.rows[0]) : null;
  }

  /**
   * Static database method: Create user
   */
  static async create(data: CreateUserInput): Promise<UserEntity> {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO users (id, email, first_name, last_name, phone, role, organization_id, 
                         department_id, team_id, position, address, personal_emergency_contact, 
                         is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
                 role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
                 position, address, personal_emergency_contact as "personalEmergencyContact", 
                 is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        data.email,
        data.firstName || null,
        data.lastName || null,
        data.phone || null,
        data.role || 'employee',
        data.organizationId || null,
        data.departmentId || null,
        data.teamId || null,
        data.position || null,
        data.address || null,
        data.personalEmergencyContact || null,
        now,
        now,
      ]
    );

    return new UserEntity(result.rows[0]);
  }

  /**
   * Static database method: Update user
   */
  static async update(id: string, data: UpdateUserInput): Promise<UserEntity | null> {
    const now = new Date();
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(data.firstName || null);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(data.lastName || null);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone || null);
    }
    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatarUrl || null);
    }
    if (data.organizationId !== undefined) {
      fields.push(`organization_id = $${paramCount++}`);
      values.push(data.organizationId || null);
    }
    if (data.departmentId !== undefined) {
      fields.push(`department_id = $${paramCount++}`);
      values.push(data.departmentId || null);
    }
    if (data.teamId !== undefined) {
      fields.push(`team_id = $${paramCount++}`);
      values.push(data.teamId || null);
    }
    if (data.position !== undefined) {
      fields.push(`position = $${paramCount++}`);
      values.push(data.position || null);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(data.address || null);
    }
    if (data.personalEmergencyContact !== undefined) {
      fields.push(`personal_emergency_contact = $${paramCount++}`);
      values.push(data.personalEmergencyContact || null);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(now);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
                 role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
                 position, address, personal_emergency_contact as "personalEmergencyContact", 
                 is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] ? new UserEntity(result.rows[0]) : null;
  }

  /**
   * Static database method: Find users by organization ID
   */
  static async findByOrgId(orgId: string, limit: number = 100, offset: number = 0): Promise<UserEntity[]> {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact", 
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    return result.rows.map(row => new UserEntity(row));
  }

  /**
   * Static database method: Get all emails for duplicate checking
   */
  static async getAllEmails(): Promise<string[]> {
    const result = await query(
      `SELECT LOWER(email) as email FROM users WHERE is_active = true`
    );
    return result.rows.map(row => row.email);
  }
}
