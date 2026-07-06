"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = exports.getDashboardStats = void 0;
const asyncHandler_1 = require("../../core/asyncHandler");
const Donation_1 = require("../../models/Donation");
/**
 * Dashboard statistics — MongoDB aggregation pipelines.
 * Only counts status: 'successful' for monetary totals.
 */
exports.getDashboardStats = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const [totalSuccessful, todayTotal, weekTotal, monthTotal, yearTotal, statusCounts, recentDonations, monthlyTrend, paymentMethodSplit, avgDonation, largestThisMonth,] = await Promise.all([
        // Total successful donations amount
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // Today's total
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false, createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // This week's total
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false, createdAt: { $gte: weekStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // This month's total
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false, createdAt: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // This year's total
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false, createdAt: { $gte: yearStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // Status counts
        Donation_1.Donation.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Recent 10 donations
        Donation_1.Donation.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('donor.name amount status paymentMethod createdAt receipt.receiptNumber')
            .lean(),
        // Monthly trend (last 12 months)
        Donation_1.Donation.aggregate([
            {
                $match: {
                    status: 'successful',
                    isDeleted: false,
                    createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
                },
            },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        // Payment method split
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false } },
            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // Average donation size
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false } },
            { $group: { _id: null, avg: { $avg: '$amount' } } },
        ]),
        // Largest donation this month
        Donation_1.Donation.findOne({ status: 'successful', isDeleted: false, createdAt: { $gte: monthStart } })
            .sort({ amount: -1 })
            .select('amount donor.name createdAt')
            .lean(),
    ]);
    // Format status counts
    const statusMap = {};
    for (const s of statusCounts) {
        statusMap[s._id] = s.count;
    }
    res.json({
        success: true,
        data: {
            totals: {
                all: { amount: totalSuccessful[0]?.total || 0, count: totalSuccessful[0]?.count || 0 },
                today: { amount: todayTotal[0]?.total || 0, count: todayTotal[0]?.count || 0 },
                week: { amount: weekTotal[0]?.total || 0, count: weekTotal[0]?.count || 0 },
                month: { amount: monthTotal[0]?.total || 0, count: monthTotal[0]?.count || 0 },
                year: { amount: yearTotal[0]?.total || 0, count: yearTotal[0]?.count || 0 },
            },
            statusCounts: statusMap,
            recentDonations,
            monthlyTrend: monthlyTrend.map((m) => ({
                month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
                total: m.total,
                count: m.count,
            })),
            paymentMethodSplit: paymentMethodSplit.map((p) => ({
                method: p._id,
                total: p.total,
                count: p.count,
            })),
            averageDonation: Math.round(avgDonation[0]?.avg || 0),
            largestThisMonth: largestThisMonth
                ? { amount: largestThisMonth.amount, donorName: largestThisMonth.donor?.name }
                : null,
        },
    });
});
/**
 * Public aggregate stats (for homepage impact counter).
 * Never exposes donor PII — only aggregate numbers.
 */
exports.getPublicStats = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const [yearlyTotal, totalDonors] = await Promise.all([
        Donation_1.Donation.aggregate([
            { $match: { status: 'successful', isDeleted: false, createdAt: { $gte: yearStart } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Donation_1.Donation.distinct('donor.email', { status: 'successful', isDeleted: false }),
    ]);
    res.json({
        success: true,
        data: {
            yearlyDonationsTotal: yearlyTotal[0]?.total || 0,
            yearlyDonationsCount: yearlyTotal[0]?.count || 0,
            totalUniqueDonors: totalDonors.length,
        },
    });
});
//# sourceMappingURL=stats.controller.js.map