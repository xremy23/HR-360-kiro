/**
 * User Service
 * Handles user-related business logic
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { User, UserEntity, CreateUserInput, UpdateUserInput, UserProfile } from '../entities/User';
import { logger } from './monitoringService';

class UserService {
  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const id = input.id || uuidv4();
      const now = new Date();

      const result = await query(
        `INSERT INTO users (
          id, email, first_name, last_name, phone, role, 
          organization_id, department_id, team_id, position, 
          address, personal_emergency_contact, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          id,
          input.email,
          input.firstName || null,
          input.lastName || null,
          input.phone || null,
          input.role || 'guest',
          input.organizationId || null,
          input.departmentId || null,
          input.teamId || null,
          input.position || null,
          input.address || null,
          input.personalEmergencyContact || null,
          true,
          now,
          now,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create user', { email: input.email, error });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get user by ID', { id, error });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get user by email', { email, error });
      throw error;
    }
  }

  /**
   * Get user profile with organization and team details
   */
  async getUserProfile(id: string): Promise<UserProfile | null> {
    try {
      const result = await query(
        `SELECT 
          u.*,
          o.name as organization_name,
          d.name as department_name,
          t.name as team_name,
          t_head.first_name as team_head_first_name,
          t_head.last_name as team_head_last_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN users t_head ON t.head_id = t_head.id
        WHERE u.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const user = this.mapRowToUser(row);

      return {
        ...user,
        organizationName: row.organization_name,
        departmentName: row.department_name,
        teamName: row.team_name,
        teamHeadName: row.team_head_first_name && row.team_head_last_name 
          ? `${row.team_head_first_name} ${row.team_head_last_name}`
          : undefined,
      };
    } catch (error) {
      logger.error('Failed to get user profile', { id, error });
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (input.firstName !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(input.firstName);
      }

      if (input.lastName !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(input.lastName);
      }

      if (input.phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(input.phone);
      }

      if (input.avatarUrl !== undefined) {
        updates.push(`avatar_url = $${paramCount++}`);
        values.push(input.avatarUrl);
      }

      if (input.organizationId !== undefined) {
        updates.push(`organization_id = $${paramCount++}`);
        values.push(input.organizationId || null);
      }

      if (input.departmentId !== undefined) {
        // If departmentId looks like a name string (not a UUID), get or create it
        let deptId = input.departmentId;
        if (input.departmentId && !input.departmentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // It's a name, get or create the department
          const user = await this.getUserById(id);
          if (user && user.organizationId) {
            deptId = await this.getOrCreateDepartment(user.organizationId, input.departmentId) || input.departmentId;
          }
        }
        updates.push(`department_id = $${paramCount++}`);
        values.push(deptId || null);
      }

      if (input.teamId !== undefined) {
        // If teamId looks like a name string (not a UUID), get or create it
        let teamId = input.teamId;
        if (input.teamId && !input.teamId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // It's a name, get or create the team
          const user = await this.getUserById(id);
          if (user && user.organizationId) {
            teamId = await this.getOrCreateTeam(user.organizationId, input.teamId) || input.teamId;
          }
        }
        updates.push(`team_id = $${paramCount++}`);
        values.push(teamId || null);
      }

      if (input.position !== undefined) {
        updates.push(`position = $${paramCount++}`);
        values.push(input.position);
      }

      if (input.address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(input.address);
      }

      if (input.personalEmergencyContact !== undefined) {
        updates.push(`personal_emergency_contact = $${paramCount++}`);
        values.push(input.personalEmergencyContact);
      }

      if (input.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(input.isActive);
      }

      if (updates.length === 0) {
        return this.getUserById(id) as Promise<User>;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update user', { id, error });
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: string): Promise<User> {
    try {
      // Normalize legacy 'hr' role to 'hr_admin'
      const normalizedRole = role === 'hr' ? 'hr_admin' : role;

      const result = await query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [normalizedRole, id]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update user role', { id, role, error });
      throw error;
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    } catch (error) {
      logger.error('Failed to update last login', { id, error });
      // Don't throw - this is not critical
    }
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(
    organizationId: string,
    options?: {
      page?: number;
      pageSize?: number;
      search?: string;
      role?: string;
    }
  ): Promise<{ users: User[]; total: number }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      let whereClause = 'WHERE organization_id = $1 AND is_active = true';
      const params: any[] = [organizationId];
      let paramCount = 2;

      if (options?.search) {
        whereClause += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      if (options?.role) {
        whereClause += ` AND role = $${paramCount}`;
        params.push(options.role);
        paramCount++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, pageSize, offset]
      );

      const users = result.rows.map(row => this.mapRowToUser(row));

      return { users, total };
    } catch (error) {
      logger.error('Failed to get organization users', { organizationId, error });
      throw error;
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<User[]> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE team_id = $1 AND is_active = true ORDER BY first_name, last_name',
        [teamId]
      );

      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      logger.error('Failed to get team members', { teamId, error });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
    } catch (error) {
      logger.error('Failed to delete user', { id, error });
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [email]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check if user exists', { email, error });
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(organizationId: string, role: string): Promise<User[]> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE organization_id = $1 AND role = $2 AND is_active = true ORDER BY first_name, last_name',
        [organizationId, role]
      );

      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      logger.error('Failed to get users by role', { organizationId, role, error });
      throw error;
    }
  }

  /**
   * Get or create a department by name
   */
  private async getOrCreateDepartment(organizationId: string, departmentName: string): Promise<string | null> {
    if (!departmentName || departmentName.trim() === '') return null;
    
    try {
      // Try to find existing department
      const result = await query(
        `SELECT id FROM departments WHERE organization_id = $1 AND name = $2 LIMIT 1`,
        [organizationId, departmentName]
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Create new department
      const id = uuidv4();
      const now = new Date();
      await query(
        `INSERT INTO departments (id, organization_id, name, created_at, updated_at, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, organizationId, departmentName, now, now]
      );

      return id;
    } catch (error) {
      logger.error('Failed to get or create department', { organizationId, departmentName, error });
      return null;
    }
  }

  /**
   * Get or create a team by name
   */
  private async getOrCreateTeam(organizationId: string, teamName: string): Promise<string | null> {
    if (!teamName || teamName.trim() === '') return null;
    
    try {
      // Try to find existing team
      const result = await query(
        `SELECT id FROM teams WHERE organization_id = $1 AND name = $2 LIMIT 1`,
        [organizationId, teamName]
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Create new team
      const id = uuidv4();
      const now = new Date();
      await query(
        `INSERT INTO teams (id, organization_id, name, created_at, updated_at, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, organizationId, teamName, now, now]
      );

      return id;
    } catch (error) {
      logger.error('Failed to get or create team', { organizationId, teamName, error });
      return null;
    }
  }

  /**
   * Map database row to User entity
   */
  private mapRowToUser(row: any): User {
    return new UserEntity({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      role: row.role,
      organizationId: row.organization_id,
      departmentId: row.department_id,
      teamId: row.team_id,
      position: row.position,
      address: row.address,
      personalEmergencyContact: row.personal_emergency_contact,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}

export const userService = new UserService();
