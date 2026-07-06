"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AdminUser_1 = require("../models/AdminUser");
const TempleSettings_1 = require("../models/TempleSettings");
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const logger_1 = require("../core/logger");
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
async function seed() {
    const config = (0, env_1.getConfig)();
    logger_1.logger.info('🌱 Starting seed script...');
    await (0, database_1.connectDatabase)();
    // ─── Seed Admin User ──────────────────────────────────────
    const existingAdmin = await AdminUser_1.AdminUser.findOne({ email: config.SEED_ADMIN_EMAIL });
    if (existingAdmin) {
        logger_1.logger.info({ email: config.SEED_ADMIN_EMAIL }, 'Admin user already exists, skipping');
    }
    else {
        await AdminUser_1.AdminUser.create({
            email: config.SEED_ADMIN_EMAIL,
            passwordHash: config.SEED_ADMIN_PASSWORD, // Pre-save hook will hash this
            role: 'super_admin',
            isActive: true,
        });
        logger_1.logger.info({ email: config.SEED_ADMIN_EMAIL }, '✅ Admin user created');
        logger_1.logger.warn('⚠️  Change the default admin password before production deployment!');
    }
    // ─── Seed Temple Settings ────────────────────────────────
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    logger_1.logger.info({ templeName: settings.templeName }, '✅ Temple settings initialized');
    await (0, database_1.disconnectDatabase)();
    logger_1.logger.info('🌱 Seed completed successfully');
}
seed().catch((error) => {
    logger_1.logger.fatal({ error }, 'Seed script failed');
    process.exit(1);
});
//# sourceMappingURL=seed.js.map