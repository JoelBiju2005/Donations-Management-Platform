"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const logger_1 = require("../../core/logger");
/**
 * S3-compatible storage provider stub.
 * Ready to implement with @aws-sdk/client-s3 when deploying to production.
 * Supports any S3-compatible service (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces).
 *
 * Decision: Providing the interface implementation skeleton so the swap is zero-code-change
 * (just set STORAGE_PROVIDER=s3 and fill in the S3_* env vars).
 */
class S3StorageProvider {
    constructor() {
        logger_1.logger.info('S3 storage provider initialized (install @aws-sdk/client-s3 for production use)');
    }
    async save(buffer, filename, folder, contentType) {
        // Production implementation:
        // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        // const client = new S3Client({ region, endpoint, credentials });
        // const key = `${folder}/${filename}`;
        // await client.send(new PutObjectCommand({ Bucket, Key: key, Body: buffer, ContentType: contentType }));
        // return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        throw new Error('S3StorageProvider is not fully implemented. Install @aws-sdk/client-s3 and implement the save method, or use STORAGE_PROVIDER=local for development.');
    }
    async delete(filePathOrUrl) {
        throw new Error('S3StorageProvider.delete not implemented');
    }
    async getBuffer(filePathOrUrl) {
        throw new Error('S3StorageProvider.getBuffer not implemented');
    }
    async exists(filePathOrUrl) {
        throw new Error('S3StorageProvider.exists not implemented');
    }
}
exports.S3StorageProvider = S3StorageProvider;
//# sourceMappingURL=S3StorageProvider.js.map