import {z} from 'zod';
const email = z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.');
export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password.') });
export const registrationSchema = z.object({email, password:z.string().min(8, 'Use at least 8 characters.'), confirmPassword:z.string().min(1, 'Confirm your password.')})
  .refine(data=>data.password===data.confirmPassword,{message:'Passwords must match.',path:['confirmPassword']});
export const resetPasswordSchema = z.object({email});
export type LoginFields = z.infer<typeof loginSchema>;
export type RegistrationFields = z.infer<typeof registrationSchema>;
export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;
