import { FraudDetectionResult } from '../types';
/**
 * Run all fraud detection checks and compute weighted risk score.
 */
export declare function runFraudDetection(imageBuffer: Buffer, screenshotHash: string, donationId: string, fraudThreshold: number): Promise<FraudDetectionResult>;
//# sourceMappingURL=FraudDetection.d.ts.map