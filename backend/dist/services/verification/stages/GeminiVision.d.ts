export interface GeminiVisionResult {
    transactionId?: string;
    amount?: number;
    currency?: string;
    paymentDate?: string;
    paymentTime?: string;
    senderName?: string;
    receiverName?: string;
    paymentMethod?: string;
    screenshotConfidence: number;
    possibleManipulation: boolean;
    reason: string;
    isPaymentSuccessful: boolean;
}
/**
 * Gemini 2.5 Flash Vision Stage.
 * Analyzes payment screenshot and returns highly accurate structured JSON.
 */
export declare function runGeminiVisionAnalysis(imageBuffer: Buffer, mimetype: string): Promise<GeminiVisionResult>;
//# sourceMappingURL=GeminiVision.d.ts.map