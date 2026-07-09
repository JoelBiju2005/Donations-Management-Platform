"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const AdminUser_1 = require("../models/AdminUser");
const TempleSettings_1 = require("../models/TempleSettings");
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const logger_1 = require("../core/logger");
/**
 * Core seeding logic — can be called at startup or from the CLI.
 * Does not manage database connection lifecycle.
 */
async function runSeed() {
    const config = (0, env_1.getConfig)();
    logger_1.logger.info('🌱 Running database seeding check...');
    // ─── Seed Admin User ──────────────────────────────────────
    const existingAdmin = await AdminUser_1.AdminUser.findOne({ email: config.SEED_ADMIN_EMAIL.toLowerCase() });
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
}
// standalone execution support
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('seed.ts')) || (process.argv[1] && process.argv[1].endsWith('seed.js'))) {
    const runStandalone = async () => {
        await (0, database_1.connectDatabase)();
        await runSeed();
        await (0, database_1.disconnectDatabase)();
        logger_1.logger.info('🌱 Standalone seed completed successfully');
    };
    runStandalone().catch((error) => {
        logger_1.logger.fatal({ error }, 'Standalone seed script failed');
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map