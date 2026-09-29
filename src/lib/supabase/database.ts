import type { Database as GeneratedDatabase } from "./database.types";

// PostgreSQL function arguments are nullable unless validated in the function.
// The generator cannot infer that these service-only RPCs accept guests.
type GeneratedFunctions = GeneratedDatabase["public"]["Functions"];
type GuestFunction<T extends { Args: { p_customer_id: string } }> = Omit<T, "Args"> & {
  Args: Omit<T["Args"], "p_customer_id"> & { p_customer_id: string | null };
};
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Functions"> & {
    Functions: Omit<
      GeneratedFunctions,
      "manage_cart" | "create_pending_order" | "simulate_payment" | "get_demo_payment"
    > & {
      get_demo_payment: GuestFunction<GeneratedFunctions["get_demo_payment"]>;
      simulate_payment: GuestFunction<GeneratedFunctions["simulate_payment"]>;
      manage_cart: GuestFunction<GeneratedFunctions["manage_cart"]>;
      create_pending_order: GuestFunction<GeneratedFunctions["create_pending_order"]>;
    };
  };
};
