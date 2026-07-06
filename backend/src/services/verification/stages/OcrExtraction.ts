import Tesseract from 'tesseract.js';
import { OcrResult } from '../types';
import { logger } from '../../../core/logger';

/**
 * Stage 1 — OCR Extraction
 * Runs the payment screenshot through Tesseract.js OCR engine.
 * Captures per-word confidence scores, not just raw text.
 *
 * Pluggable: to swap in a cloud OCR API (Google Vision, AWS Textract),
 * implement the same interface and select via environment variable.
 */
export async function runOcrExtraction(
  imageBuffer: Buffer,
  confidenceThreshold: number
): Promise<OcrResult> {
  try {
    const worker = await Tesseract.createWorker('eng');

    // Use recognize with detailed output
    const result = await worker.recognize(imageBuffer);

    // Extract per-word confidences
    const wordConfidences: { word: string; confidence: number }[] = [];

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

    logger.debug(
      { confidence, threshold: confidenceThreshold, wordCount: wordConfidences.length, passed },
      'OCR extraction complete'
    );

    return {
      rawText: result.data.text,
      confidence: Math.round(confidence * 100) / 100,
      wordConfidences,
      passed,
      failureReason: !passed
        ? `OCR confidence (${confidence.toFixed(1)}%) is below the threshold (${confidenceThreshold}%). The image may be unclear or low quality.`
        : undefined,
    };
  } catch (error: any) {
    logger.error({ error }, 'OCR extraction failed');

    return {
      rawText: '',
      confidence: 0,
      wordConfidences: [],
      passed: false,
      failureReason: 'OCR processing failed. The image may be corrupted or in an unsupported format.',
    };
  }
}
