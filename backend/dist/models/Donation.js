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
exports.Donation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const donationSchema = new mongoose_1.Schema({
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
        reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminUser' },
        reviewedAt: Date,
        pipelineOutput: { type: mongoose_1.Schema.Types.Mixed },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
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
    if (!this._conditions.isDeleted) {
        this.where({ isDeleted: false });
    }
});
donationSchema.pre('findOne', function () {
    if (!this._conditions.isDeleted) {
        this.where({ isDeleted: false });
    }
});
exports.Donation = mongoose_1.default.model('Donation', donationSchema);
//# sourceMappingURL=Donation.js.map