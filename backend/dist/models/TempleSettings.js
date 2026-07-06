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
exports.TempleSettings = void 0;
exports.getTempleSettings = getTempleSettings;
const mongoose_1 = __importStar(require("mongoose"));
const templeSettingsSchema = new mongoose_1.Schema({
    templeName: { type: String, default: 'Sri Devi Temple' },
    aboutText: {
        type: String,
        default: 'Sri Devi Temple is a sacred place of worship dedicated to the Divine Mother. For centuries, devotees have gathered here to seek blessings, find peace, and participate in the rich spiritual traditions that connect us to our heritage.',
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
}, {
    timestamps: true,
    collection: 'temple_settings',
});
exports.TempleSettings = mongoose_1.default.model('TempleSettings', templeSettingsSchema);
/**
 * Get or create the singleton settings document.
 * Always returns exactly one document.
 */
async function getTempleSettings() {
    let settings = await exports.TempleSettings.findOne();
    if (!settings) {
        settings = await exports.TempleSettings.create({});
    }
    return settings;
}
//# sourceMappingURL=TempleSettings.js.map