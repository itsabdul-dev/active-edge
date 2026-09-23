import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cartIdentity } from "./cart-identity.server";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
const text = z.string().trim().min(1).max(200);
export const createPendingOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cartId: z.string().uuid(),
      address: z.object({
        email: z.string().email().max(254),
        first_name: text,
        last_name: text,
        phone: text,
        street: text,
        suburb: z.string().trim().max(200),
        city: text,
        postal_code: z.string().regex(/^\d{4}$/),
      }),
    }),
  )
  .handler(async ({ data }) => {
    // Release only together with a real payment integration and verified webhook.
    if (process.env["CHECKOUT_ENABLED"] !== "true")
      throw new Error("Online payment is not available yet. No order has been placed.");
    const identity = await cartIdentity();
    const { data: id, error } = await getSupabaseAdmin().rpc("create_pending_order", {
      p_cart_id: data.cartId,
      p_token_hash: identity.hash,
      p_customer_id: identity.customerId,
      p_address: data.address,
    });
    if (error)
      throw new Error("We could not reserve these items. Check availability and try again.");
    return { orderId: id as string };
  });
