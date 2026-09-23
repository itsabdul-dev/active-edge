import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatZar } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag | ActiveEdge" },
      {
        name: "description",
        content:
          "Review your ActiveEdge bag and check out. Free courier on South African orders over R900.",
      },
      { property: "og:title", content: "Your Bag | ActiveEdge" },
      { property: "og:description", content: "Review your bag and check out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, loading, updating, error } = useCart();
  const shipping = subtotal === 0 || subtotal >= 900 ? 0 : 85;

  if (loading)
    return (
      <p className="px-5 py-24 text-center" role="status">
        Loading your bag…
      </p>
    );
  if (error)
    return (
      <p className="px-5 py-24 text-center" role="alert">
        {error}
      </p>
    );

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl">Your bag is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Nothing in here yet. Start with the Performance Tee — it's the one everyone reorders.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="text-3xl sm:text-4xl">Your bag</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-border">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-4 py-5">
              <img
                src={l.image}
                alt={l.name}
                className="h-32 w-24 rounded-sm bg-sand object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">{l.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.variant} · Size {l.size}
                    </p>
                  </div>
                  <button
                    disabled={updating}
                    onClick={() => remove(l.id)}
                    aria-label={`Remove ${l.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-sm border border-border px-2 py-1">
                    <button
                      disabled={updating}
                      onClick={() => setQty(l.id, l.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm">{l.qty}</span>
                    <button
                      disabled={updating || l.qty >= 99}
                      onClick={() => setQty(l.id, l.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-sm">{formatZar(l.price * l.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="text-lg">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatZar(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Courier</dt>
              <dd>{shipping === 0 ? "Free" : formatZar(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatZar(subtotal + shipping)}</dd>
            </div>
          </dl>
          {shipping > 0 ? (
            <div className="mt-4">
              <div className="h-1 w-full bg-sand">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / 900) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Add {formatZar(900 - subtotal)} more for free countrywide delivery.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em]">
              Free countrywide courier unlocked
            </p>
          )}
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-sm bg-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prices in ZAR incl. 15% VAT · Pay in 4 with Payflex
          </p>
          <ul className="mt-5 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <li>2–3 working days to main centres</li>
            <li>30-day returns, free size exchanges</li>
            <li>Secure checkout · Visa, Mastercard, Ozow, SnapScan</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
