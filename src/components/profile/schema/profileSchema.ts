
import * as z from "zod";

// Define the organization relationship schema separately
export const organizationRelationshipSchema = z.object({
  organizationId: z.string(),
  connectionType: z.enum(["current", "former", "ally"]),
  department: z.string().nullable(),
  notes: z.string().nullable()
});

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  twitter_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  website_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  avatar_url: z.string().optional(),
  location_id: z.string().optional(),
  // These fields are used for special actions, not actual profile data
  addOrganizationRelationship: organizationRelationshipSchema.optional(),
  navigateToManageOrgs: z.boolean().optional()
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
