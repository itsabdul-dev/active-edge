import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { catalogue } from "./catalogue-source.mjs";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Load .env.local with the project URL and server-only key.");
if (new URL(url).hostname !== "mfzpfhwzyxrajzdjpsby.supabase.co")
  throw new Error("This importer targets the approved ActiveEdge project only.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const featured = ["apex-training-hoodie", "womens-motion-set", "performance-tee", "motion-shorts"];
const colours = {
  "Charcoal Black": "#1b1b1b",
  "Onyx Black": "#141414",
  "Field Olive": "#5d6a43",
  "Stone Grey": "#9aa0a3",
  "Powder Blue": "#a9c8e6",
  "Rose Clay": "#c2725c",
  "Indigo Navy": "#243352",
  "Chalk White": "#f1efe9",
  "Fynbos Green": "#4b6b4a",
  "Deep Sea": "#28455f",
  "Desert Sand": "#c8ac8b",
  Cream: "#eee6d8",
  "Slate Blue": "#5c6f82",
};
const check = (result) => {
  if (result.error) throw result.error;
  return result.data;
};
let images = 0,
  variants = 0;
for (const [i, p] of catalogue.entries()) {
  const rank = featured.indexOf(p.slug);
  const product = check(
    await client
      .from("product")
      .upsert(
        {
          slug: p.slug,
          name: p.name,
          subtitle: p.tagline,
          description: p.description,
          fabric_details: p.fabric,
          audience: p.category === "Women" ? "women" : "men",
          is_set: p.slug.includes("set"),
          featured_rank: rank < 0 ? null : rank,
          display_order: i,
          image_fit: p.imageFit ?? "cover",
          is_active: true,
        },
        { onConflict: "slug" },
      )
      .select("product_id")
      .single(),
  );
  for (const [j, v] of p.variants.entries()) {
    const colour = check(
      await client
        .from("product_colour")
        .upsert(
          {
            product_id: product.product_id,
            colour_name: v.name,
            hex_code: colours[v.name],
            display_order: j,
          },
          { onConflict: "product_id,colour_name" },
        )
        .select("product_colour_id")
        .single(),
    );
    const file = await readFile(new URL(`../src/assets/${v.image}`, import.meta.url));
    const ext = path.extname(v.image).toLowerCase();
    const storagePath = `${p.slug}/${v.name.toLowerCase().replaceAll(" ", "-")}-${createHash("sha256").update(file).digest("hex").slice(0, 12)}${ext}`;
    check(
      await client.storage
        .from("product-images")
        .upload(storagePath, file, {
          upsert: true,
          contentType: ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg",
          cacheControl: "31536000",
        }),
    );
    // Replace this colour's lead image reference without accumulating duplicates.
    const previous = check(
      await client
        .from("product_image")
        .select("image_id")
        .eq("product_colour_id", colour.product_colour_id)
        .eq("display_order", 0)
        .maybeSingle(),
    );
    const imageData = {
      product_colour_id: colour.product_colour_id,
      storage_path: storagePath,
      alt_text: `${p.name} in ${v.name}`,
      display_order: 0,
    };
    check(
      previous
        ? await client.from("product_image").update(imageData).eq("image_id", previous.image_id)
        : await client.from("product_image").insert(imageData),
    );
    images++;
    for (const size of p.sizes) {
      // Never overwrite live stock on re-import. New SKUs default to zero.
      check(
        await client
          .from("product_variant")
          .upsert(
            {
              product_colour_id: colour.product_colour_id,
              sku: `${p.slug}-${j + 1}-${size}`.toUpperCase(),
              size_code: size,
              price_cents: Math.round(p.price * 100),
              is_active: true,
            },
            { onConflict: "product_colour_id,size_code" },
          ),
      );
      variants++;
    }
  }
  console.log(`Imported ${p.name}`);
}
console.log(
  `Catalogue complete: ${catalogue.length} products, ${images} images, ${variants} size/colour variants. New inventory remains zero.`,
);
