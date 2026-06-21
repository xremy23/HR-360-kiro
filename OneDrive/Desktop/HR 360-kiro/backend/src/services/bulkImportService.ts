import { BulkImportJob, BulkImportJobEntity } from '../entities/BulkImportJob';
import { UserEntity } from '../entities/User';
import { logger } from './monitoringService';

interface ValidationResult {
  isValid: boolean;
  rowIndex: number;
  email?: string;
  errors: string[];
  warnings: string[];
}

export interface UserImportRow {
  [key: string]: string;
}

export interface ImportRow {
  [key: string]: string;
}

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

export class BulkImportService {
  /**
   * Parse CSV string into array of objects
   */
  parseCSV(csvContent: string): Promise<ImportRow[]> {
    return new Promise((resolve, reject) => {
      try {
        // Simple CSV parsing without external dependency
        const lines = csvContent.split('\n').filter((line) => line.trim());
        if (lines.length === 0) {
          resolve([]);
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const data: ImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const row: ImportRow = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          if (Object.values(row).some((v) => v)) {
            data.push(row);
          }
        }

        resolve(data);
      } catch (error: any) {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  }

  /**
   * Parse Excel file (requires xlsx library)
   * For now, returning placeholder - will need xlsx library added to package.json
   */
  async parseExcel(fileBuffer: Buffer, sheetName?: string): Promise<ImportRow[]> {
    try {
      // Dynamic import to avoid hard dependency
      const XLSX = require('xlsx');

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error('Sheet not found');
      }

      const data = XLSX.utils.sheet_to_json(sheet);
      return data;
    } catch (error: any) {
      logger.error('Failed to parse Excel file', { error });
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Validate a single row of imported data
   */
  validateRow(
    rowIndex: number,
    row: ImportRow,
    mapping: Record<string, string>,
    settings: any,
    existingEmails: Set<string>
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      rowIndex: rowIndex + 1,
      errors: [],
      warnings: [],
    };

    // Map the row to standard fields
    const mappedData: any = {};
    for (const [sourceCol, targetField] of Object.entries(mapping)) {
      if (row[sourceCol] !== undefined) {
        mappedData[targetField] = row[sourceCol];
      }
    }

    // Validate required fields
    if (!mappedData.first_name || !mappedData.first_name.toString().trim()) {
      result.errors.push('First name is required');
      result.isValid = false;
    }

    if (!mappedData.last_name || !mappedData.last_name.toString().trim()) {
      result.errors.push('Last name is required');
      result.isValid = false;
    }

    // Validate email
    if (!mappedData.email) {
      result.errors.push('Email is required');
      result.isValid = false;
    } else {
      const email = mappedData.email.toString().toLowerCase().trim();
      result.email = email;

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        result.errors.push(`Invalid email format: ${email}`);
        result.isValid = false;
      }

      // Check for duplicates in import or existing system
      if (existingEmails.has(email)) {
        if (settings.skipDuplicates) {
          result.warnings.push('Duplicate email in import or system (will be skipped)');
        } else {
          result.errors.push('Duplicate email exists');
          result.isValid = false;
        }
      }
    }

    // Validate phone if required
    if (settings.requirePhoneValidation && mappedData.phone) {
      const phone = mappedData.phone.toString().replace(/\D/g, '');
      if (phone.length < 10) {
        result.errors.push(`Phone number must have at least 10 digits`);
        result.isValid = false;
      }
    }

    // Validate domain if set
    if (mappedData.email && settings.emailDomainRestriction) {
      const email = mappedData.email.toString().toLowerCase();
      const domain = email.split('@')[1];
      const allowedDomains = settings.emailDomainRestriction.split(',').map((d: string) => d.trim());

      if (!allowedDomains.includes(domain)) {
        result.errors.push(`Email domain ${domain} not authorized. Allowed: ${allowedDomains.join(', ')}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate all rows before import
   */
  async validateImport(
    rows: ImportRow[],
    mapping: Record<string, string>,
    settings: any
  ): Promise<{ validRows: ImportRow[]; validationResults: ValidationResult[] }> {
    const validationResults: ValidationResult[] = [];
    const validRows: ImportRow[] = [];
    const existingEmails = new Set<string>();

    // Get existing emails from database
    try {
      const result = await UserEntity.getAllEmails();
      result.forEach((email: string) => {
        existingEmails.add(email.toLowerCase());
      });
    } catch (error) {
      logger.warn('Failed to fetch existing emails for validation', { error });
    }

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const validation = this.validateRow(i, rows[i], mapping, settings, existingEmails);
      validationResults.push(validation);

      if (validation.isValid && validation.email) {
        validRows.push(rows[i]);
        existingEmails.add(validation.email.toLowerCase());
      }
    }

    return { validRows, validationResults };
  }

  async createImportJob(
    orgId: string,
    userId: string,
    fileName: string,
    fileType: 'csv' | 'xlsx',
    columnMapping: Record<string, string>,
    importSettings: any,
    totalRows: number
  ): Promise<BulkImportJob> {
    try {
      const job = await BulkImportJobEntity.create({
        orgId,
        createdBy: userId,
        fileName,
        fileType,
        columnMapping,
        importSettings,
        totalRows,
        executionDetails: {
          errors: [],
          warnings: [],
          successEmails: [],
        },
      });

      logger.info('Bulk import job created', { jobId: job.id, fileName, totalRows });
      return job;
    } catch (error) {
      logger.error('Failed to create bulk import job', { error, fileName });
      throw error;
    }
  }

  /**
   * Get bulk import job by ID
   */
  async getJobById(id: string): Promise<BulkImportJob | null> {
    try {
      return await BulkImportJobEntity.findById(id);
    } catch (error) {
      logger.error('Failed to get bulk import job', { error, jobId: id });
      throw error;
    }
  }

  /**
   * Get bulk import jobs for organization
   */
  async getJobsByOrgId(
    orgId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ jobs: BulkImportJob[]; total: number }> {
    try {
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      const jobs = await BulkImportJobEntity.findByOrgId(orgId, limit, offset);
      const total = await BulkImportJobEntity.countByOrgId(orgId);

      return { jobs, total };
    } catch (error) {
      logger.error('Failed to get bulk import jobs', { error, orgId });
      throw error;
    }
  }

  /**
   * Update bulk import job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'in_progress' | 'completed' | 'failed',
    successCount: number,
    errorCount: number,
    warningCount: number,
    executionDetails?: any
  ): Promise<BulkImportJob | null> {
    try {
      return await BulkImportJobEntity.update(jobId, {
        status,
        successCount,
        errorCount,
        warningCount,
        executionDetails: executionDetails || {},
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      });
    } catch (error) {
      logger.error('Failed to update bulk import job', { error, jobId, status });
      throw error;
    }
  }

  /**
   * Generate execution report
   */
  generateReport(job: BulkImportJob): string {
    const lines: string[] = [];

    lines.push('BULK IMPORT EXECUTION REPORT');
    lines.push('========================================');
    lines.push(`Job ID: ${job.id}`);
    lines.push(`File: ${job.fileName}`);
    lines.push(`Status: ${job.status.toUpperCase()}`);
    lines.push(`Created: ${new Date(job.createdAt).toISOString()}`);
    if (job.completedAt) {
      lines.push(`Completed: ${new Date(job.completedAt).toISOString()}`);
    }
    lines.push('');

    lines.push('SUMMARY');
    lines.push('--------');
    lines.push(`Total Records: ${job.totalRows}`);
    lines.push(`Successfully Imported: ${job.successCount}`);
    lines.push(`Errors: ${job.errorCount}`);
    lines.push(`Warnings: ${job.warningCount}`);
    lines.push('');

    if (job.executionDetails.successEmails.length > 0) {
      lines.push('SUCCESSFULLY IMPORTED USERS');
      lines.push('---------------------------');
      job.executionDetails.successEmails.forEach((email) => {
        lines.push(`✓ ${email}`);
      });
      lines.push('');
    }

    if (job.executionDetails.errors.length > 0) {
      lines.push('ERRORS');
      lines.push('------');
      job.executionDetails.errors.forEach((err) => {
        lines.push(`Row ${err.rowNum}: ${err.error}`);
        if (err.email) lines.push(`  Email: ${err.email}`);
      });
      lines.push('');
    }

    if (job.executionDetails.warnings.length > 0) {
      lines.push('WARNINGS');
      lines.push('--------');
      job.executionDetails.warnings.forEach((warn) => {
        lines.push(`Row ${warn.rowNum}: ${warn.warning}`);
        if (warn.email) lines.push(`  Email: ${warn.email}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get list of sheets from Excel file (metadata)
   */
  async getExcelSheets(fileBuffer: Buffer): Promise<string[]> {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      return workbook.SheetNames || [];
    } catch (error: any) {
      logger.error('Failed to read Excel sheets', { error });
      throw new Error(`Failed to read Excel sheets: ${error.message}`);
    }
  }

  /**
   * Map source columns automatically (best effort)
   */
  autoMapColumns(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const standardFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'department',
      'team',
      'address',
    ];

    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    headers.forEach((header) => {
      const normalized = normalizeString(header);

      // Try to match with standard fields
      for (const field of standardFields) {
        const fieldNormalized = normalizeString(field);
        if (normalized.includes(fieldNormalized) || fieldNormalized.includes(normalized)) {
          mapping[header] = field;
          break;
        }
      }
    });

    return mapping;
  }

  /**
   * Detect file encoding
   */
  detectEncoding(buffer: Buffer): string {
    // Simple UTF-8 detection
    try {
      buffer.toString('utf8');
      return 'utf8';
    } catch {
      // Try other encodings
      try {
        buffer.toString('utf16le');
        return 'utf16le';
      } catch {
        return 'latin1';
      }
    }
  }

  /**
   * Parse and validate users from file content (main method for routes)
   */
  async parseAndValidateUsers(
    fileContent: string,
    fileType: 'csv' | 'xlsx' = 'csv',
    mapping?: Record<string, string>,
    settings?: any
  ): Promise<{ users: UserImportRow[]; errors: ValidationResult[] }> {
    try {
      let rows: ImportRow[] = [];

      if (fileType === 'csv') {
        rows = await this.parseCSV(fileContent);
      } else {
        // For xlsx, convert to buffer
        const buffer = Buffer.from(fileContent, 'base64');
        rows = await this.parseExcel(buffer);
      }

      // Use provided mapping or auto-detect
      const columnMapping = mapping || this.autoMapColumns(Object.keys(rows[0] || {}));

      // Validate all rows
      const validationResults = await this.validateImport(rows, columnMapping, settings || {});

      return {
        users: validationResults.validRows,
        errors: validationResults.validationResults.filter((v) => !v.isValid || v.warnings.length > 0),
      };
    } catch (error: any) {
      logger.error('Error parsing and validating users', { error });
      throw new ImportValidationError(`Failed to parse and validate: ${error.message}`);
    }
  }

  /**
   * Create import report summary
   */
  createImportReport(
    successCount: number,
    errorCount: number,
    errors: ValidationResult[] | any[],
    warnings: ValidationResult[] | string[] | any[]
  ): any {
    return {
      success: true,
      summary: {
        total: successCount + errorCount,
        successful: successCount,
        failed: errorCount,
        warnings: warnings.length,
      },
      errors: errors.map((e: any) => ({
        row: e.rowIndex || e.row,
        email: e.email,
        issues: e.errors || e.issues || [],
      })),
      warnings: warnings.map((w: any) => ({
        row: w.rowIndex || w.row || 0,
        email: w.email || '',
        issues: Array.isArray(w) ? [w] : (w.warnings || w.issues || [w]),
      })),
    };
  }

  /**
   * Generate magic link token (for routes)
   */
  generateMagicLinkToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const bulkImportService = new BulkImportService();

export default bulkImportService;
