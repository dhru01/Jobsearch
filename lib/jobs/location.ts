const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

const CITY_ALIASES: Record<string, { city: string; province: string }> = {
  jhb: { city: "Johannesburg", province: "Gauteng" },
  joburg: { city: "Johannesburg", province: "Gauteng" },
  johannesburg: { city: "Johannesburg", province: "Gauteng" },
  "cape town": { city: "Cape Town", province: "Western Cape" },
  ct: { city: "Cape Town", province: "Western Cape" },
  durban: { city: "Durban", province: "KwaZulu-Natal" },
  pta: { city: "Pretoria", province: "Gauteng" },
  pretoria: { city: "Pretoria", province: "Gauteng" },
  stellenbosch: { city: "Stellenbosch", province: "Western Cape" },
  gqeberha: { city: "Gqeberha", province: "Eastern Cape" },
  "port elizabeth": { city: "Gqeberha", province: "Eastern Cape" },
  centurion: { city: "Centurion", province: "Gauteng" },
  sandton: { city: "Sandton", province: "Gauteng" },
};

function cleanPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSouthAfricanLocation(locationText: string) {
  const raw = cleanPart(locationText);
  const lower = raw.toLowerCase();

  if (!raw || /\bremote\b/i.test(raw) || /south africa.*remote/i.test(raw) || /work from home/i.test(raw)) {
    return {
      location: raw || "Remote — South Africa",
      city: "Remote",
      province: null as string | null,
    };
  }

  for (const province of PROVINCES) {
    if (lower.includes(province.toLowerCase())) {
      const before = raw.split(",")[0]?.trim() || raw;
      const alias = CITY_ALIASES[before.toLowerCase()];
      const city = alias?.city ?? before;
      return {
        location: `${city}, ${province}`,
        city,
        province,
      };
    }
  }

  const alias = CITY_ALIASES[lower] ?? CITY_ALIASES[lower.split(",")[0]?.trim() ?? ""];
  if (alias) {
    return {
      location: `${alias.city}, ${alias.province}`,
      city: alias.city,
      province: alias.province,
    };
  }

  if (/\bsouth africa\b/i.test(raw) || /\bza\b/i.test(raw)) {
    return { location: raw, city: cleanPart(raw.split(",")[0] || raw), province: null };
  }

  return { location: raw, city: cleanPart(raw.split(",")[0] || raw), province: null };
}

export function isSouthAfricanListing(locationText: string, description: string) {
  const blob = `${locationText} ${description}`.toLowerCase();
  if (/\bsouth africa\b/.test(blob) || /\brepublic of south africa\b/.test(blob)) return true;
  if (/\bremote\b/.test(blob) && (/\bsouth africa\b/.test(blob) || /\bza\b/.test(blob))) return true;
  if (PROVINCES.some((p) => blob.includes(p.toLowerCase()))) return true;
  return Object.keys(CITY_ALIASES).some((key) => blob.includes(key));
}
