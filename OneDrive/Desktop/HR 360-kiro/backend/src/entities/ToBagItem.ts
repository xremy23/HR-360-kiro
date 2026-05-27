import { query } from '../config/database';

export interface ToBagItem {
  id: string;
  userId: string;
  name: string;
  category: 'documents' | 'supplies' | 'electronics' | 'clothing' | 'other';
  quantity: number;
  isPacked: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ToBagItemEntity {
  static async create(data: Omit<ToBagItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToBagItem> {
    const result = await query(
      `INSERT INTO tobag_items (user_id, name, category, quantity, is_packed, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [data.userId, data.name, data.category, data.quantity, data.isPacked, data.notes]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<ToBagItem | null> {
    const result = await query(
      `SELECT id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM tobag_items WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<ToBagItem[]> {
    const result = await query(
      `SELECT id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM tobag_items WHERE user_id = $1 ORDER BY category, name`,
      [userId]
    );
    return result.rows;
  }

  static async update(id: string, userId: string, data: Partial<ToBagItem>): Promise<ToBagItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
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

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const result = await query(
      `UPDATE tobag_items SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, user_id as "userId", name, category, quantity, is_packed as "isPacked", notes,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM tobag_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rowCount! > 0;
  }
}
