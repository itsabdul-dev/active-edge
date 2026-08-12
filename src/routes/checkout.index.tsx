import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatZar } from "@/lib/products";

export const Route = createFileRoute("/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout — Delivery Details | ActiveEdge" },
      {
        name: "description",
        content: "Enter your delivery address to complete your ActiveEdge order.",
      },
      { property: "og:title", content: "Checkout — Delivery Details | ActiveEdge" },
      {
        property: "og:description",
        content: "Enter your delivery address for your ActiveEdge kit.",
      },
    ],
  }),
  component: CheckoutAddress,
});

const field =
  "mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function CheckoutAddress() {
  const { lines, subtotal } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    suburb: "",
    city: "",
    postcode: "",
    phone: "",
  });
  const shipping = subtotal === 0 || subtotal >= 900 ? 0 : 85;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl">Nothing to check out</h1>
        <p className="mt-3 text-muted-foreground">Your bag is empty.</p>
        <Link to="/shop" className="btn-solid mt-8 inline-block">
          Shop the collection
        </Link>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <p className="eyebrow text-muted-foreground">Step 1 of 2</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Delivery details</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem("ae-checkout-address", JSON.stringify(form));
          navigate({ to: "/checkout/payment" });
        }}
        className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]"
      >
        <div className="space-y-5">
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={set("email")}
              className={field}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              First name
              <input
                required
                value={form.firstName}
                onChange={set("firstName")}
                className={field}
              />
            </label>
            <label className="block text-sm">
              Last name
              <input required value={form.lastName} onChange={set("lastName")} className={field} />
            </label>
          </div>
          <label className="block text-sm">
            Street address
            <input required value={form.address} onChange={set("address")} className={field} />
          </label>
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm">
              Suburb
              <input required value={form.suburb} onChange={set("suburb")} className={field} />
            </label>
            <label className="block text-sm">
              City
              <input required value={form.city} onChange={set("city")} className={field} />
            </label>
            <label className="block text-sm">
              Postal code
              <input required value={form.postcode} onChange={set("postcode")} className={field} />
            </label>
          </div>
          <label className="block text-sm">
            Phone
            <input required value={form.phone} onChange={set("phone")} className={field} />
          </label>
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
            Continue to payment
          </button>
          <Link
            to="/cart"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Back to bag
          </Link>
        </aside>
      </form>
    </div>
  );
}
