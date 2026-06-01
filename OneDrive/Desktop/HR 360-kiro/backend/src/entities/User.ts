/**
 * User Entity
 * Represents a user in the system
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'hr' | 'employee' | 'guest';
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
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'admin' | 'hr' | 'employee' | 'guest';
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
  role: 'admin' | 'hr' | 'employee' | 'guest';
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
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Check if user is HR
   */
  isHR(): boolean {
    return this.role === 'hr';
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
}
