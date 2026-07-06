/**
 * Dashboard statistics — MongoDB aggregation pipelines.
 * Only counts status: 'successful' for monetary totals.
 */
export declare const getDashboardStats: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Public aggregate stats (for homepage impact counter).
 * Never exposes donor PII — only aggregate numbers.
 */
export declare const getPublicStats: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=stats.controller.d.ts.map