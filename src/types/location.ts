
export interface Location {
  id: string;
  city: string;
  region: string;
  country: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  geoname_id?: number;
  admin_code1?: string;
  admin_code2?: string;
  admin_name2?: string;
  timezone?: string;
}

export interface LocationWithDetails extends Location {
  formatted_location: string;
}
