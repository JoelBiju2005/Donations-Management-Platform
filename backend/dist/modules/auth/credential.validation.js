"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeCredentialsSchema = void 0;
const zod_1 = require("zod");
exports.changeCredentialsSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address').toLowerCase().trim(),
    oldPassword: zod_1.z.string().min(1, 'Old password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters long').optional(),
});
//# sourceMappingURL=credential.validation.js.map