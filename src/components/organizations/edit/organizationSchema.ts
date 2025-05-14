
import { z } from "zod";

// Define form schema
export const organizationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  website_url: z.string().url({ message: "Please enter a valid URL" }).optional().nullable(),
  logo_url: z.string().optional().nullable(),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
