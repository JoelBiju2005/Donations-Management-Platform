import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

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

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementFailedAttempts(lockoutMinutes: number, maxAttempts: number): Promise<void>;
  resetFailedAttempts(): Promise<void>;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'viewer'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    refreshTokenHash: String,
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if modified)
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  // If the value looks like it's already hashed (starts with $2a$ or $2b$), skip
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare candidate password against stored hash
adminUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if account is currently locked
adminUserSchema.methods.isLocked = function (): boolean {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Increment failed login attempts, lock account if threshold exceeded
adminUserSchema.methods.incrementFailedAttempts = async function (
  lockoutMinutes: number,
  maxAttempts: number
): Promise<void> {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
  }

  await this.save();
};

// Reset failed attempts on successful login
adminUserSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  if (this.failedLoginAttempts > 0 || this.lockedUntil) {
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    await this.save();
  }
};

// Never return sensitive fields in JSON serialization
adminUserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as Record<string, any>;
    delete r.passwordHash;
    delete r.refreshTokenHash;
    return r;
  },
});

export const AdminUser: Model<IAdminUser> = mongoose.model<IAdminUser>('AdminUser', adminUserSchema);
