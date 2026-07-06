import { StorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import { getConfig } from '../../config/env';

/**
 * Factory: returns the correct storage provider based on STORAGE_PROVIDER env var.
 * Singleton instance — created once, reused throughout the application.
 */
let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const config = getConfig();

  switch (config.STORAGE_PROVIDER) {
    case 's3':
      instance = new S3StorageProvider();
      break;
    case 'local':
    default:
      instance = new LocalStorageProvider();
      break;
  }

  return instance;
}

export type { StorageProvider };
