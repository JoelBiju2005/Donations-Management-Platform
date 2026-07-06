/**
 * Generate a PDF receipt for a donation.
 */
export declare function generateReceiptPdf(data: {
    templeName: string;
    templeAddress: string;
    templePhone: string;
    templeEmail: string;
    registrationNumber?: string;
    logoUrl?: string;
    receiptNumber: string;
    donorName: string;
    donorPhone: string;
    donorEmail: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
    date: string;
    time?: string;
    dedicationNote?: string;
}): Promise<Buffer>;
/**
 * Generate a bank statement-style report PDF.
 */
export declare function generateStatementPdf(data: {
    templeName: string;
    templeAddress: string;
    registrationNumber?: string;
    periodStart: string;
    periodEnd: string;
    donations: Array<{
        receiptNumber: string;
        donorName: string;
        transactionId?: string;
        date: string;
        time?: string;
        amount: string;
    }>;
    grandTotal: string;
    generatedAt: string;
    generatedBy: string;
}): Promise<Buffer>;
//# sourceMappingURL=pdfService.d.ts.map