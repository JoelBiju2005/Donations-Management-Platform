import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../core/logger';

// Lazy-loaded Puppeteer to avoid startup cost
let puppeteer: typeof import('puppeteer') | null = null;

async function getPuppeteer() {
  if (!puppeteer) {
    puppeteer = await import('puppeteer');
  }
  return puppeteer;
}

/**
 * PDF Generation Service using Puppeteer (HTML→PDF).
 * Uses Handlebars templates for data injection so receipts
 * visually match the website's branding.
 */

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const source = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  templateCache.set(templateName, template);
  return template;
}

/**
 * Generate a PDF receipt for a donation.
 */
export async function generateReceiptPdf(data: {
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
  amount: string;          // Formatted (e.g., "1,001.00")
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  date: string;
  time?: string;
  dedicationNote?: string;
}): Promise<Buffer> {
  const template = await loadTemplate('receipt');
  const html = template(data);
  return htmlToPdf(html);
}

/**
 * Generate a bank statement-style report PDF.
 */
export async function generateStatementPdf(data: {
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
}): Promise<Buffer> {
  const template = await loadTemplate('statement');
  const html = template(data);
  return htmlToPdf(html);
}

/**
 * Convert HTML string to PDF buffer using Puppeteer.
 */
async function htmlToPdf(html: string): Promise<Buffer> {
  const pup = await getPuppeteer();

  let browser;
  try {
    browser = await pup.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.error({ error }, 'PDF generation failed');
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
