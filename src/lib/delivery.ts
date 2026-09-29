import { z } from "zod";
const required = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(200, "Please shorten this field.");
export const deliverySchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  firstName: required("First name"),
  lastName: required("Last name"),
  address: required("Street address"),
  unit: z.string().trim().max(120, "Use 120 characters or fewer."),
  suburb: z.string().trim().max(200),
  city: required("City"),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a four-digit South African postal code."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]+$/, "Enter a valid phone number.")
    .refine((v) => {
      const n = v.replace(/\D/g, "").length;
      return n >= 9 && n <= 15;
    }, "Use a phone number with 9–15 digits."),
  deliveryInstructions: z.string().trim().max(500, "Use 500 characters or fewer."),
});
export type Delivery = z.infer<typeof deliverySchema>;
export const emptyDelivery: Delivery = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  unit: "",
  suburb: "",
  city: "",
  postcode: "",
  phone: "",
  deliveryInstructions: "",
};
export function readDeliveryDraft(value: string | null): Delivery {
  try {
    const raw: unknown = JSON.parse(value ?? "{}");
    if (!raw || typeof raw !== "object") return { ...emptyDelivery };
    return Object.fromEntries(
      Object.entries(emptyDelivery).map(([key, fallback]) => [
        key,
        typeof (raw as Record<string, unknown>)[key] === "string"
          ? String((raw as Record<string, unknown>)[key]).slice(0, 500)
          : fallback,
      ]),
    ) as Delivery;
  } catch {
    return { ...emptyDelivery };
  }
}
