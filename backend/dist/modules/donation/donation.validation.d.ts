import { z } from 'zod';
export declare const createDonationSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    paymentMethod: z.ZodEnum<["upi", "bank_transfer"]>;
    dedicationNote: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    amount: number;
    currency: string;
    paymentMethod: "upi" | "bank_transfer";
    phone: string;
    dedicationNote?: string | undefined;
    idempotencyKey?: string | undefined;
}, {
    email: string;
    name: string;
    amount: number;
    paymentMethod: "upi" | "bank_transfer";
    phone: string;
    currency?: string | undefined;
    dedicationNote?: string | undefined;
    idempotencyKey?: string | undefined;
}>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export declare const initDonationSessionSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    paymentMethod: z.ZodEnum<["upi", "bank_transfer"]>;
    dedicationNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: string;
    paymentMethod: "upi" | "bank_transfer";
    dedicationNote?: string | undefined;
}, {
    amount: number;
    paymentMethod: "upi" | "bank_transfer";
    currency?: string | undefined;
    dedicationNote?: string | undefined;
}>;
export type InitDonationSessionInput = z.infer<typeof initDonationSessionSchema>;
export declare const donationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["upi", "bank_transfer"]>>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    status?: string | undefined;
    search?: string | undefined;
    paymentMethod?: "upi" | "bank_transfer" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    paymentMethod?: "upi" | "bank_transfer" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type DonationQueryInput = z.infer<typeof donationQuerySchema>;
export declare const updateDonationStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["successful", "rejected", "marked_unsuccessful"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "rejected" | "successful" | "marked_unsuccessful";
    reason: string;
}, {
    status: "rejected" | "successful" | "marked_unsuccessful";
    reason: string;
}>;
//# sourceMappingURL=donation.validation.d.ts.map