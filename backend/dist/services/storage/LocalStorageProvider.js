"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../../config/env");
const logger_1 = require("../../core/logger");
/**
 * Local disk storage provider for development.
 * Files stored in the configured UPLOAD_DIR.
 */
class LocalStorageProvider {
    baseDir;
    constructor() {
        this.baseDir = (0, env_1.getConfig)().UPLOAD_DIR;
    }
    async save(buffer, filename, folder, _contentType) {
        const dir = path_1.default.join(this.baseDir, folder);
        await promises_1.default.mkdir(dir, { recursive: true });
        const filePath = path_1.default.join(dir, filename);
        await promises_1.default.writeFile(filePath, buffer);
        // Return relative path for storage in MongoDB
        const relativePath = `/uploads/${folder}/${filename}`;
        logger_1.logger.debug({ filePath, relativePath }, 'File saved to local storage');
        return relativePath;
    }
    async delete(filePathOrUrl) {
        // Convert relative URL back to absolute path
        const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
        const absolutePath = path_1.default.join(this.baseDir, relativePath);
        try {
            await promises_1.default.unlink(absolutePath);
            logger_1.logger.debug({ absolutePath }, 'File deleted from local storage');
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            logger_1.logger.warn({ absolutePath }, 'File not found during delete (already removed)');
        }
    }
    async getBuffer(filePathOrUrl) {
        const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
        const absolutePath = path_1.default.join(this.baseDir, relativePath);
        return promises_1.default.readFile(absolutePath);
    }
    async exists(filePathOrUrl) {
        const relativePath = filePathOrUrl.replace(/^\/uploads\//, '');
        const absolutePath = path_1.default.join(this.baseDir, relativePath);
        try {
            await promises_1.default.access(absolutePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
//# sourceMappingURL=LocalStorageProvider.js.map