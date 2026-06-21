/**
 * Bulk Import Routes
 * HR Admin bulk user import from Excel files
 */

import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { bulkImportService, UserImportRow, ImportValidationError } from '../services/bulkImportService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * POST /api/bulk-import/validate
 * Validate bulk import file without creating users
 */
router.post('/validate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is HR Admin
    if (req.user?.role !== 'hr_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only HR Admins can perform bulk imports',
        },
        statusCode: 403,
      });
    }

    const { fileContent, fileName } = req.body;

    if (!fileContent) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'File content is required',
        },
        statusCode: 400,
      });
    }

    logger.info('Validating bulk import file', { fileName, userId: req.user?.id });

    // Parse and validate
    const { users, errors } = await bulkImportService.parseAndValidateUsers(fileContent);

    const result = bulkImportService.createImportReport(
      users.length,
      errors.length,
      errors,
      []
    );

    res.json({
      success: true,
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Error validating bulk import:', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate import file',
      },
      statusCode: 500,
    });
  }
});

/**
 * POST /api/bulk-import/preview
 * Preview first 5 rows of parsed data
 */
router.post('/preview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'hr_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN' },
        statusCode: 403,
      });
    }

    const { fileContent } = req.body;

    if (!fileContent) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT' },
        statusCode: 400,
      });
    }

    const { users, errors } = await bulkImportService.parseAndValidateUsers(fileContent);
    const preview = users.slice(0, 5);

    res.json({
      success: true,
      data: {
        preview,
        totalRows: users.length,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Error generating preview:', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR' },
      statusCode: 500,
    });
  }
});

/**
 * POST /api/bulk-import/import
 * Execute bulk user import
 */
router.post('/import', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'hr_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN' },
        statusCode: 403,
      });
    }

    const { fileContent, fileName, sendWelcomeEmails = true } = req.body;

    if (!fileContent) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT' },
        statusCode: 400,
      });
    }

    logger.info('Starting bulk import', {
      fileName,
      userId: req.user?.id,
      orgId: req.user?.orgId,
    });

    const { users, errors } = await bulkImportService.parseAndValidateUsers(fileContent);

    if (errors.length > 0 && users.length === 0) {
      // All rows have validation errors
      const result = bulkImportService.createImportReport(0, errors.length, errors, []);
      return res.status(400).json({
        success: false,
        data: result,
        statusCode: 400,
      });
    }

    // Import valid users
    const importedUsers: any[] = [];
    const importedEmails: string[] = [];
    const warnings: string[] = [];

    for (const user of users) {
      try {
        const userId = randomUUID();
        const magicLinkToken = bulkImportService.generateMagicLinkToken();

        // In production, this would:
        // 1. Check for duplicate emails in database
        // 2. Create user record in database
        // 3. Send welcome email with magic link
        // 4. Log import activity

        importedUsers.push({
          id: userId,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          team: user.team,
          department: user.department,
          magicLinkToken: magicLinkToken, // Would be sent via email
          createdAt: new Date(),
        });

        importedEmails.push(user.email);

        // Track if should send email
        if (sendWelcomeEmails) {
          // TODO: Implement email sending
          // await emailService.sendWelcomeEmail(user.email, magicLinkToken, user.fullName);
        }
      } catch (err) {
        logger.error('Error importing user:', { error: err, email: user.email });
        warnings.push(`Failed to import ${user.email}: ${(err as any).message}`);
      }
    }

    const result = bulkImportService.createImportReport(
      importedUsers.length,
      errors.length,
      errors,
      warnings
    );

    logger.info('Bulk import completed', {
      imported: importedUsers.length,
      failed: errors.length,
      warnings: warnings.length,
    });

    res.json({
      success: result.success,
      data: {
        ...result,
        importedUsers: importedUsers.map(u => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
        })),
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.error('Error executing bulk import:', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_ERROR',
        message: 'Failed to execute bulk import',
      },
      statusCode: 500,
    });
  }
});

/**
 * GET /api/bulk-import/template
 * Download CSV template for bulk import
 */
router.get('/template', (req: Request, res: Response) => {
  try {
    const template = `Full Name,Email,Phone,Address,Immediate Superior,Team,Department,Personal Emergency Contact
John Doe,john.doe@example.com,+639171234567,"123 Main St, City",Jane Smith,Engineering,IT,"Maria Doe 09171234568"
Jane Smith,jane.smith@example.com,+639171234568,"456 Oak Ave, City",Bob Johnson,Product,HR,"John Smith 09171234569"`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bulk-import-template.csv');
    res.send(template);
  } catch (error) {
    logger.error('Error generating template:', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR' },
      statusCode: 500,
    });
  }
});

export default router;
