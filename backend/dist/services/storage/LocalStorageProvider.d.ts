import { StorageProvider } from './StorageProvider';
/**
 * Local disk storage provider for development.
 * Files stored in the configured UPLOAD_DIR.
 */
export declare class LocalStorageProvider implements StorageProvider {
    private baseDir;
    constructor();
    save(buffer: Buffer, filename: string, folder: string, _contentType: string): Promise<string>;
    delete(filePathOrUrl: string): Promise<void>;
    getBuffer(filePathOrUrl: string): Promise<Buffer>;
    exists(filePathOrUrl: string): Promise<boolean>;
}
//# sourceMappingURL=LocalStorageProvider.d.ts.map