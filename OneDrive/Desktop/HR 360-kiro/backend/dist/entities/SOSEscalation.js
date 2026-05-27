"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOSEscalationEntity = void 0;
const database_1 = require("../config/database");
class SOSEscalationEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO sos_escalations (user_id, status, notes)
       VALUES ($1, $2, $3)
       RETURNING id, user_id as "userId", initiated_at as "initiatedAt", status,
                 manager_notified_at as "managerNotifiedAt", emergency_contacts_notified_at as "emergencyContactsNotifiedAt",
                 team_notified_at as "teamNotifiedAt", resolved_at as "resolvedAt", notes`, [data.userId, data.status, data.notes]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", initiated_at as "initiatedAt", status,
              manager_notified_at as "managerNotifiedAt", emergency_contacts_notified_at as "emergencyContactsNotifiedAt",
              team_notified_at as "teamNotifiedAt", resolved_at as "resolvedAt", notes
       FROM sos_escalations WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByOrgId(orgId) {
        const result = await (0, database_1.query)(`SELECT s.id, s.user_id as "userId", s.initiated_at as "initiatedAt", s.status,
              s.manager_notified_at as "managerNotifiedAt", s.emergency_contacts_notified_at as "emergencyContactsNotifiedAt",
              s.team_notified_at as "teamNotifiedAt", s.resolved_at as "resolvedAt", s.notes
       FROM sos_escalations s
       JOIN users u ON s.user_id = u.id
       WHERE u.org_id = $1
       ORDER BY s.initiated_at DESC`, [orgId]);
        return result.rows;
    }
    static async update(id, data) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.status) {
            updates.push(`status = $${paramCount++}`);
            values.push(data.status);
        }
        if (data.managerNotifiedAt) {
            updates.push(`manager_notified_at = $${paramCount++}`);
            values.push(data.managerNotifiedAt);
        }
        if (data.emergencyContactsNotifiedAt) {
            updates.push(`emergency_contacts_notified_at = $${paramCount++}`);
            values.push(data.emergencyContactsNotifiedAt);
        }
        if (data.teamNotifiedAt) {
            updates.push(`team_notified_at = $${paramCount++}`);
            values.push(data.teamNotifiedAt);
        }
        if (data.resolvedAt) {
            updates.push(`resolved_at = $${paramCount++}`);
            values.push(data.resolvedAt);
        }
        if (updates.length === 0)
            return this.findById(id);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE sos_escalations SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, user_id as "userId", initiated_at as "initiatedAt", status,
                 manager_notified_at as "managerNotifiedAt", emergency_contacts_notified_at as "emergencyContactsNotifiedAt",
                 team_notified_at as "teamNotifiedAt", resolved_at as "resolvedAt", notes`, values);
        return result.rows[0] || null;
    }
}
exports.SOSEscalationEntity = SOSEscalationEntity;
//# sourceMappingURL=SOSEscalation.js.map