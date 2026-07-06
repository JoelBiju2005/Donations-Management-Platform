"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const logger_1 = require("../../core/logger");
const env_1 = require("../../config/env");
const client_s3_1 = require("@aws-sdk/client-s3");
/**
 * Production AWS S3 Storage Provider.
 * Integrates with standard AWS environment variables.
 * Stores payment screenshots and generated receipt PDFs inside AWS S3.
 */
class S3StorageProvider {
    client;
    bucket;
    region;
    constructor() {
        const config = (0, env_1.getConfig)();
        const accessKeyId = config.AWS_ACCESS_KEY_ID;
        const secretAccessKey = config.AWS_SECRET_ACCESS_KEY;
        const region = config.AWS_REGION || 'us-east-1';
        const bucket = config.AWS_S3_BUCKET_NAME;
        if (!accessKeyId || !secretAccessKey || !bucket) {
            logger_1.logger.error('AWS S3 configurations are missing in environment variables');
            throw new Error('S3StorageProvider configuration error: AWS credentials or bucket name not set');
        }
        this.bucket = bucket;
        this.region = region;
        this.client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        logger_1.logger.info({ bucket, region }, 'S3 storage provider initialized successfully');
    }
    extractKey(filePathOrUrl) {
        // If it's a full S3 URL, extract the path key: https://bucket.s3.region.amazonaws.com/folder/filename.ext
        if (filePathOrUrl.startsWith('http')) {
            try {
                const url = new URL(filePathOrUrl);
                // Pathname starts with '/', so slice it
                return decodeURIComponent(url.pathname.slice(1));
            }
            catch {
                return filePathOrUrl;
            }
        }
        return filePathOrUrl;
    }
    async save(buffer, filename, folder, contentType) {
        const key = `${folder}/${filename}`;
        logger_1.logger.debug({ bucket: this.bucket, key, contentType }, 'Uploading object to S3');
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));
        // Return the standard S3 object URL
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async delete(filePathOrUrl) {
        const key = this.extractKey(filePathOrUrl);
        logger_1.logger.debug({ bucket: this.bucket, key }, 'Deleting object from S3');
        await this.client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }
    async getBuffer(filePathOrUrl) {
        const key = this.extractKey(filePathOrUrl);
        logger_1.logger.debug({ bucket: this.bucket, key }, 'Fetching object buffer from S3');
        const response = await this.client.send(new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
        if (!response.Body) {
            throw new Error(`S3 Object body empty for key: ${key}`);
        }
        // Convert readable stream to Buffer
        const stream = response.Body;
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    async exists(filePathOrUrl) {
        const key = this.extractKey(filePathOrUrl);
        try {
            await this.client.send(new client_s3_1.HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            return true;
        }
        catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }
}
exports.S3StorageProvider = S3StorageProvider;
//# sourceMappingURL=S3StorageProvider.js.map