"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationEntity = void 0;
const database_1 = require("../config/database");
class OrganizationEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO organizations (name, email_domain, invite_code, logo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"`, [data.name, data.emailDomain, data.inviteCode, data.logo]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"
       FROM organizations WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByInviteCode(inviteCode) {
        const result = await (0, database_1.query)(`SELECT id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"
       FROM organizations WHERE invite_code = $1`, [inviteCode]);
        return result.rows[0] || null;
    }
    static async update(id, data) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.name) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.emailDomain) {
            updates.push(`email_domain = $${paramCount++}`);
            values.push(data.emailDomain);
        }
        if (data.logo) {
            updates.push(`logo = $${paramCount++}`);
            values.push(data.logo);
        }
        if (updates.length === 0)
            return this.findById(id);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email_domain as "emailDomain", invite_code as "inviteCode", logo, created_at as "createdAt", updated_at as "updatedAt"`, values);
        return result.rows[0] || null;
    }
}
exports.OrganizationEntity = OrganizationEntity;
//# sourceMappingURL=Organization.js.map