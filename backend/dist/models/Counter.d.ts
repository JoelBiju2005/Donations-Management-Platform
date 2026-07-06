import { Document, Model } from 'mongoose';
/**
 * Counter model for generating sequential, human-readable receipt numbers.
 * Uses MongoDB's atomic findOneAndUpdate to ensure thread-safe incrementing.
 *
 * Receipt format: TEMPLE-{YEAR}-{PADDED_SEQUENCE}
 * Example: TEMPLE-2026-000482
 */
export interface ICounter extends Document {
    name: string;
    year: number;
    sequence: number;
}
export declare const Counter: Model<ICounter>;
/**
 * Generate the next receipt number atomically.
 * Resets sequence annually. Format: TEMPLE-YYYY-NNNNNN
 */
export declare function getNextReceiptNumber(): Promise<string>;
//# sourceMappingURL=Counter.d.ts.map