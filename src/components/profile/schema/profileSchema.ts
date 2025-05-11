
import * as z from "zod";

// Define the organization relationship schema separately
export const organizationRelationshipSchema = z.object({
  organizationId: z.string(),
  connectionType: z.enum(["current", "former", "connected_insider"]),
  department: z.string().nullable(),
  notes: z.string().nullable()
});

// These are the fields that exist in the profiles table
export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  // Make URL fields more flexible - we'll handle the formatting when saving
  linkedin_url: z.string().optional().nullable(),
  twitter_url: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  
  // Special fields for UI actions only - not stored in profiles table
  // These are used for special actions, not actual profile data
  addOrganizationRelationship: organizationRelationshipSchema.optional(),
  navigateToManageOrgs: z.boolean().optional()
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
