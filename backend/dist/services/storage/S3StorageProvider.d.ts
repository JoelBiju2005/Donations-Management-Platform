import { StorageProvider } from './StorageProvider';
/**
 * S3-compatible storage provider stub.
 * Ready to implement with @aws-sdk/client-s3 when deploying to production.
 * Supports any S3-compatible service (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces).
 *
 * Decision: Providing the interface implementation skeleton so the swap is zero-code-change
 * (just set STORAGE_PROVIDER=s3 and fill in the S3_* env vars).
 */
export declare class S3StorageProvider implements StorageProvider {
    constructor();
    save(buffer: Buffer, filename: string, folder: string, contentType: string): Promise<string>;
    delete(filePathOrUrl: string): Promise<void>;
    getBuffer(filePathOrUrl: string): Promise<Buffer>;
    exists(filePathOrUrl: string): Promise<boolean>;
}
//# sourceMappingURL=S3StorageProvider.d.ts.map