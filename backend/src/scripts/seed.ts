import { AdminUser } from '../models/AdminUser';
import { getTempleSettings } from '../models/TempleSettings';
import { getConfig } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../core/logger';

/**
 * Core seeding logic — can be called at startup or from the CLI.
 * Does not manage database connection lifecycle.
 */
export async function runSeed(): Promise<void> {
  const config = getConfig();

  logger.info('🌱 Running database seeding check...');

  // ─── Seed Admin User ──────────────────────────────────────
  const existingAdmin = await AdminUser.findOne({ email: config.SEED_ADMIN_EMAIL.toLowerCase() });

  if (existingAdmin) {
    logger.info({ email: config.SEED_ADMIN_EMAIL }, 'Admin user already exists, skipping');
  } else {
    await AdminUser.create({
      email: config.SEED_ADMIN_EMAIL,
      passwordHash: config.SEED_ADMIN_PASSWORD, // Pre-save hook will hash this
      role: 'super_admin',
      isActive: true,
    });
    logger.info({ email: config.SEED_ADMIN_EMAIL }, '✅ Admin user created');
    logger.warn('⚠️  Change the default admin password before production deployment!');
  }

  // ─── Seed Temple Settings ────────────────────────────────
  const settings = await getTempleSettings();
  logger.info({ templeName: settings.templeName }, '✅ Temple settings initialized');
}

// standalone execution support
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('seed.ts')) || (process.argv[1] && process.argv[1].endsWith('seed.js'))) {
  const runStandalone = async () => {
    await connectDatabase();
    await runSeed();
    await disconnectDatabase();
    logger.info('🌱 Standalone seed completed successfully');
  };

  runStandalone().catch((error) => {
    logger.fatal({ error }, 'Standalone seed script failed');
    process.exit(1);
  });
}

