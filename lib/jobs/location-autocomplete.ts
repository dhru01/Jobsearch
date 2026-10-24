import { createAdminClient } from "@/lib/supabase/admin";
import {
  suggestLocationsFromGeonames,
  type LocationSuggestion,
} from "@/lib/jobs/geonames-locations";

export type { LocationSuggestion };

/** South African place suggestions from the `SA_Locations` GeoNames table in Supabase. */
export async function suggestLocations(query: string, limit = 10): Promise<LocationSuggestion[]> {
  const admin = createAdminClient();
  return suggestLocationsFromGeonames(admin, query, limit);
}
