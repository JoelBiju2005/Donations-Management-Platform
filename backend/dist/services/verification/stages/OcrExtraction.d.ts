import { OcrResult } from '../types';
/**
 * Stage 1 — OCR Extraction
 * Runs the payment screenshot through Tesseract.js OCR engine.
 * Captures per-word confidence scores, not just raw text.
 *
 * Pluggable: to swap in a cloud OCR API (Google Vision, AWS Textract),
 * implement the same interface and select via environment variable.
 */
export declare function runOcrExtraction(imageBuffer: Buffer, confidenceThreshold: number): Promise<OcrResult>;
//# sourceMappingURL=OcrExtraction.d.ts.map