import { getConfig } from '../../config/env';
import { logger } from '../../core/logger';

interface EmailOptions {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  attachments?: Array<{
    content: string; // Base64 encoded
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
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const config = getConfig();

  // Dev fallback: log to console if no API key
  if (!config.BREVO_API_KEY) {
    logger.info(
      {
        to: options.to.email,
        subject: options.subject,
        hasAttachments: !!options.attachments?.length,
      },
      '📧 [DEV] Email would be sent (BREVO_API_KEY not set)'
    );
    return true;
  }

  try {
    // Dynamic import to avoid requiring the package when not configured
    const { BrevoClient } = await import('@getbrevo/brevo') as any;

    const brevo = new BrevoClient({ apiKey: config.BREVO_API_KEY });

    const emailData: any = {
      subject: options.subject,
      htmlContent: options.html,
      sender: {
        name: config.EMAIL_FROM_NAME,
        email: config.EMAIL_FROM_ADDRESS,
      },
      to: [{ email: options.to.email, name: options.to.name }],
    };

    if (options.attachments?.length) {
      emailData.attachment = options.attachments.map((a) => ({
        content: a.content,
        name: a.name,
        contentType: a.contentType,
      }));
    }

    await brevo.transactionalEmails.sendTransacEmail(emailData);

    logger.info({ to: options.to.email, subject: options.subject }, 'Email sent successfully');
    return true;
  } catch (error: any) {
    logger.error({ error, to: options.to.email }, 'Failed to send email');
    return false;
  }
}

/**
 * Send email with exponential backoff retry on transient failures.
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const success = await sendEmail(options);
    if (success) return true;

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(
        { attempt, maxRetries, delay, to: options.to.email },
        'Retrying email send...'
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error({ to: options.to.email, maxRetries }, 'Email failed after all retries');
  return false;
}
