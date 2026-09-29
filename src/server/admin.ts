import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminIdentity, requireAdmin } from "./admin-access.server";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
export const adminAccess = createServerFn({ method: "GET" }).handler(async () =>
  Boolean(await adminIdentity()),
);
export const adminOrders = createServerFn({ method: "POST" })
  .validator(z.object({ page: z.number().int().min(0).max(10000) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const result = await getSupabaseAdmin()
      .from("sales_order")
      .select(
        "order_id,order_number,is_demo,status,placed_at,total_cents,first_name_snapshot,last_name_snapshot,email_snapshot,phone_snapshot,street_snapshot,unit_snapshot,suburb_snapshot,city_snapshot,postal_code_snapshot,delivery_instructions_snapshot,order_item(product_name_snapshot,colour_snapshot,size_snapshot,quantity),shipment(courier,tracking_number,status),order_tracking_event(stage,message,created_at)",
        { count: "exact" },
      )
      .order("placed_at", { ascending: false })
      .range(data.page * 25, data.page * 25 + 24);
    if (result.error) throw new Error("Orders could not load. Please retry.");
    return { orders: result.data, total: result.count ?? 0 };
  });
export const advanceOrder = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        orderId: z.string().uuid(),
        expected: z.enum(["paid", "processing", "shipped", "out_for_delivery"]),
        stage: z.enum(["processing", "shipped", "out_for_delivery", "delivered"]),
        tracking: z.string().trim().max(100),
        courier: z.string().trim().max(100),
        message: z.string().trim().min(1).max(300),
      })
      .strict(),
  )
  .handler(async ({ data }) => {
    const actor = await requireAdmin();
    const { error } = await getSupabaseAdmin().rpc("admin_advance_order", {
      p_actor: actor,
      p_order_id: data.orderId,
      p_expected_stage: data.expected,
      p_stage: data.stage,
      p_tracking: data.tracking,
      p_courier: data.courier,
      p_message: data.message,
    });
    if (error)
      throw new Error(
        "Update failed. Refresh the order and check its stage, courier and tracking number.",
      );
    return { success: true };
  });
export const adminInventory = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin()
    .from("product_variant")
    .select("variant_id,sku,size_code,stock_on_hand,product_colour(colour_name,product(name))")
    .order("sku")
    .limit(1000);
  if (error) throw new Error("Inventory could not load.");
  return data;
});
export const setStock = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        variantId: z.string().uuid(),
        expected: z.number().int().nonnegative(),
        quantity: z.number().int().min(0).max(100000),
      })
      .strict(),
  )
  .handler(async ({ data }) => {
    const actor = await requireAdmin();
    const { error } = await getSupabaseAdmin().rpc("admin_set_stock", {
      p_actor: actor,
      p_variant_id: data.variantId,
      p_expected: data.expected,
      p_quantity: data.quantity,
    });
    if (error) throw new Error("Stock changed or units are reserved. Refresh before trying again.");
    return { success: true };
  });
