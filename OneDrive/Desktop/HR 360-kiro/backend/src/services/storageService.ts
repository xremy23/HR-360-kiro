/**
 * Cloud Storage Service
 * Handles file uploads to Google Cloud Storage
 * Supports avatar uploads with signed URLs
 * GCP-optimized implementation
 */

import { Storage as GCSStorage } from '@google-cloud/storage';
import { logger } from './monitoringService';

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface SignedUrlOptions {
  expirationMinutes?: number;
}

export type StorageProvider = 'gcs' | 'local'; // GCP-only deployment (S3 removed)

class CloudStorageService {
  private provider: StorageProvider = 'local';
  private gcsStorage: GCSStorage | null = null;
  private gcsProjectId: string = '';
  private gcsBucket: string = '';
  private isInitialized = false;

  /**
   * Initialize storage service
   */
  async initialize(): Promise<void> {
    try {
      const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

      if (provider === 'gcs') {
        await this.initializeGCS();
      } else {
        logger.info('Using local storage (development mode)');
        this.provider = 'local';
      }

      this.isInitialized = true;
      logger.info(`✅ Storage service initialized with provider: ${this.provider}`);
    } catch (error) {
      logger.error('Failed to initialize storage service:', { error });
      logger.warn('Falling back to local storage');
      this.provider = 'local';
      this.isInitialized = true;
    }
  }

  /**
   * Initialize Google Cloud Storage
   */
  private async initializeGCS(): Promise<void> {
    try {
      const projectId = process.env.GCP_PROJECT_ID;
      const bucketName = process.env.GCS_BUCKET_NAME;

      if (!projectId || !bucketName) {
        throw new Error('GCP_PROJECT_ID and GCS_BUCKET_NAME are required');
      }

      this.gcsProjectId = projectId;
      this.gcsBucket = bucketName;

      // Initialize GCS with project ID
      // Credentials will be sourced from:
      // 1. GOOGLE_APPLICATION_CREDENTIALS environment variable (local dev)
      // 2. Service account (Cloud Run/Compute Engine)
      // 3. Application Default Credentials (gcloud auth)
      this.gcsStorage = new GCSStorage({
        projectId,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Test connection
      const bucket = this.gcsStorage.bucket(bucketName);
      await bucket.exists();

      this.provider = 'gcs';
      logger.info('✅ Google Cloud Storage initialized', { bucket: bucketName, project: projectId });
    } catch (error) {
      logger.error('Failed to initialize GCS:', { error });
      throw error;
    }
  }

  /**
   * Upload file (avatar)
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const fileName = `avatars/${userId}/${Date.now()}.jpg`;

      if (this.provider === 'gcs') {
        return await this.uploadToGCS(fileName, fileBuffer, mimeType);
      } else {
        // Local storage (development)
        return `/avatars/${userId}/${Date.now()}.jpg`;
      }
    } catch (error) {
      logger.error('Avatar upload failed:', { error, userId });
      throw new Error(`Failed to upload avatar: ${error}`);
    }
  }

  /**
   * Upload to Google Cloud Storage
   */
  private async uploadToGCS(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.gcsStorage) {
      throw new Error('GCS Storage not initialized');
    }

    const bucket = this.gcsStorage.bucket(this.gcsBucket);
    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    // Return signed URL
    return await this.getGCSSignedUrl(fileName);
  }

  /**
   * Get signed URL for GCS
   */
  private async getGCSSignedUrl(fileName: string, expirationMinutes: number = 24 * 60): Promise<string> {
    if (!this.gcsStorage) {
      throw new Error('GCS Storage not initialized');
    }

    const bucket = this.gcsStorage.bucket(this.gcsBucket);
    const file = bucket.file(fileName);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });

    return signedUrl;
  }

  /**
   * Get signed URL for S3 - DEPRECATED (Using GCP Only)
   * This method is no longer used as we're GCP-only
   */
  private async getS3SignedUrl(fileName: string, expirationMinutes: number = 24 * 60): Promise<string> {
    throw new Error('S3 is deprecated. Use Google Cloud Storage instead.');
  }

  /**
   * Get signed URL for existing file
   */
  async getSignedUrl(fileName: string, options?: SignedUrlOptions): Promise<string> {
    const expirationMinutes = options?.expirationMinutes || 24 * 60;

    try {
      if (this.provider === 'gcs') {
        return await this.getGCSSignedUrl(fileName, expirationMinutes);
      } else {
        // Local storage - return file path
        return fileName;
      }
    } catch (error) {
      logger.error('Failed to get signed URL:', { error, fileName });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      if (this.provider === 'gcs') {
        await this.deleteFromGCS(fileName);
      }
      // Local storage: file deletion would be local FS operation
    } catch (error) {
      logger.error('Failed to delete file:', { error, fileName });
      throw error;
    }
  }

  /**
   * Delete from GCS
   */
  private async deleteFromGCS(fileName: string): Promise<void> {
    if (!this.gcsStorage) {
      throw new Error('GCS Storage not initialized');
    }

    const bucket = this.gcsStorage.bucket(this.gcsBucket);
    const file = bucket.file(fileName);
    await file.delete();
  }

  /**
   * Get storage provider
   */
  getProvider(): StorageProvider {
    return this.provider;
  }

  /**
   * Check if using cloud storage
   */
  isCloudStorage(): boolean {
    return this.provider !== 'local';
  }
}

// Export singleton instance
export const storageService = new CloudStorageService();
