import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Counter model for generating sequential, human-readable receipt numbers.
 * Uses MongoDB's atomic findOneAndUpdate to ensure thread-safe incrementing.
 *
 * Receipt format: TEMPLE-{YEAR}-{PADDED_SEQUENCE}
 * Example: TEMPLE-2026-000482
 */

export interface ICounter extends Document {
  name: string;      // Counter identifier (e.g., 'receipt')
  year: number;      // Year for annual reset
  sequence: number;  // Current sequence value
}

const counterSchema = new Schema<ICounter>({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  sequence: { type: Number, default: 0 },
});

counterSchema.index({ name: 1, year: 1 }, { unique: true });

export const Counter: Model<ICounter> = mongoose.model<ICounter>('Counter', counterSchema);

/**
 * Generate the next receipt number atomically.
 * Resets sequence annually. Format: TEMPLE-YYYY-NNNNNN
 */
export async function getNextReceiptNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: 'receipt', year: currentYear },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const paddedSequence = String(counter.sequence).padStart(6, '0');
  return `TEMPLE-${currentYear}-${paddedSequence}`;
}
