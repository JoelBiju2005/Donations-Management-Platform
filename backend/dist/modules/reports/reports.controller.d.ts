/**
 * POST /api/reports/statement
 * Generate a PDF statement for a date range. Admin-only.
 */
export declare const generateStatement: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * GET /api/reports/export
 * Export donations as CSV. Admin-only. Streamed for large datasets.
 */
export declare const exportCsv: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=reports.controller.d.ts.map