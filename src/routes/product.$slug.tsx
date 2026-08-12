import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Leaf, Truck, RotateCcw } from "lucide-react";
import { formatZar, getProduct, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product unavailable | ActiveEdge" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — ${formatZar(product.price)} | ActiveEdge`;
    return {
      meta: [
        { title },
        { name: "description", content: product.tagline + " " + product.fabric },
        { property: "og:title", content: title },
        { property: "og:description", content: product.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            brand: { "@type": "Brand", name: "ActiveEdge" },
            color: product.variants.map((v) => v.name).join(", "),
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "ZAR",
              availability: "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { add } = useCart();
  const [variant, setVariant] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const current = product.variants[variant]!;
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  const addToBag = () => {
    if (!size) {
      toast.error("Choose a size first");
      return;
    }
    add(
      {
        slug: product.slug,
        name: product.name,
        variant: current.name,
        size,
        price: product.price,
        image: current.image,
      },
      qty,
    );
    toast.success(`${product.name} (${current.name}, ${size}) added to your bag`);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-md bg-sand">
            <img
              src={current.image}
              alt={`${product.name} in ${current.name}`}
              className={
                "aspect-[4/5] w-full " +
                (product.imageFit === "contain" ? "object-contain p-4" : "object-cover")
              }
            />
          </div>
          <div className="mt-3 flex gap-3">
            {product.variants.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setVariant(i)}
                aria-label={v.name}
                className={
                  "w-20 overflow-hidden rounded-sm border-2 transition-colors " +
                  (i === variant ? "border-primary" : "border-transparent opacity-70")
                }
              >
                <img
                  src={v.image}
                  alt={v.name}
                  className={
                    "aspect-[4/5] w-full " +
                    (product.imageFit === "contain" ? "object-contain p-1" : "object-cover")
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit lg:pt-4">
          <p className="eyebrow text-clay">{product.category}</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-lg">{formatZar(product.price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Or 4 × {formatZar(Math.round(product.price / 4))} interest-free with Payflex · incl. VAT
          </p>
          <p className="mt-4 text-muted-foreground">{product.description}</p>

          <div className="mt-8">
            <p className="eyebrow text-muted-foreground">Colour — {current.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((v, i) => (
                <button
                  key={v.name}
                  onClick={() => setVariant(i)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm " +
                    (i === variant
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40")
                  }
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-muted-foreground">Size</p>
              <Link
                to="/faq"
                hash="size-guide"
                className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Size guide
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={
                    "min-w-12 rounded-sm border px-3 py-2 text-sm " +
                    (size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <div className="flex items-center gap-4 border border-border px-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={addToBag}
              className="flex-1 rounded-sm bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              Add to bag · {formatZar(product.price * qty)}
            </button>
          </div>

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Leaf className="mt-0.5 size-4 shrink-0 text-clay" />
              <span>{product.fabric}</span>
            </div>
            <div className="flex gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-clay" />
              <span>Free courier on orders over R900 · 2–4 working days countrywide</span>
            </div>
            <div className="flex gap-3">
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-clay" />
              <span>30-day returns and a two-year seam guarantee</span>
            </div>
            <div className="flex gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-clay" />
              <span>Plastic-free packaging, carbon-offset delivery</span>
            </div>
          </dl>
        </div>
      </div>

      <section className="mt-24">
        <h2 className="text-2xl">Wear it with</h2>
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
