import { z } from "zod";
const part = z.string().max(500).optional();
const response = z.object({
  results: z
    .array(
      z.object({
        formatted: part,
        address_line1: part,
        street: part,
        housenumber: part,
        city: part,
        town: part,
        village: part,
        suburb: part,
        district: part,
        postcode: part,
        country_code: part,
      }),
    )
    .max(10),
});
export type AddressSuggestion = {
  label: string;
  address: string;
  city: string;
  suburb: string;
  postcode: string;
};
export function parseAddressSuggestions(value: unknown): AddressSuggestion[] {
  const parsed = response.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.results
    .filter((r) => r.country_code === "za" && (r.street || r.address_line1))
    .map((r) => ({
      label: r.formatted ?? r.address_line1 ?? r.street ?? "",
      address: r.street
        ? [r.housenumber, r.street].filter(Boolean).join(" ")
        : (r.address_line1 ?? ""),
      city: r.city ?? r.town ?? r.village ?? "",
      suburb: r.suburb ?? r.district ?? "",
      postcode: r.postcode ?? "",
    }))
    .slice(0, 5);
}
