import mongoose, { Document, Model } from 'mongoose';
/**
 * Donation document — the central data model.
 * All monetary values stored as integers in paise (smallest currency unit)
 * to avoid floating-point errors. Converted to rupees only at the display layer.
 */
export interface IDonation extends Document {
    donor: {
        name: string;
        phone: string;
        email: string;
    };
    amount: number;
    currency: string;
    dedicationNote?: string;
    paymentMethod: 'upi' | 'bank_transfer';
    screenshotUrl: string;
    screenshotHash: string;
    ocr: {
        rawText: string;
        confidence: number;
    };
    extractedFields: {
        transactionId?: string;
        utr?: string;
        senderName?: string;
        receiverName?: string;
        date?: string;
        time?: string;
        amount?: number;
        status?: string;
    };
    fraudAnalysis: {
        riskScore: number;
        signals: string[];
        flagged: boolean;
    };
    verification: {
        result: 'verified' | 'rejected' | 'pending_admin_review' | 'pending';
        reasons: string[];
        reviewedBy?: mongoose.Types.ObjectId;
        reviewedAt?: Date;
        pipelineOutput?: Record<string, unknown>;
    };
    receipt: {
        receiptNumber?: string;
        pdfUrl?: string;
        generatedAt?: Date;
    };
    emailStatus: 'pending' | 'sent' | 'failed';
    status: 'pending_verification' | 'pending_admin_review' | 'successful' | 'rejected' | 'marked_unsuccessful';
    idempotencyKey?: string;
    sessionToken?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Donation: Model<IDonation>;
//# sourceMappingURL=Donation.d.ts.map