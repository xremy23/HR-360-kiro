"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const database_1 = require("../config/database");
class UserEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO users (email, first_name, last_name, role, org_id, team_id, department_id, address, latitude, longitude, biometric_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId", 
                 department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled", 
                 created_at as "createdAt", updated_at as "updatedAt"`, [data.email, data.firstName, data.lastName, data.role, data.orgId, data.teamId, data.departmentId,
            data.address, data.latitude, data.longitude, data.biometricEnabled]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByEmail(email) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`, [email]);
        return result.rows[0] || null;
    }
    static async findByOrgId(orgId, limit = 50, offset = 0) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE org_id = $1 LIMIT $2 OFFSET $3`, [orgId, limit, offset]);
        return result.rows;
    }
    static async findByTeamId(teamId) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
              department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE team_id = $1`, [teamId]);
        return result.rows;
    }
    static async update(id, data) {
        const updates = [];
        const values = [];
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
        if (updates.length === 0)
            return this.findById(id);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name as "firstName", last_name as "lastName", role, org_id as "orgId", team_id as "teamId",
                 department_id as "departmentId", address, latitude, longitude, biometric_enabled as "biometricEnabled",
                 created_at as "createdAt", updated_at as "updatedAt"`, values);
        return result.rows[0] || null;
    }
    static async countByOrgId(orgId) {
        const result = await (0, database_1.query)(`SELECT COUNT(*) as count FROM users WHERE org_id = $1`, [orgId]);
        return parseInt(result.rows[0].count);
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=User.js.map