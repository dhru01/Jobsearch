/** GeoNames admin1 numeric codes as stored on `SA_Locations.province_code`. */
export const SA_PROVINCE_BY_GEONAMES_CODE: Record<number, string> = {
  2: "KwaZulu-Natal",
  3: "Free State",
  5: "Eastern Cape",
  6: "Gauteng",
  7: "Mpumalanga",
  8: "Northern Cape",
  9: "Limpopo",
  10: "North West",
  11: "Western Cape",
};

export function provinceNameFromCode(code: number | null | undefined): string {
  if (code == null) return "";
  return SA_PROVINCE_BY_GEONAMES_CODE[code] ?? "";
}
