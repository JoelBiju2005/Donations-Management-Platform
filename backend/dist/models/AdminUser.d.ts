import { Document, Model } from 'mongoose';
/**
 * Admin user model.
 * Passwords hashed with bcrypt (cost factor 12).
 * Refresh token hash stored for rotation/revocation.
 * Account lockout after configurable failed attempts.
 */
export interface IAdminUser extends Document {
    email: string;
    passwordHash: string;
    role: 'super_admin' | 'admin' | 'viewer';
    isActive: boolean;
    lastLoginAt?: Date;
    refreshTokenHash?: string;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    isLocked(): boolean;
    incrementFailedAttempts(lockoutMinutes: number, maxAttempts: number): Promise<void>;
    resetFailedAttempts(): Promise<void>;
}
export declare const AdminUser: Model<IAdminUser>;
//# sourceMappingURL=AdminUser.d.ts.map