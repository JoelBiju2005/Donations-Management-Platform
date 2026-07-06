import { z } from 'zod';
export declare const changeCredentialsSchema: z.ZodObject<{
    email: z.ZodString;
    oldPassword: z.ZodString;
    newPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    oldPassword: string;
    newPassword?: string | undefined;
}, {
    email: string;
    oldPassword: string;
    newPassword?: string | undefined;
}>;
export type ChangeCredentialsInput = z.infer<typeof changeCredentialsSchema>;
//# sourceMappingURL=credential.validation.d.ts.map