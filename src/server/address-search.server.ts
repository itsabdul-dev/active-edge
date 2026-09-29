import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
import { parseAddressSuggestions, type AddressSuggestion } from "@/lib/address-suggestions";
import { enforceRequestLimit } from "./rate-limit.server";
export async function searchAddresses(
  query: string,
): Promise<{ suggestions: AddressSuggestion[]; unavailable: boolean }> {
  const key = process.env["GEOAPIFY_API_KEY"];
  if (!key) return { suggestions: [], unavailable: true };
  try {
    await enforceRequestLimit("address");
    // Leave headroom in the free provider quota for dashboard/manual usage.
    const { data: allowed, error } = await getSupabaseAdmin().rpc("consume_request_limit", {
      p_key: createHash("sha256").update("geoapify-address-daily-budget").digest("hex"),
      p_limit: 2400,
      p_window_seconds: 86400,
    });
    if (error || !allowed) return { suggestions: [], unavailable: true };
    const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    url.search = new URLSearchParams({
      text: query,
      filter: "countrycode:za",
      lang: "en",
      format: "json",
      limit: "5",
      apiKey: key,
    }).toString();
    const result = await fetch(url, { signal: AbortSignal.timeout(4500), cache: "no-store" });
    if (!result.ok) return { suggestions: [], unavailable: true };
    return { suggestions: parseAddressSuggestions(await result.json()), unavailable: false };
  } catch {
    return { suggestions: [], unavailable: true };
  }
}
