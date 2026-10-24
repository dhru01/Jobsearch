import type { SupabaseClient } from "@supabase/supabase-js";
import { filterLocationSuggestions } from "@/lib/jobs/location-suggestions";

export type LocationSuggestion = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  latitude?: number | null;
  longitude?: number | null;
};
import { provinceNameFromCode } from "@/lib/jobs/sa-province-codes";

export const GEONAMES_LOCATIONS_TABLE = "SA_Locations";

/** Format GeoNames admin names for display (district municipalities, etc.). */
export function formatPlaceName(name: string): string {
  return name
    .replace(/\s+District Municipality$/i, "")
    .replace(/\s+Metropolitan Municipality$/i, "")
    .replace(/^City of /i, "")
    .trim();
}

const PLACE_FEATURE_CODES = new Set([
  "PPL",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPLC",
  "PPLX",
  "PPLG",
]);

type GeonameRow = {
  geoname_id: number;
  name: string;
  province_code: number | null;
  population: number | null;
  feature_code: string | null;
  alternate_names: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function sanitizeQuery(query: string): string {
  return query.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function rowToSuggestion(row: GeonameRow): LocationSuggestion {
  const primary = row.name.trim();
  const secondary = provinceNameFromCode(row.province_code);
  const label = secondary ? `${primary}, ${secondary}` : primary;
  return {
    id: String(row.geoname_id),
    label,
    primary,
    secondary,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}

function rankRows(rows: GeonameRow[], query: string): GeonameRow[] {
  const needle = query.toLowerCase();
  const scored = rows.map((row) => {
    const name = row.name.toLowerCase();
    let score = 0;
    if (name === needle) score = 120;
    else if (name.startsWith(needle)) score = 100;
    else if (name.includes(needle)) score = 70;
    else if (row.alternate_names?.toLowerCase().includes(needle)) score = 40;

    const feature = row.feature_code ?? "";
    if (feature === "PPLA" || feature === "PPLC") score += 8;
    else if (PLACE_FEATURE_CODES.has(feature)) score += 4;

    const population = row.population ?? 0;
    score += Math.min(10, Math.log10(population + 1));

    return { row, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || (b.row.population ?? 0) - (a.row.population ?? 0))
    .map((entry) => entry.row);
}

function staticFallback(query: string, limit: number): LocationSuggestion[] {
  return filterLocationSuggestions(query, limit).map((label) => {
    const [primary, secondary] = label.split(",").map((part) => part.trim());
    return {
      id: `static:${label}`,
      label,
      primary: primary ?? label,
      secondary: secondary ?? "",
    };
  });
}

export async function suggestLocationsFromGeonames(
  admin: SupabaseClient,
  query: string,
  limit = 10,
): Promise<LocationSuggestion[]> {
  const trimmed = sanitizeQuery(query);
  const cap = Math.min(Math.max(limit, 1), 15);

  let builder = admin
    .from(GEONAMES_LOCATIONS_TABLE)
    .select("geoname_id, name, province_code, population, feature_code, alternate_names, latitude, longitude")
    .eq("country_code", "ZA");

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    builder = builder.or(`name.ilike.${pattern},alternate_names.ilike.${pattern}`);
  } else {
    builder = builder.in("feature_code", [...PLACE_FEATURE_CODES]);
  }

  const { data, error } = await builder.order("population", { ascending: false }).limit(cap * 3);

  if (error) {
    console.error("[geonames] location suggest query failed", error.message);
    return staticFallback(trimmed, cap);
  }

  const rows = (data ?? []) as GeonameRow[];
  const filtered = trimmed
    ? rows
    : rows.filter((row) => PLACE_FEATURE_CODES.has(row.feature_code ?? ""));

  const ranked = rankRows(filtered, trimmed).slice(0, cap);
  if (ranked.length === 0) return staticFallback(trimmed, cap);

  const seen = new Set<string>();
  const out: LocationSuggestion[] = [];
  for (const row of ranked) {
    const suggestion = rowToSuggestion(row);
    const key = suggestion.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(suggestion);
  }
  return out;
}
