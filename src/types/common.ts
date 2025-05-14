
export interface SupabaseListResult<T> {
  data: T[] | null;
  error: any;
}

// Add a LocationFormattedData interface to extend the ProfileWithDetails type
export interface LocationFormattedData {
  formatted_location?: string;
}
