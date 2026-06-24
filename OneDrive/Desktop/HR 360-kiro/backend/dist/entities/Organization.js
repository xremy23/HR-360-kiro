"use strict";
/**
 * Organization Entity
 * Represents an organization in the system
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
exports.OrganizationEntity = void 0;
const database_1 = require("../config/database");
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
    /**
     * Static database method: Find organization by ID
     */
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, name, email_domain as "emailDomain", logo_url as "logoUrl", description,
              is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM organizations WHERE id = $1`, [id]);
        return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
    }
    /**
     * Static database method: Find organization by invite code
     */
    static async findByInviteCode(inviteCode) {
        const result = await (0, database_1.query)(`SELECT o.id, o.name, o.email_domain as "emailDomain", o.logo_url as "logoUrl", o.description,
              o.is_active as "isActive", o.created_at as "createdAt", o.updated_at as "updatedAt", o.created_by as "createdBy"
       FROM organizations o
       LEFT JOIN organization_invites oi ON o.id = oi.organization_id
       WHERE oi.code = $1 AND oi.is_active = true`, [inviteCode]);
        return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
    }
    /**
     * Static database method: Create organization
     */
    static async create(data) {
        const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
        const id = uuidv4();
        const now = new Date();
        const result = await (0, database_1.query)(`INSERT INTO organizations (id, name, email_domain, logo_url, description, is_active, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8)
       RETURNING id, name, email_domain as "emailDomain", logo_url as "logoUrl", description,
                 is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`, [id, data.name, data.emailDomain || null, data.logoUrl || null, data.description || null, now, now, data.createdBy || null]);
        return new OrganizationEntity(result.rows[0]);
    }
    /**
     * Static database method: Update organization
     */
    static async update(id, data) {
        const now = new Date();
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.emailDomain !== undefined) {
            fields.push(`email_domain = $${paramCount++}`);
            values.push(data.emailDomain || null);
        }
        if (data.logoUrl !== undefined) {
            fields.push(`logo_url = $${paramCount++}`);
            values.push(data.logoUrl || null);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(data.description || null);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.isActive);
        }
        fields.push(`updated_at = $${paramCount++}`);
        values.push(now);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email_domain as "emailDomain", logo_url as "logoUrl", description,
                 is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`, values);
        return result.rows[0] ? new OrganizationEntity(result.rows[0]) : null;
    }
}
exports.OrganizationEntity = OrganizationEntity;
//# sourceMappingURL=Organization.js.map