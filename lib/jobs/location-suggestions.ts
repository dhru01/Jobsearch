/** Common search locations for South African job boards (substring match on scraped listings). */
export const JOB_SEARCH_LOCATION_SUGGESTIONS = [
  "South Africa",
  "Gauteng",
  "Johannesburg",
  "Pretoria",
  "Sandton",
  "Midrand",
  "Western Cape",
  "Cape Town",
  "Stellenbosch",
  "Paarl",
  "KwaZulu-Natal",
  "Durban",
  "Pietermaritzburg",
  "Eastern Cape",
  "Gqeberha",
  "East London",
  "Free State",
  "Bloemfontein",
  "Limpopo",
  "Polokwane",
  "Mpumalanga",
  "Mbombela",
  "North West",
  "Rustenburg",
  "Northern Cape",
  "Kimberley",
] as const;

export function filterLocationSuggestions(
  query: string,
  limit = 8,
): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...JOB_SEARCH_LOCATION_SUGGESTIONS].slice(0, limit);
  }

  const ranked = JOB_SEARCH_LOCATION_SUGGESTIONS
    .map((label) => {
      const hay = label.toLowerCase();
      let score = 0;
      if (hay === needle) score = 100;
      else if (hay.startsWith(needle)) score = 80;
      else if (hay.includes(needle)) score = 50;
      else return null;
      return { label, score };
    })
    .filter((row): row is { label: string; score: number } => row !== null)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  return ranked.slice(0, limit).map((row) => row.label);
}
