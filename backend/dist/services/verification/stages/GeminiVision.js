"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeminiVisionAnalysis = runGeminiVisionAnalysis;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../../../config/env");
const logger_1 = require("../../../core/logger");
/**
 * Gemini 2.5 Flash Vision Stage.
 * Analyzes payment screenshot and returns highly accurate structured JSON.
 */
async function runGeminiVisionAnalysis(imageBuffer, mimetype) {
    const config = (0, env_1.getConfig)();
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
        logger_1.logger.warn('GEMINI_API_KEY is not set. Gemini Vision analysis skipped.');
        throw new Error('Gemini API key missing');
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash as requested
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
    });
    const base64Image = imageBuffer.toString('base64');
    const prompt = `Analyze this payment receipt or transaction screenshot. Extract all payment details carefully.
Verify if the payment status is explicitly successful. Verify if the image has any visual indicators of digital forgery, inconsistent fonts, or edited details.
You must return a structured JSON response matching the requested schema. Do not include any markdown format blocks.`;
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimetype,
        },
    };
    // Define structured JSON schema response using plain types (compatible with newest SDK)
    const responseSchema = {
        type: 'object',
        properties: {
            transactionId: {
                type: 'string',
                description: 'The transaction reference number, UTR number, or transaction ID.',
            },
            amount: {
                type: 'integer',
                description: 'The total payment amount expressed in paise (smallest currency unit, e.g. ₹100.50 should be 10050, ₹500 should be 50000).',
            },
            currency: {
                type: 'string',
                description: 'The currency code (e.g. INR).',
            },
            paymentDate: {
                type: 'string',
                description: 'The date of the payment transaction (e.g. YYYY-MM-DD or DD-MM-YYYY).',
            },
            paymentTime: {
                type: 'string',
                description: 'The time of the payment transaction (e.g. HH:MM or HH:MM:SS).',
            },
            senderName: {
                type: 'string',
                description: 'The name of the sender/payer/donor.',
            },
            receiverName: {
                type: 'string',
                description: 'The name of the receiver/merchant/temple.',
            },
            paymentMethod: {
                type: 'string',
                description: 'The method of payment (e.g. UPI, IMPS, NEFT, Bank Transfer).',
            },
            screenshotConfidence: {
                type: 'integer',
                description: 'Confidence rating (0-100) of how clear and authentic the screenshot details are.',
            },
            possibleManipulation: {
                type: 'boolean',
                description: 'True if there are suspicious editing signs, font inconsistencies, pixelation around amounts, or cropping anomalies.',
            },
            reason: {
                type: 'string',
                description: 'Explanation for extraction choices, confidence, and manipulation markers.',
            },
            isPaymentSuccessful: {
                type: 'boolean',
                description: 'True if status is clearly Success, Completed, Paid, or Successful. False if pending, failed, or unclear.',
            },
        },
        required: [
            'transactionId',
            'amount',
            'currency',
            'paymentDate',
            'screenshotConfidence',
            'possibleManipulation',
            'reason',
            'isPaymentSuccessful',
        ],
    };
    logger_1.logger.info('Sending screenshot to Gemini 2.5 Flash Vision for analysis');
    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    imagePart,
                ],
            },
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });
    const responseText = result.response.text();
    logger_1.logger.debug({ responseText }, 'Gemini Vision Raw Response');
    const parsed = JSON.parse(responseText);
    return parsed;
}
//# sourceMappingURL=GeminiVision.js.map