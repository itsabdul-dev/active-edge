import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase/server.server";

export async function cartIdentity() {
  let token = getCookie("ae-guest-cart");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    setCookie("ae-guest-cart", token, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  const {
    data: { user },
    error,
  } = await getSupabaseServer().auth.getUser();
  // A missing session is a guest. Other auth errors should never downgrade a
  // signed-in customer into a different cart silently.
  if (error && error.name !== "AuthSessionMissingError")
    throw new Error("Please sign in again to access your bag.");
  return { hash: createHash("sha256").update(token).digest("hex"), customerId: user?.id ?? null };
}
