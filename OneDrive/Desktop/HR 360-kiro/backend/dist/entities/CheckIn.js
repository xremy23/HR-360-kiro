"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInEntity = void 0;
const database_1 = require("../config/database");
class CheckInEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO check_ins (user_id, team_id, status, notes, latitude, longitude, incident_id, is_drill)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id as "userId", team_id as "teamId", status, notes, latitude, longitude, 
                 timestamp, incident_id as "incidentId", is_drill as "isDrill"`, [data.userId, data.teamId, data.status, data.notes, data.latitude, data.longitude, data.incidentId, data.isDrill]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", team_id as "teamId", status, notes, latitude, longitude,
              timestamp, incident_id as "incidentId", is_drill as "isDrill"
       FROM check_ins WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByUserId(userId, limit = 50, offset = 0) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", team_id as "teamId", status, notes, latitude, longitude,
              timestamp, incident_id as "incidentId", is_drill as "isDrill"
       FROM check_ins WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        return result.rows;
    }
    static async findByTeamId(teamId, incidentId, isDrill) {
        let sql = `SELECT id, user_id as "userId", team_id as "teamId", status, notes, latitude, longitude,
                      timestamp, incident_id as "incidentId", is_drill as "isDrill"
               FROM check_ins WHERE team_id = $1`;
        const params = [teamId];
        let paramCount = 2;
        if (incidentId) {
            sql += ` AND incident_id = $${paramCount++}`;
            params.push(incidentId);
        }
        if (isDrill !== undefined) {
            sql += ` AND is_drill = $${paramCount++}`;
            params.push(isDrill);
        }
        sql += ` ORDER BY timestamp DESC`;
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
    static async findByIncidentId(incidentId) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", team_id as "teamId", status, notes, latitude, longitude,
              timestamp, incident_id as "incidentId", is_drill as "isDrill"
       FROM check_ins WHERE incident_id = $1 ORDER BY timestamp DESC`, [incidentId]);
        return result.rows;
    }
    static async countByIncidentIdAndStatus(incidentId, status) {
        const result = await (0, database_1.query)(`SELECT COUNT(*) as count FROM check_ins WHERE incident_id = $1 AND status = $2`, [incidentId, status]);
        return parseInt(result.rows[0].count);
    }
    static async getIncidentSummary(incidentId) {
        const result = await (0, database_1.query)(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'safe' THEN 1 ELSE 0 END) as safe,
        SUM(CASE WHEN status = 'need_help' THEN 1 ELSE 0 END) as need_help,
        SUM(CASE WHEN status = 'sos' THEN 1 ELSE 0 END) as sos
       FROM check_ins WHERE incident_id = $1`, [incidentId]);
        return result.rows[0];
    }
}
exports.CheckInEntity = CheckInEntity;
//# sourceMappingURL=CheckIn.js.map