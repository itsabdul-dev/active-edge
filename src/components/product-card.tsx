import { Link } from "@tanstack/react-router";
import { formatZar, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const hero = product.variants[0]!;
  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
      <div className="overflow-hidden rounded-md bg-sand">
        <img
          src={hero.image}
          alt={`${product.name} in ${hero.name}`}
          loading="lazy"
          className={
            "aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.03] " +
            (product.imageFit === "contain" ? "object-contain p-2" : "object-cover")
          }
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{product.name}</h3>
        <span className="text-sm text-muted-foreground">{formatZar(product.price)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {product.variants.map((v) => v.name).join(" · ")}
      </p>
    </Link>
  );
}
