
export interface Location {
  id: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  full_name?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geoname_id?: number | null;
  formatted_location?: string; // Add this line to include formatted_location
}

export interface LocationWithDetails extends Location {
  full_region_path?: string | null;
  admin_code1?: string | null;
  admin_code2?: string | null;
  admin_name2?: string | null;
}
