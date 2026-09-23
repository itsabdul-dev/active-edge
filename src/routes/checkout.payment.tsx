import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatZar } from "@/lib/products";

export const Route = createFileRoute("/checkout/payment")({
  head: () => ({
    meta: [
      { title: "Checkout — Payment | ActiveEdge" },
      {
        name: "description",
        content: "Preview the ActiveEdge demo checkout. No payment is processed or order placed.",
      },
      { property: "og:title", content: "Checkout — Payment | ActiveEdge" },
      { property: "og:description", content: "Secure demo payment for your ActiveEdge order." },
    ],
  }),
  component: CheckoutPayment,
});

type Address = {
  firstName?: string;
  lastName?: string;
  address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
};

function CheckoutPayment() {
  const { lines, subtotal, loading, error } = useCart();
  const [address, setAddress] = useState<Address | null>(null);
  const [placed, setPlaced] = useState(false);
  const shipping = subtotal === 0 || subtotal >= 900 ? 0 : 85;
  const [paidTotal, setPaidTotal] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ae-checkout-address");
      if (raw) setAddress(JSON.parse(raw) as Address);
    } catch {
      /* ignore */
    }
  }, []);

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

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="eyebrow text-clay">Demo complete</p>
        <h1 className="mt-4 text-3xl">You've finished the demo checkout.</h1>
        <p className="mt-4 text-muted-foreground">
          Your demo total was {formatZar(paidTotal)}. No payment was taken, no order was placed, and
          no confirmation email was sent.
        </p>
        <Link to="/shop" className="btn-solid mt-8 inline-block">
          Keep shopping
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl">Nothing to pay for</h1>
        <p className="mt-3 text-muted-foreground">Your bag is empty.</p>
        <Link to="/shop" className="btn-solid mt-8 inline-block">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <p className="eyebrow text-muted-foreground">Step 2 of 2</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Demo payment</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This is a preview of checkout. Your bag will be kept for later. No payment will be processed
        or order placed.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPaidTotal(subtotal + shipping);
          setPlaced(true);
        }}
        className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]"
      >
        <div className="space-y-5">
          {address?.address && (
            <div className="rounded-md border border-border bg-card p-4 text-sm">
              <p className="eyebrow text-muted-foreground">Deliver to</p>
              <p className="mt-2">
                {address.firstName} {address.lastName}
                <br />
                {address.address}, {address.suburb}
                <br />
                {address.city}, {address.postcode}
              </p>
              <Link to="/checkout" className="mt-3 inline-block text-xs underline">
                Edit address
              </Link>
            </div>
          )}

          <div className="border border-border bg-sand p-6">
            <h2 className="text-lg">Online payments are coming soon</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You can preview the order total below. No card details are needed for this demo.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Demo checkout — no real payment is processed.
          </p>
        </div>

        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="text-lg">Order summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {l.name} × {l.qty}
                </span>
                <span>{formatZar(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Courier</dt>
              <dd>{shipping === 0 ? "Free" : formatZar(shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatZar(subtotal + shipping)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            className="mt-6 w-full rounded-sm bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Complete demo · {formatZar(subtotal + shipping)}
          </button>
        </aside>
      </form>
    </div>
  );
}
