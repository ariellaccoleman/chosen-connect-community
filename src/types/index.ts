export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  headline: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  location_id: string | null;
  email: string | null;
  role: string | null;
};

export type Location = {
  id: string;
  city: string | null;
  region: string | null;
  country: string | null;
  full_name: string | null;
};

export type Organization = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  logo_api_url: string | null;
  website_url: string | null;
  location_id: string | null;
  created_at: string | null;
  is_verified: boolean | null;
};

export type OrganizationRelationship = {
  id: string;
  profile_id: string | null;
  organization_id: string | null;
  connection_type: 'current' | 'former' | 'ally' | null;
  department: string | null;
  notes: string | null;
  created_at: string | null;
};

export type LocationWithDetails = Location & {
  formatted_location?: string;
};

export type OrganizationWithLocation = Organization & {
  location?: LocationWithDetails | null;
};

export type OrganizationRelationshipWithDetails = OrganizationRelationship & {
  organization?: OrganizationWithLocation | null;
};

export type ProfileWithDetails = Profile & {
  location?: LocationWithDetails | null;
  full_name?: string;
  organizations?: OrganizationRelationshipWithDetails[];
};
