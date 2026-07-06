import { IDonation } from '../../models/Donation';
/**
 * Automates the creation of a professional PDF receipt,
 * uploads it to AWS S3, saves the PDF URL to the database,
 * and sends a confirmation email to the donor with the receipt attached.
 */
export declare function automateSuccessfulDonationReceipt(donation: IDonation): Promise<void>;
//# sourceMappingURL=receiptAutomation.d.ts.map