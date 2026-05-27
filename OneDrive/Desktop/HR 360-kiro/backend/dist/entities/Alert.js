"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertEntity = void 0;
const database_1 = require("../config/database");
class AlertEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO alerts (org_id, team_ids, title, message, severity, type, created_by, expires_at, is_drill, incident_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
                 created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"`, [data.orgId, data.teamIds, data.title, data.message, data.severity, data.type, data.createdBy,
            data.expiresAt, data.isDrill, data.incidentId]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
              created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"
       FROM alerts WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByOrgId(orgId, isDrill, severity, limit = 50, offset = 0) {
        let sql = `SELECT id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
                      created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"
               FROM alerts WHERE org_id = $1`;
        const params = [orgId];
        let paramCount = 2;
        if (isDrill !== undefined) {
            sql += ` AND is_drill = $${paramCount++}`;
            params.push(isDrill);
        }
        if (severity) {
            sql += ` AND severity = $${paramCount++}`;
            params.push(severity);
        }
        sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
    static async countByOrgId(orgId, isDrill, severity) {
        let sql = `SELECT COUNT(*) as count FROM alerts WHERE org_id = $1`;
        const params = [orgId];
        let paramCount = 2;
        if (isDrill !== undefined) {
            sql += ` AND is_drill = $${paramCount++}`;
            params.push(isDrill);
        }
        if (severity) {
            sql += ` AND severity = $${paramCount++}`;
            params.push(severity);
        }
        const result = await (0, database_1.query)(sql, params);
        return parseInt(result.rows[0].count);
    }
}
exports.AlertEntity = AlertEntity;
//# sourceMappingURL=Alert.js.map