import type { Database } from "./database";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

export function getSupabaseServer() {
  if (!isSupabaseConfigured) throw new Error("Store connection is not configured.");
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) => setCookie(name, value, options)),
    },
  });
}
export function getSupabaseAdmin() {
  const key = process.env["SUPABASE_SECRET_KEY"];
  if (!key || !supabaseUrl) throw new Error("Store checkout is not available yet.");
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
