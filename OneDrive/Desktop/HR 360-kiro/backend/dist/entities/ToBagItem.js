"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToBagItemEntity = void 0;
const database_1 = require("../config/database");
class ToBagItemEntity {
    static async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO tobag_items (user_id, name, category, quantity, is_packed, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
                 created_at as "createdAt", updated_at as "updatedAt"`, [data.userId, data.name, data.category, data.quantity, data.isPacked, data.notes]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM tobag_items WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    static async findByUserId(userId) {
        const result = await (0, database_1.query)(`SELECT id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM tobag_items WHERE user_id = $1 ORDER BY category, name`, [userId]);
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
        if (data.quantity !== undefined) {
            updates.push(`quantity = $${paramCount++}`);
            values.push(data.quantity);
        }
        if (data.isPacked !== undefined) {
            updates.push(`is_packed = $${paramCount++}`);
            values.push(data.isPacked);
        }
        if (data.notes) {
            updates.push(`notes = $${paramCount++}`);
            values.push(data.notes);
        }
        if (updates.length === 0)
            return this.findById(id);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id, userId);
        const result = await (0, database_1.query)(`UPDATE tobag_items SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
                 created_at as "createdAt", updated_at as "updatedAt"`, values);
        return result.rows[0] || null;
    }
    static async delete(id, userId) {
        const result = await (0, database_1.query)(`DELETE FROM tobag_items WHERE id = $1 AND user_id = $2`, [id, userId]);
        return result.rowCount > 0;
    }
}
exports.ToBagItemEntity = ToBagItemEntity;
//# sourceMappingURL=ToBagItem.js.map