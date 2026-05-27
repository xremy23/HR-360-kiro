import { query } from '../config/database';

export interface Alert {
  id: string;
  orgId: string;
  teamIds?: string[];
  title: string;
  message: string;
  severity: 'advisory' | 'watch' | 'emergency';
  type: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isDrill: boolean;
  incidentId?: string;
}

export class AlertEntity {
  static async create(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const result = await query(
      `INSERT INTO alerts (org_id, team_ids, title, message, severity, type, created_by, expires_at, is_drill, incident_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
                 created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"`,
      [data.orgId, data.teamIds, data.title, data.message, data.severity, data.type, data.createdBy, 
       data.expiresAt, data.isDrill, data.incidentId]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Alert | null> {
    const result = await query(
      `SELECT id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
              created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"
       FROM alerts WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByOrgId(orgId: string, isDrill?: boolean, severity?: string, limit: number = 50, offset: number = 0): Promise<Alert[]> {
    let sql = `SELECT id, org_id as "orgId", team_ids as "teamIds", title, message, severity, type, created_by as "createdBy",
                      created_at as "createdAt", expires_at as "expiresAt", is_drill as "isDrill", incident_id as "incidentId"
               FROM alerts WHERE org_id = $1`;
    const params: any[] = [orgId];
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

    const result = await query(sql, params);
    return result.rows;
  }

  static async countByOrgId(orgId: string, isDrill?: boolean, severity?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM alerts WHERE org_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 2;

    if (isDrill !== undefined) {
      sql += ` AND is_drill = $${paramCount++}`;
      params.push(isDrill);
    }
    if (severity) {
      sql += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}
