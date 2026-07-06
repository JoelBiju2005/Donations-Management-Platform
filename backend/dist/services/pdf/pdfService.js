"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptPdf = generateReceiptPdf;
exports.generateStatementPdf = generateStatementPdf;
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../core/logger");
// Lazy-loaded Puppeteer to avoid startup cost
let puppeteer = null;
async function getPuppeteer() {
    if (!puppeteer) {
        puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
    }
    return puppeteer;
}
/**
 * PDF Generation Service using Puppeteer (HTML→PDF).
 * Uses Handlebars templates for data injection so receipts
 * visually match the website's branding.
 */
const templateCache = new Map();
async function loadTemplate(templateName) {
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName);
    }
    const templatePath = path_1.default.join(__dirname, 'templates', `${templateName}.hbs`);
    const source = await promises_1.default.readFile(templatePath, 'utf-8');
    const template = handlebars_1.default.compile(source);
    templateCache.set(templateName, template);
    return template;
}
/**
 * Generate a PDF receipt for a donation.
 */
async function generateReceiptPdf(data) {
    const template = await loadTemplate('receipt');
    const html = template(data);
    return htmlToPdf(html);
}
/**
 * Generate a bank statement-style report PDF.
 */
async function generateStatementPdf(data) {
    const template = await loadTemplate('statement');
    const html = template(data);
    return htmlToPdf(html);
}
/**
 * Convert HTML string to PDF buffer using Puppeteer.
 */
async function htmlToPdf(html) {
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
    }
    catch (error) {
        logger_1.logger.error({ error }, 'PDF generation failed');
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
//# sourceMappingURL=pdfService.js.map