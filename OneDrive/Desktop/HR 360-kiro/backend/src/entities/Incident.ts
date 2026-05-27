import { query } from '../config/database';

export interface Incident {
  id: string;
  orgId: string;
  type: string;
  severity: 'advisory' | 'watch' | 'emergency';
  startTime: Date;
  endTime?: Date;
  isDrill: boolean;
  createdBy: string;
}

export class IncidentEntity {
  static async create(data: Omit<Incident, 'id'>): Promise<Incident> {
    const result = await query(
      `INSERT INTO incidents (org_id, type, severity, start_time, end_time, is_drill, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                 is_drill as "isDrill", created_by as "createdBy"`,
      [data.orgId, data.type, data.severity, data.startTime, data.endTime, data.isDrill, data.createdBy]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Incident | null> {
    const result = await query(
      `SELECT id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
              is_drill as "isDrill", created_by as "createdBy"
       FROM incidents WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByOrgId(orgId: string, isDrill?: boolean, limit: number = 50, offset: number = 0): Promise<Incident[]> {
    let sql = `SELECT id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                      is_drill as "isDrill", created_by as "createdBy"
               FROM incidents WHERE org_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (isDrill !== undefined) {
      sql += ` AND is_drill = $${paramCount++}`;
      params.push(isDrill);
    }

    sql += ` ORDER BY start_time DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  static async countByOrgId(orgId: string, isDrill?: boolean): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM incidents WHERE org_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (isDrill !== undefined) {
      sql += ` AND is_drill = $${paramCount++}`;
      params.push(isDrill);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  static async update(id: string, data: Partial<Incident>): Promise<Incident | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.endTime) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(data.endTime);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);

    const result = await query(
      `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", type, severity, start_time as "startTime", end_time as "endTime",
                 is_drill as "isDrill", created_by as "createdBy"`,
      values
    );
    return result.rows[0] || null;
  }
}
