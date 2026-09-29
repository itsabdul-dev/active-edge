import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cartIdentity } from "./cart-identity.server";
import { enforceRequestLimit } from "./rate-limit.server";
import { getSupabaseAdmin } from "@/lib/supabase/server.server";
const text = z.string().trim().min(1).max(200);
export const demoResult = z.object({
  status: z.enum(["approved", "declined", "insufficient_funds", "cancelled"]),
  reference: z.string(),
  totalCents: z.number().int(),
  method: z.string(),
  brand: z.string(),
  lastFour: z.string(),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
});
export type DemoResult = z.infer<typeof demoResult>;
export const payDemo = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        attemptId: z.string().uuid(),
        outcome: z.enum(["approved", "declined", "insufficient_funds", "cancelled"]),
        method: z.enum(["card", "apple_pay_demo", "google_pay_demo"]),
        brand: z.enum(["Visa", "Mastercard"]),
        lastFour: z.string().regex(/^\d{4}$/),
        expectedTotal: z.number().int().positive(),
        address: z
          .object({
            email: z.string().email().max(254),
            first_name: text,
            last_name: text,
            phone: text,
            street: text,
            unit: z.string().trim().max(120).default(""),
            delivery_instructions: z.string().trim().max(500).default(""),
            suburb: z.string().max(200),
            city: text,
            postal_code: z.string().regex(/^\d{4}$/),
          })
          .strict(),
      })
      .strict(),
  )
  .handler(async ({ data }) => {
    if (process.env["CHECKOUT_ENABLED"] === "true")
      throw new Error("Demo payments are disabled during live checkout.");
    await enforceRequestLimit("payment");
    const identity = await cartIdentity();
    const { data: result, error } = await getSupabaseAdmin().rpc("simulate_payment", {
      p_attempt_id: data.attemptId,
      p_token_hash: identity.hash,
      p_customer_id: identity.customerId,
      p_address: data.address,
      p_outcome: data.outcome,
      p_method: data.method,
      p_brand: data.brand,
      p_last_four: data.lastFour,
      p_expected_total: data.expectedTotal,
    });
    if (error)
      throw new Error(
        "Demo payment could not complete. Check stock and prices in your bag, then retry. No real money was charged.",
      );
    return demoResult.parse(result);
  });

export const recoverDemoPayment = createServerFn({ method: "POST" })
  .validator(z.object({ attemptId: z.string().uuid() }).strict())
  .handler(async ({ data }) => {
    const identity = await cartIdentity();
    const { data: result, error } = await getSupabaseAdmin().rpc("get_demo_payment", {
      p_attempt_id: data.attemptId,
      p_token_hash: identity.hash,
      p_customer_id: identity.customerId,
    });
    if (error) throw new Error("Could not recover the payment. Refresh to try again.");
    return result ? demoResult.parse(result) : null;
  });
