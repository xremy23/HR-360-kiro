import { CommunityReport, CommunityReportEntity } from '../entities/CommunityReport';
import { logger } from './monitoringService';

export class CommunityReportService {
  /**
   * Create a new community report
   */
  async createReport(
    orgId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      category: 'natural_disaster' | 'hazard' | 'safety_concern' | 'infrastructure' | 'other';
      severity: 'low' | 'medium' | 'high';
      location?: { latitude: number; longitude: number; address?: string };
      imageUrls?: string[];
    }
  ): Promise<CommunityReport> {
    try {
      // Validate input
      if (!data.title || !data.description) {
        throw new Error('Title and description are required');
      }

      if (!['natural_disaster', 'hazard', 'safety_concern', 'infrastructure', 'other'].includes(data.category)) {
        throw new Error('Invalid category');
      }

      if (!['low', 'medium', 'high'].includes(data.severity)) {
        throw new Error('Invalid severity level');
      }

      const report = await CommunityReportEntity.create({
        orgId,
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        location: data.location,
        imageUrls: data.imageUrls || [],
      });

      logger.info('Community report created', { reportId: report.id, userId, orgId });
      return report;
    } catch (error) {
      logger.error('Failed to create community report', { error, userId, orgId });
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string): Promise<CommunityReport | null> {
    try {
      return await CommunityReportEntity.findById(id);
    } catch (error) {
      logger.error('Failed to get community report', { error, reportId: id });
      throw error;
    }
  }

  /**
   * Get all reports for an organization
   */
  async getReportsByOrgId(
    orgId: string,
    options?: {
      category?: string;
      severity?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ reports: CommunityReport[]; total: number }> {
    try {
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      const reports = await CommunityReportEntity.findByOrgId(
        orgId,
        options?.category,
        options?.severity,
        limit,
        offset
      );

      const total = await CommunityReportEntity.countByOrgId(orgId);

      return { reports, total };
    } catch (error) {
      logger.error('Failed to get organization reports', { error, orgId });
      throw error;
    }
  }

  /**
   * Get reports created by a specific user
   */
  async getReportsByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<CommunityReport[]> {
    try {
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      return await CommunityReportEntity.findByUserId(userId, limit, offset);
    } catch (error) {
      logger.error('Failed to get user reports', { error, userId });
      throw error;
    }
  }

  /**
   * Update a community report
   */
  async updateReport(
    id: string,
    userId: string,
    data: Partial<Omit<CommunityReport, 'id' | 'createdAt' | 'expiresAt' | 'userId' | 'orgId'>>
  ): Promise<CommunityReport | null> {
    try {
      const report = await CommunityReportEntity.findById(id);
      if (!report) {
        throw new Error('Report not found');
      }

      // Only the creator or admin can update
      if (report.userId !== userId) {
        throw new Error('Unauthorized to update this report');
      }

      const updated = await CommunityReportEntity.update(id, data);
      logger.info('Community report updated', { reportId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to update community report', { error, reportId: id, userId });
      throw error;
    }
  }

  /**
   * Delete a community report
   */
  async deleteReport(id: string, userId: string): Promise<boolean> {
    try {
      const report = await CommunityReportEntity.findById(id);
      if (!report) {
        throw new Error('Report not found');
      }

      // Only the creator can delete
      if (report.userId !== userId) {
        throw new Error('Unauthorized to delete this report');
      }

      const deleted = await CommunityReportEntity.delete(id);
      if (deleted) {
        logger.info('Community report deleted', { reportId: id, userId });
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete community report', { error, reportId: id, userId });
      throw error;
    }
  }

  /**
   * Upvote a community report
   */
  async upvoteReport(id: string, userId: string): Promise<CommunityReport | null> {
    try {
      const report = await CommunityReportEntity.findById(id);
      if (!report) {
        throw new Error('Report not found');
      }

      const updated = await CommunityReportEntity.upvote(id, userId);
      logger.info('Community report upvoted', { reportId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to upvote community report', { error, reportId: id, userId });
      throw error;
    }
  }

  /**
   * Remove upvote from a community report
   */
  async removeUpvote(id: string, userId: string): Promise<CommunityReport | null> {
    try {
      const report = await CommunityReportEntity.findById(id);
      if (!report) {
        throw new Error('Report not found');
      }

      const updated = await CommunityReportEntity.removeUpvote(id, userId);
      logger.info('Community report upvote removed', { reportId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to remove upvote from community report', { error, reportId: id, userId });
      throw error;
    }
  }

  /**
   * Resolve a community report
   */
  async resolveReport(id: string): Promise<CommunityReport | null> {
    try {
      const report = await CommunityReportEntity.findById(id);
      if (!report) {
        throw new Error('Report not found');
      }

      const updated = await CommunityReportEntity.update(id, { status: 'resolved' });
      logger.info('Community report resolved', { reportId: id });
      return updated;
    } catch (error) {
      logger.error('Failed to resolve community report', { error, reportId: id });
      throw error;
    }
  }

  /**
   * Auto-purge expired reports (7 days old)
   * This should be called by a background job
   */
  async purgeExpiredReports(): Promise<number> {
    try {
      const count = await CommunityReportEntity.purgeExpired();
      logger.info('Expired community reports purged', { count });
      return count;
    } catch (error) {
      logger.error('Failed to purge expired community reports', { error });
      throw error;
    }
  }
}

export const communityReportService = new CommunityReportService();
