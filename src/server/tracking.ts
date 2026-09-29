import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cartIdentity } from "./cart-identity.server";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
import { enforceRequestLimit } from "./rate-limit.server";
export const trackOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await enforceRequestLimit("tracking");
    const identity = await cartIdentity();
    const client = getSupabaseAdmin();
    const { data: owner, error } = await client
      .from("sales_order")
      .select("customer_id,cart_id")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (error || !owner)
      throw new Error(
        "Order unavailable. Sign in with the account used at checkout, or use the original guest browser.",
      );
    let allowed = Boolean(identity.customerId && owner.customer_id === identity.customerId);
    if (!owner.customer_id && owner.cart_id) {
      const { data: cart } = await client
        .from("cart")
        .select("cart_id")
        .eq("cart_id", owner.cart_id)
        .is("customer_id", null)
        .eq("session_token_hash", identity.hash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      allowed = Boolean(cart);
    }
    if (!allowed)
      throw new Error(
        "Order unavailable. Sign in with the account used at checkout, or use the original guest browser.",
      );
    const result = await client
      .from("sales_order")
      .select(
        "order_id,order_number,is_demo,status,placed_at,total_cents,city_snapshot,order_item(product_name_snapshot,colour_snapshot,size_snapshot,quantity),shipment(courier,tracking_number,status),order_tracking_event(stage,message,created_at)",
      )
      .eq("order_id", data.orderId)
      .single();
    if (result.error) throw new Error("Tracking could not load. Please retry.");
    return result.data;
  });
