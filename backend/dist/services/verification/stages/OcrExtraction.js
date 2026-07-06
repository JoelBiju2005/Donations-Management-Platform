"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOcrExtraction = runOcrExtraction;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const logger_1 = require("../../../core/logger");
/**
 * Stage 1 — OCR Extraction
 * Runs the payment screenshot through Tesseract.js OCR engine.
 * Captures per-word confidence scores, not just raw text.
 *
 * Pluggable: to swap in a cloud OCR API (Google Vision, AWS Textract),
 * implement the same interface and select via environment variable.
 */
async function runOcrExtraction(imageBuffer, confidenceThreshold) {
    try {
        const worker = await tesseract_js_1.default.createWorker('eng');
        // Use recognize with detailed output
        const result = await worker.recognize(imageBuffer);
        // Extract per-word confidences
        const wordConfidences = [];
        if (result.data.words) {
            for (const word of result.data.words) {
                wordConfidences.push({
                    word: word.text,
                    confidence: word.confidence,
                });
            }
        }
        // Calculate mean confidence
        const confidence = wordConfidences.length > 0
            ? wordConfidences.reduce((sum, w) => sum + w.confidence, 0) / wordConfidences.length
            : 0;
        await worker.terminate();
        const passed = confidence >= confidenceThreshold;
        logger_1.logger.debug({ confidence, threshold: confidenceThreshold, wordCount: wordConfidences.length, passed }, 'OCR extraction complete');
        return {
            rawText: result.data.text,
            confidence: Math.round(confidence * 100) / 100,
            wordConfidences,
            passed,
            failureReason: !passed
                ? `OCR confidence (${confidence.toFixed(1)}%) is below the threshold (${confidenceThreshold}%). The image may be unclear or low quality.`
                : undefined,
        };
    }
    catch (error) {
        logger_1.logger.error({ error }, 'OCR extraction failed');
        return {
            rawText: '',
            confidence: 0,
            wordConfidences: [],
            passed: false,
            failureReason: 'OCR processing failed. The image may be corrupted or in an unsupported format.',
        };
    }
}
//# sourceMappingURL=OcrExtraction.js.map