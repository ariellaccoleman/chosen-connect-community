
import { Database } from "@/integrations/supabase/types";
import { LocationWithDetails } from "./location";
import { Profile } from "./profile";
import { TagAssignment } from "@/utils/tags/types";

// Type from DB
export type Event = Database["public"]["Tables"]["events"]["Row"];

// Event with extra information
export interface EventWithDetails extends Event {
  location?: LocationWithDetails | null;
  host?: Profile | null;
  tags?: TagAssignment[]; // Add tags property
}

// Type for creating a new event
export interface CreateEventInput {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  location_id: string | null;
  is_paid: boolean;
  price: number | null;
  // Remove tag_id as we'll use tag assignments directly
}
