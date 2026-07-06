import { z } from 'zod';

export const changeCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').optional(),
});

export type ChangeCredentialsInput = z.infer<typeof changeCredentialsSchema>;
