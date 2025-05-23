
/**
 * Connection types for organization relationships
 */
export type ConnectionType = "current" | "former" | "connected_insider";

/**
 * Profile-Organization relationship
 */
export interface ProfileOrganizationRelationship {
  id: string;
  profile_id: string;
  organization_id: string;
  connection_type: ConnectionType;
  department?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Profile-Organization relationship with additional details
 */
export interface ProfileOrganizationRelationshipWithDetails extends ProfileOrganizationRelationship {
  profile?: any;
  organization?: any;
}
