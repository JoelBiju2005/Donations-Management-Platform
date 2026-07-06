import { AdminUser } from '../models/AdminUser';
import { getTempleSettings } from '../models/TempleSettings';
import { getConfig } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../core/logger';

/**
 * Seed script — creates the initial admin account and default temple settings.
 *
 * ⚠️  IMPORTANT: Seeded credentials are development defaults only.
 * Change the password and rotate JWT_SECRET before any production deployment.
 *
 * Reads from environment variables:
 *   SEED_ADMIN_EMAIL — admin email (default: admin@temple.local)
 *   SEED_ADMIN_PASSWORD — admin password (default: ChangeMe!2026)
 */
async function seed(): Promise<void> {
  const config = getConfig();

  logger.info('🌱 Starting seed script...');

  await connectDatabase();

  // ─── Seed Admin User ──────────────────────────────────────
  const existingAdmin = await AdminUser.findOne({ email: config.SEED_ADMIN_EMAIL });

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

  await disconnectDatabase();
  logger.info('🌱 Seed completed successfully');
}

seed().catch((error) => {
  logger.fatal({ error }, 'Seed script failed');
  process.exit(1);
});
