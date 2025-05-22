
import { Database } from "@/integrations/supabase/types";
import { LocationWithDetails } from "./location";
import { Profile } from "./profile";
import { TagAssignment } from "@/utils/tags/types";
import { Entity } from "./entity";
import { EntityType } from "./entityTypes";

// Updated Event type to match Entity interface
export interface Event extends Entity {
  id: string;
  entityType: EntityType.EVENT;
  name: string; // Using title as name to satisfy the Entity interface
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  locationId: string | null;
  address: string;
  isOnline: boolean;
  meetingLink: string;
  creatorId: string;
  isPaid: boolean;
  price: number;
  currency: string;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Original Event type from DB
export type EventDb = Database["public"]["Tables"]["events"]["Row"];

// Event with extra information
export interface EventWithDetails extends Event {
  location?: LocationWithDetails | null;
  host?: Profile | null;
  tags?: TagAssignment[];
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
}

// Event registration type
export type EventRegistration = {
  id: string;
  event_id: string;
  profile_id: string;
  created_at: string;
  profile?: Profile;
};

// Registration status for the current user
export type RegistrationStatus = 'registered' | 'not_registered' | 'loading';
