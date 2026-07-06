import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Immutable audit log — every admin action and system status transition is recorded.
 * Never updated or deleted after creation (append-only).
 */

export interface IAuditLog extends Document {
  actor: string;           // Admin user ID or 'system'
  actorEmail?: string;     // For human readability in the admin UI
  action: string;          // e.g., 'donation.approved', 'donation.rejected', 'settings.updated'
  targetType: string;      // e.g., 'Donation', 'TempleSettings', 'AdminUser'
  targetId?: string;       // Document ID of the affected record
  metadata?: Record<string, unknown>; // Action-specific details (reason, old/new values, etc.)
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: String, required: true },
    actorEmail: String,
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    // No updatedAt — audit logs are immutable
    timestamps: false,
    // Prevent modifications after creation
    strict: true,
  }
);

// Compound index for efficient filtering in the admin UI
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

/**
 * Helper to create an audit log entry.
 * Used throughout the application for consistent audit trail creation.
 */
export async function createAuditEntry(entry: Omit<IAuditLog, keyof Document>): Promise<IAuditLog> {
  return AuditLog.create({
    ...entry,
    timestamp: new Date(),
  });
}
