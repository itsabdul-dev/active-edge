import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useCart } from "@/lib/cart-context";
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
  const { lines, subtotal, loading, error } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Record<string, string>[]>([]);
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
  useEffect(() => {
    if (!user) {
      setAddresses([]);
      return;
    }
    let active = true;
    setForm((f) => ({ ...f, email: user.email ?? f.email }));
    void getSupabaseBrowser()
      .from("customer_address")
      .select("*")
      .eq("customer_id", user.id)
      .then(({ data }) => {
        if (active) setAddresses(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);
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

      {!user && (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to="/account" className="underline">
            Sign in
          </Link>{" "}
          for saved delivery details, or continue as a guest.
        </p>
      )}
      {addresses.length > 0 && (
        <label className="mt-6 block text-sm">
          Use a saved address
          <select
            className={field}
            defaultValue=""
            onChange={(e) => {
              const a = addresses.find((a) => a["address_id"] === e.target.value);
              if (a)
                setForm((f) => ({
                  ...f,
                  firstName: a["first_name"] ?? "",
                  lastName: a["last_name"] ?? "",
                  phone: a["phone"] ?? "",
                  address: a["street"] ?? "",
                  suburb: a["suburb"] ?? "",
                  city: a["city"] ?? "",
                  postcode: a["postal_code"] ?? "",
                }));
            }}
          >
            <option value="">Choose an address</option>
            {addresses.map((a) => (
              <option key={a["address_id"]} value={a["address_id"]}>
                {a["label"]} — {a["street"]}
              </option>
            ))}
          </select>
        </label>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sessionStorage.setItem("ae-checkout-address", JSON.stringify(form));
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
