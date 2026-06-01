/**
 * Organization Entity
 * Represents an organization in the system
 */

export interface Organization {
  id: string;
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateOrganizationInput {
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive?: boolean;
}

export class OrganizationEntity implements Organization {
  id: string;
  name: string;
  emailDomain?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;

  constructor(data: Organization) {
    this.id = data.id;
    this.name = data.name;
    this.emailDomain = data.emailDomain;
    this.logoUrl = data.logoUrl;
    this.description = data.description;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
  }

  /**
   * Check if organization is active
   */
  isOrganizationActive(): boolean {
    return this.isActive;
  }

  /**
   * Check if email domain is configured
   */
  hasEmailDomain(): boolean {
    return !!this.emailDomain;
  }

  /**
   * Check if email matches organization domain
   */
  isEmailInDomain(email: string): boolean {
    if (!this.emailDomain) {
      return false;
    }

    const emailDomain = email.split('@')[1];
    return emailDomain === this.emailDomain;
  }

  /**
   * Convert to JSON
   */
  toJSON(): Organization {
    return {
      id: this.id,
      name: this.name,
      emailDomain: this.emailDomain,
      logoUrl: this.logoUrl,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
    };
  }
}
