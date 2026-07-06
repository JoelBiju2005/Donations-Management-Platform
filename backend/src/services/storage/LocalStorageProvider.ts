import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './StorageProvider';
import { getConfig } from '../../config/env';
import { logger } from '../../core/logger';

/**
 * Local disk storage provider for development.
 * Files stored in the configured UPLOAD_DIR.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = getConfig().UPLOAD_DIR;
  }

  async save(buffer: Buffer, filename: string, folder: string, _contentType: string): Promise<string> {
    const dir = path.join(this.baseDir, folder);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    // Return relative path for storage in MongoDB
    const relativePath = `/uploads/${folder}/${filename}`;
    logger.debug({ filePath, relativePath }, 'File saved to local storage');
    return relativePath;
  }

  async delete(filePathOrUrl: string): Promise<void> {
    // Convert relative URL back to absolute path
    const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.join(this.baseDir, relativePath);

    try {
      await fs.unlink(absolutePath);
      logger.debug({ absolutePath }, 'File deleted from local storage');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      logger.warn({ absolutePath }, 'File not found during delete (already removed)');
    }
  }

  async getBuffer(filePathOrUrl: string): Promise<Buffer> {
    const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.join(this.baseDir, relativePath);
    return fs.readFile(absolutePath);
  }

  async exists(filePathOrUrl: string): Promise<boolean> {
    const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.join(this.baseDir, relativePath);

    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }
}
