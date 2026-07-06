import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Temple Settings — singleton document storing all configurable temple information.
 * Editable from the admin settings panel so the temple never needs a developer
 * to update payment details, verification thresholds, or contact information.
 */

export interface IDonationPurpose {
  title: string;
  description: string;
  icon?: string;       // Icon name/emoji for the purpose card
  isActive: boolean;
}

export interface ITempleSettings extends Document {
  // Temple Identity
  templeName: string;
  aboutText: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  registrationNumber?: string; // Trust/society registration for receipts
  mapEmbedUrl?: string;        // Google Maps embed URL
  templeTimings?: string;

  // Bank Details (editable, never hardcoded)
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };

  // UPI Details (editable)
  upiId: string;
  upiQrCodeUrl?: string; // Path/URL to QR code image

  // Donation Purposes (configurable cards on homepage)
  donationPurposes: IDonationPurpose[];

  // Verification Thresholds (feature-flagged manual review threshold)
  verificationConfig: {
    ocrConfidenceThreshold: number;    // 0–100, default 60
    fraudRiskThreshold: number;        // 0–100, default 70
    timestampMaxAgeHours: number;      // Default 48
    amountMismatchTolerancePaise: number; // Default 100 (₹1)
    autoApproveEnabled: boolean;       // Feature flag for auto-approval
    requireManualReviewAboveAmount: number; // Amount in paise above which manual review is forced
  };

  // Social Links
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };

  // Logo/Branding
  logoUrl?: string;

  updatedAt: Date;
}

const templeSettingsSchema = new Schema<ITempleSettings>(
  {
    templeName: { type: String, default: 'Sri Devi Temple' },
    aboutText: {
      type: String,
      default:
        'Sri Devi Temple is a sacred place of worship dedicated to the Divine Mother. For centuries, devotees have gathered here to seek blessings, find peace, and participate in the rich spiritual traditions that connect us to our heritage.',
    },
    address: { type: String, default: '123 Temple Street, Sacred City, State 560001' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'info@srideviTemple.org' },
    website: String,
    registrationNumber: { type: String, default: '' },
    mapEmbedUrl: String,
    templeTimings: { type: String, default: '6:00 AM – 12:00 PM, 4:00 PM – 9:00 PM' },

    bankDetails: {
      accountHolderName: { type: String, default: 'Sri Devi Temple Trust' },
      bankName: { type: String, default: 'State Bank of India' },
      accountNumber: { type: String, default: '1234567890123456' },
      ifscCode: { type: String, default: 'SBIN0001234' },
      branch: { type: String, default: 'Temple Road Branch' },
    },
    upiId: { type: String, default: 'srideviTemple@upi' },
    upiQrCodeUrl: String,

    donationPurposes: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
          icon: String,
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        {
          title: 'Temple Maintenance',
          description: 'Help preserve and maintain the sacred temple structure, ensuring it remains a beautiful place of worship for generations to come.',
          icon: '🏛️',
          isActive: true,
        },
        {
          title: 'Annadanam (Food Seva)',
          description: 'Contribute to the daily free meal program that feeds hundreds of devotees and visitors, embodying the spirit of selfless service.',
          icon: '🙏',
          isActive: true,
        },
        {
          title: 'Festival Celebrations',
          description: 'Support the grand celebrations of traditional festivals that bring the community together in devotion and joy.',
          icon: '🪔',
          isActive: true,
        },
        {
          title: 'Community Programs',
          description: 'Fund educational initiatives, health camps, and cultural programs that uplift the local community.',
          icon: '🤝',
          isActive: true,
        },
      ],
    },

    verificationConfig: {
      ocrConfidenceThreshold: { type: Number, default: 60 },
      fraudRiskThreshold: { type: Number, default: 70 },
      timestampMaxAgeHours: { type: Number, default: 48 },
      amountMismatchTolerancePaise: { type: Number, default: 100 },
      autoApproveEnabled: { type: Boolean, default: true },
      requireManualReviewAboveAmount: { type: Number, default: 1000000 }, // ₹10,000
    },

    socialLinks: {
      facebook: String,
      instagram: String,
      youtube: String,
      twitter: String,
    },

    logoUrl: String,
  },
  {
    timestamps: true,
    collection: 'temple_settings',
  }
);

export const TempleSettings: Model<ITempleSettings> = mongoose.model<ITempleSettings>(
  'TempleSettings',
  templeSettingsSchema
);

/**
 * Get or create the singleton settings document.
 * Always returns exactly one document.
 */
export async function getTempleSettings(): Promise<ITempleSettings> {
  let settings = await TempleSettings.findOne();
  if (!settings) {
    settings = await TempleSettings.create({});
  }
  return settings;
}
