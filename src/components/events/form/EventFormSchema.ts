
import * as z from "zod";

// Export the schema and type from here to be used across event form components
export const createEventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  durationHours: z.number().min(0).default(1),
  durationMinutes: z.number().min(0).max(59).default(0),
  isOnline: z.boolean().default(true),
  locationId: z.string().nullable().optional(),
  isPaid: z.boolean().default(false),
  price: z.number().nullable().optional(),
  // Remove tag_id field as we'll use EntityTagManager for tag management
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
