
import * as z from "zod";

// Export the schema and type from here to be used across event form components
export const createEventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Start date is required" }),
  start_time: z.string().min(1, { message: "Start time is required" }),
  duration_hours: z.number().min(0).default(1),
  duration_minutes: z.number().min(0).max(59).default(0),
  is_virtual: z.boolean().default(true),
  location_id: z.string().nullable().optional(),
  is_paid: z.boolean().default(false),
  price: z.number().nullable().optional(),
  // Remove tag_id field as we'll use EntityTagManager for tag management
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
