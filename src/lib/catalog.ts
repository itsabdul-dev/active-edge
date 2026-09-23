import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { products as previewProducts, type Product } from "./products";
import { isSupabaseConfigured, supabaseUrl, supabasePublishableKey } from "./supabase/config";

const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL"];
export const loadCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    if (!isSupabaseConfigured) return previewProducts;
    const client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("product")
      .select("*, product_colour(*, product_image(*), product_variant(*))")
      .eq("is_active", true)
      .order("display_order");
    if (error) throw new Error("The collection could not be loaded. Please try again.");
    return (data ?? [])
      .map((p): Product => {
        const colours = (p.product_colour as ColourRow[]).sort(
          (a, b) => a.display_order - b.display_order,
        );
        const variants = colours
          .map((c) => ({
            name: c.colour_name,
            image: client.storage
              .from("product-images")
              .getPublicUrl(
                [...c.product_image].sort((a, b) => a.display_order - b.display_order)[0]
                  ?.storage_path ?? "",
              ).data.publicUrl,
            sizes: c.product_variant
              .filter((v) => v.is_active)
              .map((v) => ({
                id: v.variant_id,
                size: v.size_code,
                price: v.price_cents / 100,
                stock: v.stock_on_hand,
              })),
          }))
          .filter((c) => c.sizes.length > 0);
        return {
          slug: p.slug,
          name: p.name,
          tagline: p.subtitle,
          description: p.description,
          fabric: p.fabric_details,
          category: p.audience === "women" ? "Women" : p.audience === "men" ? "Men" : "Sets",
          isSet: p.is_set,
          featuredRank: p.featured_rank,
          price: Math.min(...variants.flatMap((v) => v.sizes.map((s) => s.price))),
          sizes: [...new Set(variants.flatMap((v) => v.sizes.map((s) => s.size)))].sort(
            (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b),
          ),
          imageFit: p.image_fit,
          variants,
        };
      })
      .filter((p) => p.variants.length > 0);
  },
);
type ColourRow = {
  colour_name: string;
  display_order: number;
  product_image: { storage_path: string; display_order: number }[];
  product_variant: {
    variant_id: string;
    size_code: string;
    price_cents: number;
    stock_on_hand: number;
    is_active: boolean;
  }[];
};
