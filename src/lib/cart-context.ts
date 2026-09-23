import { createContext, useContext } from "react";
import { z } from "zod";
export const cartLine = z.object({
  id: z.string(),
  variantId: z.string().uuid().optional(),
  slug: z.string(),
  name: z.string(),
  variant: z.string(),
  size: z.string(),
  price: z.number().nonnegative(),
  image: z.string(),
  qty: z.number().int().min(1).max(99),
});
export type CartLine = z.infer<typeof cartLine>;
export type CartContextValue = {
  lines: CartLine[];
  loading: boolean;
  updating: boolean;
  error: string;
  add: (line: Omit<CartLine, "id" | "qty">, qty?: number) => Promise<void>;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};
export const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider missing");
  return context;
}
