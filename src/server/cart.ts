import { enforceRequestLimit } from "./rate-limit.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
import { cartIdentity } from "./cart-identity.server";
import type { CartLine } from "@/lib/cart-context";

const input = z.object({
  operation: z.enum(["load", "add", "set", "remove", "clear", "import"]),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  items: z
    .array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) }))
    .max(100)
    .optional(),
});
export const changeCart = createServerFn({ method: "POST" })
  .validator(input)
  .handler(async ({ data }) => {
    await enforceRequestLimit("cart");
    const identity = await cartIdentity();
    const client = getSupabaseAdmin();
    const { data: cart, error } = await client.rpc("manage_cart", {
      p_token_hash: identity.hash,
      p_customer_id: identity.customerId,
      p_operation: data.operation,
      ...(data.variantId ? { p_variant_id: data.variantId } : {}),
      ...(data.quantity !== undefined ? { p_quantity: data.quantity } : {}),
      p_import: data.items ?? [],
    });
    if (error) throw new Error("Your bag could not be updated. Please try again.");
    return (cart as { lines: CartLine[] }).lines.map((line) => ({
      ...line,
      image: line.image
        ? client.storage.from("product-images").getPublicUrl(line.image).data.publicUrl
        : "",
    }));
  });
