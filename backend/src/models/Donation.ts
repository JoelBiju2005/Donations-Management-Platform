import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Donation document — the central data model.
 * All monetary values stored as integers in paise (smallest currency unit)
 * to avoid floating-point errors. Converted to rupees only at the display layer.
 */

export interface IDonation extends Document {
  // Donor information (no account required)
  donor: {
    name: string;
    phone: string;
    email: string;
  };

  // Donation details
  amount: number;         // In paise (e.g., 10100 = ₹101.00)
  currency: string;       // ISO 4217 (default: INR)
  dedicationNote?: string;
  paymentMethod: 'upi' | 'bank_transfer';

  // Payment proof
  screenshotUrl: string;
  screenshotHash: string; // Perceptual hash for duplicate detection

  // AI Verification results
  ocr: {
    rawText: string;
    confidence: number; // 0–100
  };
  extractedFields: {
    transactionId?: string;
    utr?: string;
    senderName?: string;
    receiverName?: string;
    date?: string;
    time?: string;
    amount?: number;      // Extracted amount in paise
    status?: string;      // e.g., "Success", "Completed"
  };
  fraudAnalysis: {
    riskScore: number;    // 0–100
    signals: string[];    // Specific fraud indicators found
    flagged: boolean;
  };
  verification: {
    result: 'verified' | 'rejected' | 'pending_admin_review' | 'pending';
    reasons: string[];
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    pipelineOutput?: Record<string, unknown>; // Full pipeline stage results
  };

  // Receipt
  receipt: {
    receiptNumber?: string;
    pdfUrl?: string;
    generatedAt?: Date;
  };

  // Email
  emailStatus: 'pending' | 'sent' | 'failed';

  // Overall status
  status: 'pending_verification' | 'pending_admin_review' | 'successful' | 'rejected' | 'marked_unsuccessful';

  // Idempotency
  idempotencyKey?: string;

  // Session reference
  sessionToken?: string;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donor: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    amount: { type: Number, required: true, min: 100 }, // Minimum ₹1 (100 paise)
    currency: { type: String, default: 'INR', uppercase: true },
    dedicationNote: { type: String, trim: true, maxlength: 500 },
    paymentMethod: {
      type: String,
      enum: ['upi', 'bank_transfer'],
      required: true,
    },
    screenshotUrl: { type: String, default: '' },
    screenshotHash: { type: String, default: '' },

    ocr: {
      rawText: { type: String, default: '' },
      confidence: { type: Number, default: 0, min: 0, max: 100 },
    },
    extractedFields: {
      transactionId: String,
      utr: String,
      senderName: String,
      receiverName: String,
      date: String,
      time: String,
      amount: Number,
      status: String,
    },
    fraudAnalysis: {
      riskScore: { type: Number, default: 0, min: 0, max: 100 },
      signals: [{ type: String }],
      flagged: { type: Boolean, default: false },
    },
    verification: {
      result: {
        type: String,
        enum: ['verified', 'rejected', 'pending_admin_review', 'pending'],
        default: 'pending',
      },
      reasons: [{ type: String }],
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
      reviewedAt: Date,
      pipelineOutput: { type: Schema.Types.Mixed },
    },

    receipt: {
      receiptNumber: { type: String, unique: true, sparse: true },
      pdfUrl: String,
      generatedAt: Date,
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending_verification', 'pending_admin_review', 'successful', 'rejected', 'marked_unsuccessful'],
      default: 'pending_verification',
    },

    idempotencyKey: { type: String, unique: true, sparse: true },
    sessionToken: String,

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries (backing all searchable/filterable fields)
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ 'donor.email': 1 });
donationSchema.index({ 'donor.phone': 1 });
donationSchema.index({ 'donor.name': 'text' });
donationSchema.index({ 'receipt.receiptNumber': 1 });
donationSchema.index({ 'extractedFields.transactionId': 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ isDeleted: 1, status: 1 });
donationSchema.index({ idempotencyKey: 1 });

// Exclude soft-deleted documents by default
donationSchema.pre('find', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

donationSchema.pre('findOne', function () {
  if (!(this as any)._conditions.isDeleted) {
    this.where({ isDeleted: false });
  }
});

export const Donation: Model<IDonation> = mongoose.model<IDonation>('Donation', donationSchema);
