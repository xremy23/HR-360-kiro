"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactEntity = void 0;
const database_1 = require("../config/database");
class ContactEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO contacts (user_id, name, type, phone, email, category, address, latitude, longitude, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id as "userId", name, type, phone, email, category, address, latitude, longitude, 
                 is_pinned as "isPinned", created_at as "createdAt"`, [data.userId, data.name, data.type, data.phone, data.email, data.category, data.address,
            data.latitude, data.longitude, data.isPinned]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", name, type, phone, email, category, address, latitude, longitude,
              is_pinned as "isPinned", created_at as "createdAt"
       FROM contacts WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByUserId(userId) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", name, type, phone, email, category, address, latitude, longitude,
              is_pinned as "isPinned", created_at as "createdAt"
       FROM contacts WHERE user_id = $1 ORDER BY is_pinned DESC, created_at DESC`, [userId]);
        return result.rows;
    }
    static async update(id, userId, data) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.name) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.phone) {
            updates.push(`phone = $${paramCount++}`);
            values.push(data.phone);
        }
        if (data.isPinned !== undefined) {
            updates.push(`is_pinned = $${paramCount++}`);
            values.push(data.isPinned);
        }
        if (updates.length === 0)
            return this.findById(id);
        values.push(id, userId);
        const result = await (0, database_1.query)(`UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, user_id as "userId", name, type, phone, email, category, address, latitude, longitude,
                 is_pinned as "isPinned", created_at as "createdAt"`, values);
        return result.rows[0] || null;
    }
    static async delete(id, userId) {
        const result = await (0, database_1.query)(`DELETE FROM contacts WHERE id = $1 AND user_id = $2`, [id, userId]);
        return result.rowCount > 0;
    }
    static async findNearby(latitude, longitude, radius = 5) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", name, type, phone, email, category, address, latitude, longitude,
              is_pinned as "isPinned", created_at as "createdAt",
              (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
               sin(radians($1)) * sin(radians(latitude)))) AS distance
       FROM contacts
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       HAVING distance < $3
       ORDER BY distance`, [latitude, longitude, radius]);
        return result.rows;
    }
}
exports.ContactEntity = ContactEntity;
//# sourceMappingURL=Contact.js.map