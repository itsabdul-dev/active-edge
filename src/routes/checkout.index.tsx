import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type HTMLInputAutoCompleteAttribute } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useCart } from "@/lib/cart-context";
import { formatZar } from "@/lib/products";
import { deliverySchema, emptyDelivery, readDeliveryDraft, type Delivery } from "@/lib/delivery";
import "@/delivery.css";
import { AddressAutocomplete } from "@/components/address-autocomplete";

export const Route = createFileRoute("/checkout/")({
  head: () => ({
    meta: [
      { title: "Delivery details | ActiveEdge" },
      {
        name: "description",
        content: "Choose your delivery address and review your ActiveEdge order.",
      },
    ],
  }),
  component: CheckoutAddress,
});
type Field = keyof Delivery;
function CheckoutAddress() {
  const { lines, subtotal, loading, updating, error } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Record<string, string>[]>([]);
  const [savedError, setSavedError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [form, setForm] = useState<Delivery>({ ...emptyDelivery });
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string | undefined>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    try {
      setForm(
        readDeliveryDraft(
          sessionStorage.getItem("ae-checkout-draft") ??
            sessionStorage.getItem("ae-checkout-address"),
        ),
      );
    } catch {
      /* Manual entry remains available. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem("ae-checkout-draft", JSON.stringify(form));
      } catch {
        /* Surface storage failures only if checkout cannot continue. */
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form, ready]);
  useEffect(() => {
    setAddresses([]);
    setSelectedAddress("");
    setSavedError("");
    if (!user) return;
    let active = true;
    setForm((f) => ({ ...f, email: user.email ?? f.email }));
    void getSupabaseBrowser()
      .from("customer_address")
      .select("*")
      .eq("customer_id", user.id)
      .then(({ data, error: failed }) => {
        if (active) {
          if (failed)
            setSavedError("Saved addresses couldn't load. You can still enter an address below.");
          else setAddresses(data ?? []);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);
  const shipping = subtotal === 0 || subtotal >= 900 ? 0 : 85;
  const update = (key: Field, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSelectedAddress("");
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const validateField = (key: Field) => {
    const result = deliverySchema.shape[key].safeParse(form[key]);
    setErrors((e) => ({
      ...e,
      [key]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };
  const input = (
    key: Field,
    label: string,
    autoComplete: HTMLInputAutoCompleteAttribute,
    options: {
      type?: string;
      inputMode?: "tel" | "numeric" | "email";
      placeholder?: string;
      optional?: boolean;
    } = {},
  ) => (
    <label className="delivery-label" htmlFor={`delivery-${key}`}>
      {label}
      {options.optional && <span>Optional</span>}
      <input
        id={`delivery-${key}`}
        name={key}
        autoComplete={autoComplete}
        type={options.type ?? "text"}
        inputMode={options.inputMode}
        placeholder={options.placeholder}
        maxLength={key === "email" ? 254 : key === "unit" ? 120 : 200}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        onBlur={() => validateField(key)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        className="delivery-input"
      />
      {errors[key] && (
        <small id={`${key}-error`} className="delivery-error">
          {errors[key]}
        </small>
      )}
    </label>
  );
  if (loading || !ready)
    return (
      <div className="delivery-shell">
        <div className="mx-auto max-w-5xl space-y-5 py-10" role="status">
          <span className="sr-only">Loading checkout</span>
          <div className="h-8 w-48 rounded-lg bg-muted motion-safe:animate-pulse" />
          <div className="h-96 rounded-2xl bg-muted motion-safe:animate-pulse" />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="p-16 text-center" role="alert">
        {error}
        <Link to="/cart" className="block underline">
          Return to your bag
        </Link>
      </div>
    );
  if (!lines.length)
    return (
      <div className="p-16 text-center">
        <h1>Your bag is empty</h1>
        <Link to="/shop" className="btn-solid mt-6 inline-block">
          Explore the collection
        </Link>
      </div>
    );
  return (
    <div className="delivery-shell">
      <div className="delivery-wrap">
        <div className="delivery-topline">
          <Link to="/cart">
            <ArrowLeft size={14} />
            Back to bag
          </Link>
          <span>Demo store · No real charges</span>
        </div>
        <form
          id="delivery-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (submitting || updating) return;
            const parsed = deliverySchema.safeParse(form);
            if (!parsed.success) {
              const next: Partial<Record<Field, string | undefined>> = {};
              for (const issue of parsed.error.issues) {
                const k = issue.path[0] as Field;
                if (!next[k]) next[k] = issue.message;
              }
              setErrors(next);
              const first = parsed.error.issues[0]?.path[0];
              document.getElementById(`delivery-${String(first)}`)?.focus();
              return;
            }
            try {
              sessionStorage.setItem("ae-checkout-address", JSON.stringify(parsed.data));
              sessionStorage.setItem("ae-checkout-draft", JSON.stringify(parsed.data));
              sessionStorage.removeItem("ae-demo-receipt");
              setSubmitting(true);
              void navigate({ to: "/checkout/payment" }).catch(() => {
                setSubmitting(false);
                setSubmitError("We couldn't open payment. Please try again.");
              });
            } catch {
              setSubmitError(
                "Enable browser session storage to continue securely. Your details remain in this form.",
              );
            }
          }}
          className="delivery-layout"
        >
          <section className="delivery-panel">
            <div className="delivery-step">
              01 DELIVERY <span>02 PAYMENT</span>
            </div>
            <h1>Where should it go?</h1>
            <p className="delivery-muted">A few details, then you're on your way.</p>
            {!user && (
              <p className="delivery-signin">
                Checking out as a guest. <Link to="/account">Sign in</Link> for saved addresses.
              </p>
            )}
            <h2 className="delivery-section-title">Contact details</h2>
            <div className="delivery-grid">
              {input("email", "Email address", "email", {
                type: "email",
                inputMode: "email",
                placeholder: "you@example.com",
              })}
              {input("phone", "Phone number", "tel", {
                type: "tel",
                inputMode: "tel",
                placeholder: "082 123 4567",
              })}
            </div>
            <h2 className="delivery-section-title">
              <MapPin size={17} />
              Delivery address
            </h2>
            {savedError && (
              <p role="status" className="delivery-muted">
                {savedError}
              </p>
            )}
            {addresses.length > 0 && (
              <label className="delivery-label delivery-saved">
                Your saved addresses
                <select
                  aria-label="Use a saved address"
                  className="delivery-input"
                  value={selectedAddress}
                  onChange={(e) => {
                    setSelectedAddress(e.target.value);
                    const a = addresses.find((a) => a["address_id"] === e.target.value);
                    if (a) {
                      setForm((f) => ({
                        ...f,
                        firstName: a["first_name"] ?? "",
                        lastName: a["last_name"] ?? "",
                        phone: a["phone"] ?? "",
                        address: a["street"] ?? "",
                        suburb: a["suburb"] ?? "",
                        city: a["city"] ?? "",
                        postcode: a["postal_code"] ?? "",
                        unit: "",
                        deliveryInstructions: "",
                      }));
                      setErrors({});
                    }
                  }}
                >
                  <option value="">Enter an address manually</option>
                  {addresses.map((a) => (
                    <option key={a["address_id"]} value={a["address_id"]}>
                      {a["label"]} — {a["street"]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="delivery-grid">
              {input("firstName", "First name", "shipping given-name")}
              {input("lastName", "Last name", "shipping family-name")}
            </div>
            <div className="mt-5">
              <AddressAutocomplete
                value={form.address}
                onChange={(value) => update("address", value)}
                onBlur={() => validateField("address")}
                error={errors.address}
                onSelect={(address) => {
                  setForm((f) => ({
                    ...f,
                    address: address.address,
                    city: address.city,
                    suburb: address.suburb,
                    postcode: address.postcode,
                  }));
                  setSelectedAddress("");
                  setErrors((e) => ({
                    ...e,
                    address: undefined,
                    city: undefined,
                    suburb: undefined,
                    postcode: undefined,
                  }));
                }}
              />
            </div>
            <div className="mt-5">
              {input("unit", "Apartment, suite or building", "shipping address-line2", {
                optional: true,
                placeholder: "Apartment 4, Building B",
              })}
            </div>
            <div className="delivery-grid mt-5">
              {input("suburb", "Suburb", "shipping address-level3", { optional: true })}
              {input("city", "City", "shipping address-level2")}
            </div>
            <div className="delivery-grid mt-5">
              {input("postcode", "Postal code", "shipping postal-code", {
                inputMode: "numeric",
                placeholder: "8000",
              })}
              <label className="delivery-label">
                Country
                <input
                  value="South Africa"
                  readOnly
                  aria-label="Country"
                  className="delivery-input bg-muted"
                />
              </label>
            </div>
            <label className="delivery-label mt-5" htmlFor="delivery-deliveryInstructions">
              Delivery instructions<span>Optional</span>
              <textarea
                id="delivery-deliveryInstructions"
                name="deliveryInstructions"
                maxLength={500}
                rows={3}
                value={form.deliveryInstructions}
                onChange={(e) => update("deliveryInstructions", e.target.value)}
                onBlur={() => validateField("deliveryInstructions")}
                placeholder="Gate code, reception or a helpful landmark"
                className="delivery-input"
                aria-invalid={Boolean(errors.deliveryInstructions)}
              />
              <small className="delivery-muted">
                {form.deliveryInstructions.length}/500 · Don't include sensitive personal
                information.
              </small>
            </label>
            <p className="delivery-demo">
              <ShieldCheck size={16} />
              Demo checkout. Use sample details; no order will be shipped.
            </p>
            {submitError && (
              <p className="delivery-error" role="alert">
                {submitError}
              </p>
            )}
          </section>
          <aside className="delivery-summary">
            <h2>Your order</h2>
            <div className="delivery-products">
              {lines.map((l) => (
                <div className="delivery-product" key={l.id}>
                  <img src={l.image} alt={l.name} loading="lazy" />
                  <div>
                    <strong>{l.name}</strong>
                    <p>
                      {l.variant} / {l.size} · Qty {l.qty}
                    </p>
                    <span>{formatZar(l.price * l.qty)}</span>
                  </div>
                </div>
              ))}
            </div>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatZar(subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{shipping ? formatZar(shipping) : "Free"}</dd>
              </div>
              <div className="delivery-total">
                <dt>
                  Total<small>ZAR · VAT included</small>
                </dt>
                <dd>{formatZar(subtotal + shipping)}</dd>
              </div>
            </dl>
            <p className="delivery-assurance">
              <CheckCircle2 size={16} />
              {shipping ? "Free delivery on orders of R900 or more" : "Free delivery included"}
            </p>
            <button
              type="submit"
              disabled={submitting || updating}
              className="delivery-submit desktop-submit"
            >
              {submitting ? "Opening payment…" : "Continue to payment"}
              <ArrowRight size={17} />
            </button>
            <p className="delivery-muted text-center">Review and confirm before you pay.</p>
          </aside>
          <div className="delivery-mobile-bar">
            <div>
              <small>Total incl. delivery</small>
              <strong>{formatZar(subtotal + shipping)}</strong>
            </div>
            <button type="submit" disabled={submitting || updating} className="delivery-submit">
              {submitting ? "Opening…" : "Continue"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
