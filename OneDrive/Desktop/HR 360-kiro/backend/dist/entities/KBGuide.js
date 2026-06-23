"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KBGuideEntity = void 0;
const database_1 = require("../config/database");
class KBGuideEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO kb_guides (org_id, title, category, type, content, media_urls, is_required, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired",
                 version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"`, [data.orgId, data.title, data.category, data.type, data.content, data.mediaUrls, data.isRequired, data.createdBy, data.updatedBy]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired",
              version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"
       FROM kb_guides WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByOrgId(orgId, category, type, limit = 50, offset = 0) {
        let sql = `SELECT id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired", is_archived as "isArchived",
                      version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"
               FROM kb_guides WHERE org_id = $1 AND is_archived = false`;
        const params = [orgId];
        let paramCount = 2;
        if (category) {
            sql += ` AND category = $${paramCount++}`;
            params.push(category);
        }
        if (type) {
            sql += ` AND type = $${paramCount++}`;
            params.push(type);
        }
        sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
    static async countByOrgId(orgId, category, type) {
        let sql = `SELECT COUNT(*) as count FROM kb_guides WHERE org_id = $1`;
        const params = [orgId];
        let paramCount = 2;
        if (category) {
            sql += ` AND category = $${paramCount++}`;
            params.push(category);
        }
        if (type) {
            sql += ` AND type = $${paramCount++}`;
            params.push(type);
        }
        const result = await (0, database_1.query)(sql, params);
        return parseInt(result.rows[0].count);
    }
    static async update(id, data, updatedBy) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.title) {
            updates.push(`title = $${paramCount++}`);
            values.push(data.title);
        }
        if (data.content) {
            updates.push(`content = $${paramCount++}`);
            values.push(data.content);
        }
        if (data.isRequired !== undefined) {
            updates.push(`is_required = $${paramCount++}`);
            values.push(data.isRequired);
        }
        if (data.isArchived !== undefined) {
            updates.push(`is_archived = $${paramCount++}`);
            values.push(data.isArchived);
        }
        if (updates.length === 0)
            return this.findById(id);
        updates.push(`version = version + 1`);
        updates.push(`updated_by = $${paramCount++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE kb_guides SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", title, category, type, content, media_urls as "mediaUrls", is_required as "isRequired", is_archived as "isArchived",
                 version, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt", updated_by as "updatedBy"`, values);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const result = await (0, database_1.query)(`DELETE FROM kb_guides WHERE id = $1`, [id]);
        return result.rowCount > 0;
    }
}
exports.KBGuideEntity = KBGuideEntity;
//# sourceMappingURL=KBGuide.js.map