import { z } from "zod";

export const provisionStudentPortalSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

export const convertPpdbRegistrationSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  provisionPortalAccount: z.boolean().optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

export type ProvisionStudentPortalInput = z.infer<typeof provisionStudentPortalSchema>;
export type ConvertPpdbRegistrationInput = z.infer<typeof convertPpdbRegistrationSchema>;
