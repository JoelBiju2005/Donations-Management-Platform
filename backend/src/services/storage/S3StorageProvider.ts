import { StorageProvider } from './StorageProvider';
import { logger } from '../../core/logger';
import { getConfig } from '../../config/env';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Production AWS S3 Storage Provider.
 * Integrates with standard AWS environment variables.
 * Stores payment screenshots and generated receipt PDFs inside AWS S3.
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    const config = getConfig();
    const accessKeyId = config.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config.AWS_SECRET_ACCESS_KEY;
    const region = config.AWS_REGION || 'us-east-1';
    const bucket = config.AWS_S3_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      logger.error('AWS S3 configurations are missing in environment variables');
      throw new Error('S3StorageProvider configuration error: AWS credentials or bucket name not set');
    }

    this.bucket = bucket;
    this.region = region;
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    logger.info({ bucket, region }, 'S3 storage provider initialized successfully');
  }

  private extractKey(filePathOrUrl: string): string {
    // If it's a full S3 URL, extract the path key: https://bucket.s3.region.amazonaws.com/folder/filename.ext
    if (filePathOrUrl.startsWith('http')) {
      try {
        const url = new URL(filePathOrUrl);
        // Pathname starts with '/', so slice it
        return decodeURIComponent(url.pathname.slice(1));
      } catch {
        return filePathOrUrl;
      }
    }
    return filePathOrUrl;
  }

  async save(buffer: Buffer, filename: string, folder: string, contentType: string): Promise<string> {
    const key = `${folder}/${filename}`;
    logger.debug({ bucket: this.bucket, key, contentType }, 'Uploading object to S3');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // Return the standard S3 object URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(filePathOrUrl: string): Promise<void> {
    const key = this.extractKey(filePathOrUrl);
    logger.debug({ bucket: this.bucket, key }, 'Deleting object from S3');

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async getBuffer(filePathOrUrl: string): Promise<Buffer> {
    const key = this.extractKey(filePathOrUrl);
    logger.debug({ bucket: this.bucket, key }, 'Fetching object buffer from S3');

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`S3 Object body empty for key: ${key}`);
    }

    // Convert readable stream to Buffer
    const stream = response.Body as any;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async exists(filePathOrUrl: string): Promise<boolean> {
    const key = this.extractKey(filePathOrUrl);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
