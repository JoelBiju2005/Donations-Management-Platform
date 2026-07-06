interface EmailOptions {
    to: {
        email: string;
        name?: string;
    };
    subject: string;
    html: string;
    attachments?: Array<{
        content: string;
        name: string;
        contentType: string;
    }>;
}
/**
 * Email service wrapping Brevo transactional API behind an interface.
 * Gracefully degrades to console logging if BREVO_API_KEY is not set.
 *
 * The provider itself could be swapped later (e.g., to SendGrid, Mailgun)
 * by implementing the same interface.
 */
export declare function sendEmail(options: EmailOptions): Promise<boolean>;
/**
 * Send email with exponential backoff retry on transient failures.
 */
export declare function sendEmailWithRetry(options: EmailOptions, maxRetries?: number): Promise<boolean>;
export {};
//# sourceMappingURL=emailService.d.ts.map