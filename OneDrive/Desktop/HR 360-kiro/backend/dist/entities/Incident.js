"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentEntity = void 0;
const database_1 = require("../config/database");
class IncidentEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO incidents (org_id, type, severity, start_time, end_time, is_drill, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                 is_drill as "isDrill", created_by as "createdBy"`, [data.orgId, data.type, data.severity, data.startTime, data.endTime, data.isDrill, data.createdBy]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
              is_drill as "isDrill", created_by as "createdBy"
       FROM incidents WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByOrgId(orgId, isDrill, limit = 50, offset = 0) {
        let sql = `SELECT id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                      is_drill as "isDrill", created_by as "createdBy"
               FROM incidents WHERE org_id = $1`;
        const params = [orgId];
        let paramCount = 2;
        if (isDrill !== undefined) {
            sql += ` AND is_drill = $${paramCount++}`;
            params.push(isDrill);
        }
        sql += ` ORDER BY start_time DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
    static async countByOrgId(orgId, isDrill) {
        let sql = `SELECT COUNT(*) as count FROM incidents WHERE org_id = $1`;
        const params = [orgId];
        let paramCount = 2;
        if (isDrill !== undefined) {
            sql += ` AND is_drill = $${paramCount++}`;
            params.push(isDrill);
        }
        const result = await (0, database_1.query)(sql, params);
        return parseInt(result.rows[0].count);
    }
    static async update(id, data) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.endTime) {
            updates.push(`end_time = $${paramCount++}`);
            values.push(data.endTime);
        }
        if (updates.length === 0)
            return this.findById(id);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                 is_drill as "isDrill", created_by as "createdBy"`, values);
        return result.rows[0] || null;
    }
}
exports.IncidentEntity = IncidentEntity;
//# sourceMappingURL=Incident.js.map