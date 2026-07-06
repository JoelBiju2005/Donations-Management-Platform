"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automateSuccessfulDonationReceipt = automateSuccessfulDonationReceipt;
const TempleSettings_1 = require("../../models/TempleSettings");
const storage_1 = require("../storage");
const pdfService_1 = require("../pdf/pdfService");
const emailService_1 = require("../email/emailService");
const logger_1 = require("../../core/logger");
/**
 * Automates the creation of a professional PDF receipt,
 * uploads it to AWS S3, saves the PDF URL to the database,
 * and sends a confirmation email to the donor with the receipt attached.
 */
async function automateSuccessfulDonationReceipt(donation) {
    const log = logger_1.logger.child({ donationId: donation._id, task: 'receipt_automation' });
    log.info('Starting receipt automation flow');
    try {
        const settings = await (0, TempleSettings_1.getTempleSettings)();
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
        const qrVerificationStatus = donation.verification.result === 'verified'
            ? 'Verified Successful (AI Verified)'
            : 'Manually Approved by Administrator';
        // 3. Generate PDF Buffer
        const pdfBuffer = await (0, pdfService_1.generateReceiptPdf)({
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
        const storage = (0, storage_1.getStorageProvider)();
        const pdfFilename = `receipt-${donation.receipt.receiptNumber}.pdf`;
        const pdfUrl = await storage.save(pdfBuffer, pdfFilename, 'receipts', 'application/pdf');
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
        await (0, emailService_1.sendEmailWithRetry)({
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
    }
    catch (error) {
        log.error({ error }, 'Failed to automate receipt generation and email delivery');
    }
}
//# sourceMappingURL=receiptAutomation.js.map