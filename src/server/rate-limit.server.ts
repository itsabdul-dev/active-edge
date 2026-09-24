import { createHmac } from "node:crypto";
import { getRequestIP } from "@tanstack/react-start/server";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";

export async function enforceRequestLimit(scope: "cart" | "newsletter") {
  const secret = process.env["SUPABASE_SECRET_KEY"];
  if (!secret) throw new Error("Store connection is not configured.");
  // Vercel overwrites X-Forwarded-For. Other hosts must not trust client headers.
  const ip = getRequestIP({ xForwardedFor: process.env["VERCEL"] === "1" }) ?? "unknown";
  const key = createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
  const { data, error } = await getSupabaseAdmin().rpc("consume_request_limit", {
    p_key: key,
    p_limit: scope === "cart" ? 120 : 10,
    p_window_seconds: scope === "cart" ? 60 : 3600,
  });
  if (error) throw new Error("Please try again shortly.");
  if (!data) throw new Error("Too many requests. Please wait before trying again.");
}
