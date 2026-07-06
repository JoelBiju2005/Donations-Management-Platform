"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageProvider = getStorageProvider;
const LocalStorageProvider_1 = require("./LocalStorageProvider");
const S3StorageProvider_1 = require("./S3StorageProvider");
const env_1 = require("../../config/env");
/**
 * Factory: returns the correct storage provider based on STORAGE_PROVIDER env var.
 * Singleton instance — created once, reused throughout the application.
 */
let instance = null;
function getStorageProvider() {
    if (instance)
        return instance;
    const config = (0, env_1.getConfig)();
    switch (config.STORAGE_PROVIDER) {
        case 's3':
            instance = new S3StorageProvider_1.S3StorageProvider();
            break;
        case 'local':
        default:
            instance = new LocalStorageProvider_1.LocalStorageProvider();
            break;
    }
    return instance;
}
//# sourceMappingURL=index.js.map