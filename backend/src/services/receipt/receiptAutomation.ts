import { IDonation } from '../../models/Donation';
import { getTempleSettings } from '../../models/TempleSettings';
import { getStorageProvider } from '../storage';
import { generateReceiptPdf } from '../pdf/pdfService';
import { sendEmailWithRetry } from '../email/emailService';
import { logger } from '../../core/logger';
import path from 'path';

/**
 * Automates the creation of a professional PDF receipt,
 * uploads it to AWS S3, saves the PDF URL to the database,
 * and sends a confirmation email to the donor with the receipt attached.
 */
export async function automateSuccessfulDonationReceipt(donation: IDonation): Promise<void> {
  const log = logger.child({ donationId: donation._id, task: 'receipt_automation' });
  log.info('Starting receipt automation flow');

  try {
    const settings = await getTempleSettings();

    // 1. Double check receipt number exists
    if (!donation.receipt?.receiptNumber) {
      log.error('Cannot generate receipt: receipt number missing');
      return;
    }

    // 2. Prepare formatting
    const formattedAmount = (donation.amount / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const receiptDate = new Date(donation.receipt.generatedAt || new Date()).toLocaleDateString('en-IN');
    const generatedTimestamp = new Date().toLocaleString('en-IN');

    // Determine verification status text
    const qrVerificationStatus =
      donation.verification.result === 'verified'
        ? 'Verified Successful (AI Verified)'
        : 'Manually Approved by Administrator';

    // 3. Generate PDF Buffer
    const pdfBuffer = await generateReceiptPdf({
      templeName: settings.templeName,
      templeAddress: settings.address,
      templePhone: settings.phone,
      templeEmail: settings.email,
      registrationNumber: settings.registrationNumber,
      logoUrl: settings.logoUrl || '',
      receiptNumber: donation.receipt.receiptNumber,
      donorName: donation.donor.name,
      donorPhone: donation.donor.phone,
      donorEmail: donation.donor.email,
      amount: formattedAmount,
      currency: donation.currency,
      paymentMethod: donation.paymentMethod,
      transactionId: donation.extractedFields?.transactionId || donation.extractedFields?.utr || 'N/A',
      date: receiptDate,
      time: donation.extractedFields?.time || '',
      dedicationNote: donation.dedicationNote || '',
      qrVerificationStatus,
      generatedTimestamp,
    });

    log.debug('Receipt PDF buffer generated successfully');

    // 4. Save PDF to S3 Storage Provider
    const storage = getStorageProvider();
    const pdfFilename = `receipt-${donation.receipt.receiptNumber}.pdf`;

    const pdfUrl = await storage.save(
      pdfBuffer,
      pdfFilename,
      'receipts',
      'application/pdf'
    );

    log.info({ pdfUrl }, 'Receipt PDF uploaded to S3 storage');

    // Save PDF Url back to database
    donation.receipt.pdfUrl = pdfUrl;
    await donation.save();

    // 5. Send Email with PDF Attachment via Brevo
    // We base64 encode the pdf buffer to attach it directly
    const base64Pdf = pdfBuffer.toString('base64');

    // Compile email template variables manually or using a simple template engine
    const emailHtml = `
      <h3>🙏 Namaste, ${donation.donor.name}!</h3>
      <p>Thank you for your generous donation to ${settings.templeName}. Your contribution has been verified successfully.</p>
      <p>May the Divine Mother bless you and your family with peace and prosperity.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Receipt Number:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${donation.receipt.receiptNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount Paid:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #6B1D24;">₹${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Payment Method:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-transform: capitalize;">${donation.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Transaction ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${donation.extractedFields?.transactionId || 'N/A'}</td>
        </tr>
      </table>

      <p>Your official PDF receipt is attached to this email. You can also view or download your receipt anytime using the link below:</p>
      <p><a href="${pdfUrl}" style="background-color: #C9A227; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Download PDF Receipt</a></p>
      
      <br/>
      <hr style="border: 0; border-top: 1px solid #eee;"/>
      <p style="font-size: 11px; color: #777; text-align: center;">
        ${settings.templeName} <br/>
        ${settings.address} <br/>
        Phone: ${settings.phone} | Email: ${settings.email}
      </p>
    `;

    await sendEmailWithRetry({
      to: { email: donation.donor.email, name: donation.donor.name },
      subject: `🙏 Donation Receipt Verified - ${donation.receipt.receiptNumber}`,
      html: emailHtml,
      attachments: [
        {
          content: base64Pdf,
          name: `Receipt-${donation.receipt.receiptNumber}.pdf`,
          contentType: 'application/pdf',
        },
      ],
    });

    log.info('Confirmation email sent successfully with S3 PDF attachment');
  } catch (error: any) {
    log.error({ error }, 'Failed to automate receipt generation and email delivery');
  }
}
