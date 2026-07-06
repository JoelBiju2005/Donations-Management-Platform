"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCsv = exports.generateStatement = void 0;
const asyncHandler_1 = require("../../core/asyncHandler");
const Donation_1 = require("../../models/Donation");
const TempleSettings_1 = require("../../models/TempleSettings");
const pdfService_1 = require("../../services/pdf/pdfService");
/**
 * POST /api/reports/statement
 * Generate a PDF statement for a date range. Admin-only.
 */
exports.generateStatement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.body;
    const admin = req.admin;
    const filter = {
        status: 'successful',
        isDeleted: false,
    };
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const donations = await Donation_1.Donation.find(filter)
        .sort({ createdAt: 1 })
        .lean();
    const settings = await (0, TempleSettings_1.getTempleSettings)();
    const grandTotal = donations.reduce((sum, d) => sum + d.amount, 0);
    const pdfBuffer = await (0, pdfService_1.generateStatementPdf)({
        templeName: settings.templeName,
        templeAddress: settings.address,
        registrationNumber: settings.registrationNumber,
        periodStart: startDate || 'All time',
        periodEnd: endDate || 'Present',
        donations: donations.map((d) => ({
            receiptNumber: d.receipt?.receiptNumber || '—',
            donorName: d.donor.name,
            transactionId: d.extractedFields?.transactionId || '—',
            date: new Date(d.createdAt).toLocaleDateString('en-IN'),
            time: new Date(d.createdAt).toLocaleTimeString('en-IN'),
            amount: (d.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        })),
        grandTotal: (grandTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        generatedAt: new Date().toLocaleString('en-IN'),
        generatedBy: admin.email,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="statement-${startDate || 'all'}-to-${endDate || 'now'}.pdf"`);
    res.send(pdfBuffer);
});
/**
 * GET /api/reports/export
 * Export donations as CSV. Admin-only. Streamed for large datasets.
 */
exports.exportCsv = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, status } = req.query;
    const filter = { isDeleted: false };
    if (status)
        filter.status = status;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donations-export.csv"');
    // CSV header
    res.write('Receipt Number,Donor Name,Email,Phone,Amount (₹),Payment Method,Status,Transaction ID,Date\n');
    // Stream in batches
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
        const batch = await Donation_1.Donation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(batchSize)
            .lean();
        for (const d of batch) {
            const row = [
                d.receipt?.receiptNumber || '',
                `"${d.donor.name}"`,
                d.donor.email,
                d.donor.phone,
                (d.amount / 100).toFixed(2),
                d.paymentMethod,
                d.status,
                d.extractedFields?.transactionId || '',
                new Date(d.createdAt).toISOString(),
            ].join(',');
            res.write(row + '\n');
        }
        skip += batchSize;
        hasMore = batch.length === batchSize;
    }
    res.end();
});
//# sourceMappingURL=reports.controller.js.map