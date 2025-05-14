
// Re-export all types from their respective files
export * from './location';
export * from './profile';
export * from './organization';
export * from './common';
export * from './event';
export * from './entity';
export * from './entityTypes';

/**
 * Organization form values used in create/edit forms
 */
export interface OrganizationFormValues {
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
}

/**
 * Tag assignment with detailed tag information
 */
export interface TagAssignmentWithDetails {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at: string;
  updated_at: string;
  tag?: {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
  };
}
