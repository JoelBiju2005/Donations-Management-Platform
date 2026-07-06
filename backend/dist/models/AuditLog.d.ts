import { Document, Model } from 'mongoose';
/**
 * Immutable audit log — every admin action and system status transition is recorded.
 * Never updated or deleted after creation (append-only).
 */
export interface IAuditLog extends Document {
    actor: string;
    actorEmail?: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    timestamp: Date;
}
export declare const AuditLog: Model<IAuditLog>;
/**
 * Helper to create an audit log entry.
 * Used throughout the application for consistent audit trail creation.
 */
export declare function createAuditEntry(entry: Omit<IAuditLog, keyof Document>): Promise<IAuditLog>;
//# sourceMappingURL=AuditLog.d.ts.map