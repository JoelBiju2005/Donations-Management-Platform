"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
exports.createAuditEntry = createAuditEntry;
const mongoose_1 = __importStar(require("mongoose"));
const auditLogSchema = new mongoose_1.Schema({
    actor: { type: String, required: true },
    actorEmail: String,
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now, index: true },
}, {
    // No updatedAt — audit logs are immutable
    timestamps: false,
    // Prevent modifications after creation
    strict: true,
});
// Compound index for efficient filtering in the admin UI
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
exports.AuditLog = mongoose_1.default.model('AuditLog', auditLogSchema);
/**
 * Helper to create an audit log entry.
 * Used throughout the application for consistent audit trail creation.
 */
async function createAuditEntry(entry) {
    return exports.AuditLog.create({
        ...entry,
        timestamp: new Date(),
    });
}
//# sourceMappingURL=AuditLog.js.map