import { CartContext, cartLine, type CartLine, type CartContextValue } from "./cart-context";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { useAuth } from "./auth-context";
import { isSupabaseConfigured } from "./supabase/config";
import { changeCart } from "@/server/cart";
import { loadCatalogue } from "./catalog";

const STORAGE_KEY = "ae-cart-v1";
function readPreviewCart(): CartLine[] {
  try {
    return z
      .array(cartLine)
      .max(100)
      .parse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const generation = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (authLoading) return;
    const version = ++generation.current;
    setLoading(true);
    setLines([]);
    setError("");
    const init = async () => {
      if (version !== generation.current) return;
      const local = readPreviewCart();
      if (!isSupabaseConfigured) {
        setLines(local);
        return;
      }
      let result: CartLine[];
      if (local.length) {
        const products = await loadCatalogue();
        const items = local.flatMap((line) => {
          const variant = products
            .find((p) => p.slug === line.slug)
            ?.variants.find((v) => v.name === line.variant)
            ?.sizes?.find((s) => s.size === line.size);
          return variant ? [{ variant_id: variant.id, quantity: line.qty }] : [];
        });
        if (version !== generation.current) return;
        result = await changeCart({ data: { operation: "import", items } });
        localStorage.removeItem(STORAGE_KEY);
      } else result = await changeCart({ data: { operation: "load" } });
      if (version === generation.current) setLines(result);
    };
    queue.current = queue.current
      .catch(() => {})
      .then(init)
      .catch(() => {
        if (version === generation.current)
          setError("Your bag could not be loaded. Refresh to try again.");
      })
      .finally(() => {
        if (version === generation.current) setLoading(false);
      });
    return () => {
      // This ref is an async-operation generation counter, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, [authLoading, user?.id]);
  useEffect(() => {
    if (!loading && !isSupabaseConfigured) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      } catch {
        /* browser storage unavailable */
      }
    }
  }, [lines, loading]);
  const mutate = useCallback((data: Parameters<typeof changeCart>[0]["data"]) => {
    const version = generation.current;
    setPending((n) => n + 1);
    const task = queue.current
      .catch(() => {})
      .then(async () => {
        if (version !== generation.current) return;
        setError("");
        try {
          const updated = await changeCart({ data });
          if (version === generation.current) setLines(updated);
        } catch (e) {
          if (version === generation.current)
            setError("Your bag could not be updated. Please try again.");
          throw e;
        }
      });
    const settled = task.finally(() => setPending((n) => n - 1));
    queue.current = settled;
    return settled;
  }, []);
  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      loading,
      updating: pending > 0,
      error,
      add: async (line, qty = 1) => {
        if (loading) throw new Error("Your bag is still loading. Please try again.");
        if (isSupabaseConfigured) {
          if (!line.variantId) throw new Error("Please refresh this product before adding it.");
          await mutate({ operation: "add", variantId: line.variantId, quantity: qty });
        } else
          setLines((prev) => {
            const id = `${line.slug}-${line.variant}-${line.size}`;
            return prev.some((l) => l.id === id)
              ? prev.map((l) => (l.id === id ? { ...l, qty: Math.min(99, l.qty + qty) } : l))
              : [...prev, { ...line, id, qty }];
          });
      },
      remove: (id) => {
        if (isSupabaseConfigured)
          void mutate({ operation: "remove", variantId: id }).catch(() => {});
        else setLines((prev) => prev.filter((l) => l.id !== id));
      },
      setQty: (id, qty) => {
        if (isSupabaseConfigured)
          void mutate(
            qty <= 0
              ? { operation: "remove", variantId: id }
              : { operation: "set", variantId: id, quantity: qty },
          ).catch(() => {});
        else
          setLines((prev) =>
            qty <= 0
              ? prev.filter((l) => l.id !== id)
              : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(99, qty) } : l)),
          );
      },
      clear: () => {
        if (isSupabaseConfigured) void mutate({ operation: "clear" }).catch(() => {});
        else setLines([]);
      },
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
    }),
    [lines, loading, pending, error, mutate],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
