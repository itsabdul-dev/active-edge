import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email().max(254),
      website: z.string().max(200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    if (data.website) return { received: true };
    const { error } = await getSupabaseAdmin()
      .from("newsletter_subscriber")
      .upsert(
        { email: data.email.toLowerCase(), status: "pending" },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (error) throw new Error("We could not save your request. Please try again.");
    // Pending until a mailing provider sends and verifies double opt-in.
    return { received: true };
  });
