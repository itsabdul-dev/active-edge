import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { formatZar, products, type Product } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Eco Activewear | ActiveEdge South Africa" },
      {
        name: "description",
        content:
          "Shop recycled-fabric training tees, joggers, bras, shorts and performance sets. Made in Cape Town, delivered across South Africa.",
      },
      { property: "og:title", content: "Shop Eco Activewear | ActiveEdge" },
      {
        property: "og:description",
        content: "Recycled-fabric activewear for men and women, made in Cape Town.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

const filters = ["All", "Men", "Women", "Sets"] as const;
type Filter = (typeof filters)[number];

const sorts = ["Featured", "Price low", "Price high"] as const;
type Sort = (typeof sorts)[number];

const swatchTone: Record<string, string> = {
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

function ShopPage() {
  const [active, setActive] = useState<Filter>("All");
  const [sort, setSort] = useState<Sort>("Featured");

  const visible = useMemo(() => {
    const list = active === "All" ? products : products.filter((p) => p.category === active);
    if (sort === "Price low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price high") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [active, sort]);

  return (
    <div>
      {/* Editorial masthead */}
      <section className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-16 lg:pb-20 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow opacity-60">The full range — {products.length} pieces</p>
              <h1 className="mt-5 font-display text-[15vw] uppercase leading-[0.82] tracking-tight sm:text-[11vw] lg:text-[7.5vw]">
                <span className="block">Kit that</span>
                <span className="block italic opacity-50">earns its place</span>
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-4">
              <p className="max-w-sm text-sm leading-relaxed opacity-70">
                No seasonal churn, no filler. Every piece is cut from recycled or organic fibre,
                sewn in Woodstock and shipped plastic-free anywhere in South Africa.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-primary-foreground/20 pt-6 text-xs uppercase tracking-[0.18em] opacity-70">
                <span>Free delivery over R750</span>
                <span>2-year repair promise</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden border-t border-primary-foreground/15 py-3">
          <div className="marquee-track whitespace-nowrap font-display text-xs uppercase tracking-[0.4em] opacity-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="px-6">
                Built for every edge — Made in Cape Town —
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky control bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={
                  "px-4 py-2 font-display text-xs uppercase tracking-[0.2em] transition-colors " +
                  (active === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
              {visible.length} items
            </span>
            <div className="flex gap-1">
              {sorts.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={
                    "border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors " +
                    (sort === s
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:py-16">
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <ShopTile key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Closing block */}
      <section className="border-t border-border bg-sand">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow text-clay">Not sure on sizing?</p>
            <h2 className="mt-4 font-display text-3xl uppercase leading-[1.05] tracking-tight sm:text-4xl">
              Order two sizes. Send one back, free.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Link to="/about" className="btn-solid !px-8 !py-4">
              How it's made
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShopTile({ product, index }: { product: Product; index: number }) {
  const [variant, setVariant] = useState(0);
  const shown = product.variants[variant] ?? product.variants[0]!;

  return (
    <article className="group">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden bg-sand"
      >
        <img
          src={shown.image}
          alt={`${product.name} in ${shown.name}`}
          loading="lazy"
          width={1024}
          height={1280}
          className={
            "aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.04] " +
            (product.imageFit === "contain" ? "object-contain p-2" : "object-cover")
          }
        />
        <span className="absolute left-3 top-3 font-display text-[10px] tracking-[0.28em] text-foreground/50">
          {String(index + 1).padStart(2, "0")}
        </span>
        {product.variants.length > 2 && (
          <span className="absolute right-3 top-3 bg-primary px-2 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-primary-foreground">
            3 colours
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-primary px-4 py-3 text-center font-display text-xs uppercase tracking-[0.24em] text-primary-foreground transition-transform duration-300 group-hover:translate-y-0">
          View piece <ArrowUpRight className="ml-1 inline size-3.5" />
        </span>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-sm uppercase tracking-[0.12em]">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{product.tagline}</p>
        </div>
        <span className="whitespace-nowrap font-display text-sm">{formatZar(product.price)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {product.variants.map((v, i) => (
          <button
            key={v.name}
            aria-label={`Preview ${v.name}`}
            onMouseEnter={() => setVariant(i)}
            onFocus={() => setVariant(i)}
            onClick={() => setVariant(i)}
            className={
              "size-4 rounded-full border transition-all " +
              (i === variant ? "border-foreground scale-110" : "border-border")
            }
            style={{ backgroundColor: swatchTone[v.name] ?? "#c9c4bb" }}
          />
        ))}
        <span className="ml-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {shown.name}
        </span>
      </div>
    </article>
  );
}
