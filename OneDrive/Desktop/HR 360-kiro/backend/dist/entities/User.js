"use strict";
/**
 * User Entity
 * Represents a user in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
class UserEntity {
    constructor(data) {
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
    getFullName() {
        const parts = [this.firstName, this.lastName].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : this.email;
    }
    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.role === 'admin';
    }
    /**
     * Check if user is HR
     */
    isHR() {
        return this.role === 'hr';
    }
    /**
     * Check if user is employee
     */
    isEmployee() {
        return this.role === 'employee';
    }
    /**
     * Check if user is guest
     */
    isGuest() {
        return this.role === 'guest';
    }
    /**
     * Convert to JSON (exclude sensitive data)
     */
    toJSON() {
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
exports.UserEntity = UserEntity;
//# sourceMappingURL=User.js.map