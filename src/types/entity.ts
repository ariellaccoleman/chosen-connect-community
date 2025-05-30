
import { EntityType } from "./entityTypes";
import { TagAssignment } from "@/utils/tags/types";
import { Location } from "./location";

/** 
 * Generic Entity interface that represents any entity in the system
 * This could be a person, organization, event, etc.
 */
export interface Entity {
  /**
   * Unique identifier for the entity
   */
  id: string;
  
  /**
   * The type of entity
   */
  entityType: EntityType;
  
  /**
   * Name of the entity
   */
  name: string;
  
  /**
   * Brief description or headline for the entity
   */
  description?: string;
  
  /**
   * URL to the entity's image, if available
   */
  imageUrl?: string;
  
  /**
   * Location information for the entity
   */
  location?: Location;
  
  /**
   * Website or external URL for the entity
   */
  url?: string;
  
  /**
   * Creation timestamp
   */
  created_at?: string;
  
  /**
   * Last updated timestamp
   */
  updated_at?: string;
  
  /**
   * Tags associated with this entity
   */
  tags?: TagAssignment[];
}

/**
 * Base interface for entity creation data
 */
export interface EntityCreateInput {
  name: string;
  description?: string;
  imageUrl?: string;
  location_id?: string | null;
  url?: string;
}

/**
 * Base interface for entity update data
 */
export interface EntityUpdateInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  location_id?: string | null;
  url?: string;
}
