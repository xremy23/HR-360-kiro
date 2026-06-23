"use strict";
/**
 * CICT Safety Portal - User Entity
 * Represents a user in the disaster preparedness and emergency response system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const database_1 = require("../config/database");
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
     * Check if user is super admin
     */
    isSuperAdmin() {
        return this.role === 'super_admin';
    }
    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.role === 'admin';
    }
    /**
     * Check if user is HR admin
     */
    isHRAdmin() {
        return this.role === 'hr_admin';
    }
    /**
     * Check if user is Safety admin
     */
    isSafetyAdmin() {
        return this.role === 'safety_admin';
    }
    /**
     * Check if user is Workplace admin
     */
    isWorkplaceAdmin() {
        return this.role === 'workplace_admin';
    }
    /**
     * Check if user is HR
     */
    isHR() {
        return this.role === 'hr_admin';
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
    /**
     * Static database method: Find user by ID
     */
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact",
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`, [id]);
        return result.rows[0] ? new UserEntity(result.rows[0]) : null;
    }
    /**
     * Static database method: Find user by email
     */
    static async findByEmail(email) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact",
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`, [email]);
        return result.rows[0] ? new UserEntity(result.rows[0]) : null;
    }
    /**
     * Static database method: Create user
     */
    static async create(data) {
        const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
        const id = uuidv4();
        const now = new Date();
        const result = await (0, database_1.query)(`INSERT INTO users (id, email, first_name, last_name, phone, role, organization_id,
                         department_id, team_id, position, address, personal_emergency_contact,
                         is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
                 role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
                 position, address, personal_emergency_contact as "personalEmergencyContact",
                 is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"`, [
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
        ]);
        return new UserEntity(result.rows[0]);
    }
    /**
     * Static database method: Update user
     */
    static async update(id, data) {
        const now = new Date();
        const fields = [];
        const values = [];
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
        const result = await (0, database_1.query)(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
                 role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
                 position, address, personal_emergency_contact as "personalEmergencyContact",
                 is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"`, values);
        return result.rows[0] ? new UserEntity(result.rows[0]) : null;
    }
    /**
     * Static database method: Find users by organization ID
     */
    static async findByOrgId(orgId, limit = 100, offset = 0) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", phone, avatar_url as "avatarUrl",
              role, organization_id as "organizationId", department_id as "departmentId", team_id as "teamId",
              position, address, personal_emergency_contact as "personalEmergencyContact",
              is_active as "isActive", last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [orgId, limit, offset]);
        return result.rows.map(row => new UserEntity(row));
    }
    /**
     * Static database method: Get all emails for duplicate checking
     */
    static async getAllEmails() {
        const result = await (0, database_1.query)(`SELECT LOWER(email) as email FROM users WHERE is_active = true`);
        return result.rows.map(row => row.email);
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=User.js.map