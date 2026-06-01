"use strict";
/**
 * Organization Entity
 * Represents an organization in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationEntity = void 0;
class OrganizationEntity {
    constructor(data) {
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
    isOrganizationActive() {
        return this.isActive;
    }
    /**
     * Check if email domain is configured
     */
    hasEmailDomain() {
        return !!this.emailDomain;
    }
    /**
     * Check if email matches organization domain
     */
    isEmailInDomain(email) {
        if (!this.emailDomain) {
            return false;
        }
        const emailDomain = email.split('@')[1];
        return emailDomain === this.emailDomain;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
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
exports.OrganizationEntity = OrganizationEntity;
//# sourceMappingURL=Organization.js.map