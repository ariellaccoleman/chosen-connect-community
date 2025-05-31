
import { Database } from "@/integrations/supabase/types";
import { LocationWithDetails } from "./location";
import { Profile } from "./profile";
import { Tag } from "@/utils/tags/types";
import { Entity } from "./entity";
import { EntityType } from "./entityTypes";

// Type from DB
export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  entityType: EntityType.EVENT;
  name: string; // Map to title for Entity compatibility
};

// Event with extra information
export interface EventWithDetails extends Entity {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  location_id: string | null;
  is_paid: boolean;
  price: number | null;
  host_id: string | null;
  tag_id: string | null; // Added missing required property
  created_at: string;
  updated_at: string;
  location?: LocationWithDetails | null;
  host?: Profile | null;
  tags?: Tag[];
  entityType: EntityType.EVENT;
  name: string; // Map to title for Entity compatibility
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

// Event registration type
export type EventRegistration = {
  id: string;
  event_id: string;
  profile_id: string;
  created_at: string;
  profile?: Profile; // Add optional profile field for joined data
};

// Registration status for the current user
export type RegistrationStatus = 'registered' | 'not_registered' | 'loading';
