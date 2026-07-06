import { StorageProvider } from './StorageProvider';
/**
 * Production AWS S3 Storage Provider.
 * Integrates with standard AWS environment variables.
 * Stores payment screenshots and generated receipt PDFs inside AWS S3.
 */
export declare class S3StorageProvider implements StorageProvider {
    private client;
    private bucket;
    private region;
    constructor();
    private extractKey;
    save(buffer: Buffer, filename: string, folder: string, contentType: string): Promise<string>;
    delete(filePathOrUrl: string): Promise<void>;
    getBuffer(filePathOrUrl: string): Promise<Buffer>;
    exists(filePathOrUrl: string): Promise<boolean>;
}
//# sourceMappingURL=S3StorageProvider.d.ts.map