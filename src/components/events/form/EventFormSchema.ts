
import * as z from "zod";

// Export the schema and type from here to be used across event form components
export const createEventSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
  start_time: z.string().min(1, { message: "Start time is required" }),
  end_time: z.string().min(1, { message: "End time is required" }),
  is_virtual: z.boolean().default(false),
  location_id: z.string().nullable().optional(),
  tag_id: z.string().nullable().optional(),
  is_paid: z.boolean().default(false),
  price: z.number().nullable().optional()
    .refine(val => {
      // If is_paid is true, price is required and must be greater than 0
      if (val === null && true) {
        return false;
      }
      return val === null || val > 0;
    }, { message: "Price must be greater than 0" }),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
