import { query } from '../config/database';

export interface BulkImportJob {
  id: string;
  orgId: string;
  createdBy: string;
  fileName: string;
  fileType: 'csv' | 'xlsx';
  columnMapping: Record<string, string>; // { sourceColumn: targetField }
  importSettings: {
    targetOrganization: string;
    defaultRole: 'employee' | 'manager' | 'admin' | 'hr_admin' | 'safety_admin';
    skipDuplicates: boolean;
    requirePhoneValidation: boolean;
    autoGenerateUsernames?: boolean;
    sendWelcomeEmails?: boolean;
  };
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  executionDetails: {
    errors: { rowNum: number; email?: string; error: string }[];
    warnings: { rowNum: number; email?: string; warning: string }[];
    successEmails: string[];
  };
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errorReport?: string;
  createdAt: Date;
  completedAt?: Date;
  reportStorageUrl?: string; // GCS path to report CSV
}

export class BulkImportJobEntity {
  static async create(
    data: Omit<BulkImportJob, 'id' | 'createdAt' | 'completedAt' | 'successCount' | 'errorCount' | 'warningCount' | 'status'>
  ): Promise<BulkImportJob> {
    const result = await query(
      `INSERT INTO bulk_import_jobs 
       (org_id, created_by, file_name, file_type, column_mapping, import_settings, total_rows, 
        success_count, error_count, warning_count, execution_details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, org_id as "orgId", created_by as "createdBy", file_name as "fileName", 
                 file_type as "fileType", column_mapping as "columnMapping", import_settings as "importSettings",
                 total_rows as "totalRows", success_count as "successCount", error_count as "errorCount",
                 warning_count as "warningCount", execution_details as "executionDetails", status,
                 error_report as "errorReport", created_at as "createdAt", completed_at as "completedAt",
                 report_storage_url as "reportStorageUrl"`,
      [
        data.orgId,
        data.createdBy,
        data.fileName,
        data.fileType,
        JSON.stringify(data.columnMapping),
        JSON.stringify(data.importSettings),
        data.totalRows,
        0,
        0,
        0,
        JSON.stringify(data.executionDetails),
        'pending',
      ]
    );

    return {
      ...result.rows[0],
      columnMapping: result.rows[0].columnMapping ? JSON.parse(result.rows[0].columnMapping) : {},
      importSettings: result.rows[0].importSettings ? JSON.parse(result.rows[0].importSettings) : {},
      executionDetails: result.rows[0].executionDetails ? JSON.parse(result.rows[0].executionDetails) : {},
    };
  }

  static async findById(id: string): Promise<BulkImportJob | null> {
    const result = await query(
      `SELECT id, org_id as "orgId", created_by as "createdBy", file_name as "fileName", 
              file_type as "fileType", column_mapping as "columnMapping", import_settings as "importSettings",
              total_rows as "totalRows", success_count as "successCount", error_count as "errorCount",
              warning_count as "warningCount", execution_details as "executionDetails", status,
              error_report as "errorReport", created_at as "createdAt", completed_at as "completedAt",
              report_storage_url as "reportStorageUrl"
       FROM bulk_import_jobs WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) return null;

    return {
      ...result.rows[0],
      columnMapping: result.rows[0].columnMapping ? JSON.parse(result.rows[0].columnMapping) : {},
      importSettings: result.rows[0].importSettings ? JSON.parse(result.rows[0].importSettings) : {},
      executionDetails: result.rows[0].executionDetails ? JSON.parse(result.rows[0].executionDetails) : {},
    };
  }

  static async findByOrgId(orgId: string, limit: number = 50, offset: number = 0): Promise<BulkImportJob[]> {
    const result = await query(
      `SELECT id, org_id as "orgId", created_by as "createdBy", file_name as "fileName", 
              file_type as "fileType", column_mapping as "columnMapping", import_settings as "importSettings",
              total_rows as "totalRows", success_count as "successCount", error_count as "errorCount",
              warning_count as "warningCount", execution_details as "executionDetails", status,
              error_report as "errorReport", created_at as "createdAt", completed_at as "completedAt",
              report_storage_url as "reportStorageUrl"
       FROM bulk_import_jobs WHERE org_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );

    return result.rows.map((row: any) => ({
      ...row,
      columnMapping: row.columnMapping ? JSON.parse(row.columnMapping) : {},
      importSettings: row.importSettings ? JSON.parse(row.importSettings) : {},
      executionDetails: row.executionDetails ? JSON.parse(row.executionDetails) : {},
    }));
  }

  static async update(
    id: string,
    data: Partial<Omit<BulkImportJob, 'id' | 'createdAt' | 'orgId' | 'createdBy'>>
  ): Promise<BulkImportJob | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(data.status);
    }
    if (data.successCount !== undefined) {
      updates.push(`success_count = $${paramCount++}`);
      params.push(data.successCount);
    }
    if (data.errorCount !== undefined) {
      updates.push(`error_count = $${paramCount++}`);
      params.push(data.errorCount);
    }
    if (data.warningCount !== undefined) {
      updates.push(`warning_count = $${paramCount++}`);
      params.push(data.warningCount);
    }
    if (data.executionDetails !== undefined) {
      updates.push(`execution_details = $${paramCount++}`);
      params.push(JSON.stringify(data.executionDetails));
    }
    if (data.errorReport !== undefined) {
      updates.push(`error_report = $${paramCount++}`);
      params.push(data.errorReport);
    }
    if (data.completedAt !== undefined) {
      updates.push(`completed_at = $${paramCount++}`);
      params.push(data.completedAt);
    }
    if (data.reportStorageUrl !== undefined) {
      updates.push(`report_storage_url = $${paramCount++}`);
      params.push(data.reportStorageUrl);
    }

    if (updates.length === 0) return this.findById(id);

    params.push(id);

    const result = await query(
      `UPDATE bulk_import_jobs SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, org_id as "orgId", created_by as "createdBy", file_name as "fileName", 
                 file_type as "fileType", column_mapping as "columnMapping", import_settings as "importSettings",
                 total_rows as "totalRows", success_count as "successCount", error_count as "errorCount",
                 warning_count as "warningCount", execution_details as "executionDetails", status,
                 error_report as "errorReport", created_at as "createdAt", completed_at as "completedAt",
                 report_storage_url as "reportStorageUrl"`,
      params
    );

    if (!result.rows[0]) return null;

    return {
      ...result.rows[0],
      columnMapping: result.rows[0].columnMapping ? JSON.parse(result.rows[0].columnMapping) : {},
      importSettings: result.rows[0].importSettings ? JSON.parse(result.rows[0].importSettings) : {},
      executionDetails: result.rows[0].executionDetails ? JSON.parse(result.rows[0].executionDetails) : {},
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM bulk_import_jobs WHERE id = $1`, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async countByOrgId(orgId: string): Promise<number> {
    const result = await query(`SELECT COUNT(*) as count FROM bulk_import_jobs WHERE org_id = $1`, [orgId]);
    return parseInt(result.rows[0].count);
  }

  static async countByStatus(orgId: string, status: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM bulk_import_jobs WHERE org_id = $1 AND status = $2`,
      [orgId, status]
    );
    return parseInt(result.rows[0].count);
  }
}
