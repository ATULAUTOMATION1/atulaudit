// =============================================================================
// Lead Form Validation
// =============================================================================

import { z } from "zod";

export const leadFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name is too long."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .max(254, "Email is too long."),
  company: z.string().max(200, "Company name is too long.").default(""),
  phone: z.string().max(20, "Phone number is too long.").default(""),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to be contacted about this audit.",
  }),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
