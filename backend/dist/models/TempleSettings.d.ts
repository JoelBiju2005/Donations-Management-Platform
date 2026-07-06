import { Document, Model } from 'mongoose';
/**
 * Temple Settings — singleton document storing all configurable temple information.
 * Editable from the admin settings panel so the temple never needs a developer
 * to update payment details, verification thresholds, or contact information.
 */
export interface IDonationPurpose {
    title: string;
    description: string;
    icon?: string;
    isActive: boolean;
}
export interface ITempleSettings extends Document {
    templeName: string;
    aboutText: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    registrationNumber?: string;
    mapEmbedUrl?: string;
    templeTimings?: string;
    bankDetails: {
        accountHolderName: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        branch: string;
    };
    upiId: string;
    upiQrCodeUrl?: string;
    donationPurposes: IDonationPurpose[];
    verificationConfig: {
        ocrConfidenceThreshold: number;
        fraudRiskThreshold: number;
        timestampMaxAgeHours: number;
        amountMismatchTolerancePaise: number;
        autoApproveEnabled: boolean;
        requireManualReviewAboveAmount: number;
    };
    socialLinks: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
        twitter?: string;
    };
    logoUrl?: string;
    updatedAt: Date;
}
export declare const TempleSettings: Model<ITempleSettings>;
/**
 * Get or create the singleton settings document.
 * Always returns exactly one document.
 */
export declare function getTempleSettings(): Promise<ITempleSettings>;
//# sourceMappingURL=TempleSettings.d.ts.map