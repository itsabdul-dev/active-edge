import type { Database } from "./database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

let client: SupabaseClient<Database> | undefined;
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!isSupabaseConfigured)
    throw new Error("Customer accounts are not available yet. Please try again later.");
  if (typeof window === "undefined")
    throw new Error("Browser authentication is only available in the browser.");
  return (client ??= createBrowserClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false },
  }));
}
