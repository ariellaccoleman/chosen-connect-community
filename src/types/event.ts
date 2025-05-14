
import { Database } from "@/integrations/supabase/types";
import { LocationWithDetails } from "./location";
import { Profile } from "./profile";

// Type from DB
export type Event = Database["public"]["Tables"]["events"]["Row"];

// Event with extra information
export interface EventWithDetails extends Event {
  location?: LocationWithDetails | null;
  host?: Profile | null;
}

// Type for creating a new event
export interface CreateEventInput {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  location_id?: string | null;
  tag_id?: string | null;
  is_paid: boolean;
  price?: number | null;
}
