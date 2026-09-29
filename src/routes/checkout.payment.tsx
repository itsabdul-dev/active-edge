import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import "@/payment.css";
import { useCart } from "@/lib/cart-context";
import { formatZar } from "@/lib/products";
import { cardBrand, cardError, formatCard } from "@/lib/demo-card";
import { recoverDemoPayment, payDemo, demoResult, type DemoResult } from "@/server/demo-payments";

export const Route = createFileRoute("/checkout/payment")({
  head: () => ({
    meta: [
      { title: "Demo payment | ActiveEdge" },
      {
        name: "description",
        content: "Simulated checkout for demonstration. No real money is charged.",
      },
    ],
  }),
  component: CheckoutPayment,
});
type Address = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  unit?: string;
  deliveryInstructions?: string;
  suburb: string;
  city: string;
  postcode: string;
  phone: string;
};
type Method = "card" | "apple_pay_demo" | "google_pay_demo";
const field = "gateway-input";
function CheckoutPayment() {
  const { lines, subtotal, loading, updating, error: cartError, refresh } = useCart();
  const [address, setAddress] = useState<Address | null>(null);
  const [ready, setReady] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const [receipt, setReceipt] = useState<DemoResult | null>(null);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [cardBack, setCardBack] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<"form" | "wallet" | "verify">("form");
  const [code, setCode] = useState("");
  const [challengeAt, setChallengeAt] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const shipping = subtotal === 0 || subtotal >= 900 ? 0 : 85;
  const brand = cardBrand(number);
  useEffect(() => {
    if (step !== "form" || busy || receipt) {
      const heading = stageHeading.current;
      heading?.focus({ preventScroll: true });
      heading
        ?.closest(".gateway-panel, .gateway-receipt")
        ?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [step, busy, receipt]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ae-checkout-address");
      if (raw) setAddress(JSON.parse(raw) as Address);
      const saved = sessionStorage.getItem("ae-demo-receipt");
      if (saved) {
        const parsed = demoResult.safeParse(JSON.parse(saved));
        if (parsed.success) setReceipt(parsed.data);
      }
    } catch {
      /* Invalid browser draft: ask for delivery details again. */
    }
    const pending = sessionStorage.getItem("ae-demo-attempt");
    if (!pending) {
      setReady(true);
      return;
    }
    void recoverDemoPayment({ data: { attemptId: pending } })
      .then((result) => {
        if (result?.status === "approved") {
          setReceipt(result);
          sessionStorage.setItem("ae-demo-receipt", JSON.stringify(result));
          sessionStorage.removeItem("ae-checkout-address");
          sessionStorage.removeItem("ae-checkout-draft");
        }
        if (result) sessionStorage.removeItem("ae-demo-attempt");
      })
      .catch(() => setRecoveryError(true))
      .finally(() => setReady(true));
  }, []);
  async function settle(outcome: "approved" | "declined" | "insufficient_funds" | "cancelled") {
    if (!address || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      let attemptId = sessionStorage.getItem("ae-demo-attempt");
      if (!attemptId) {
        attemptId = crypto.randomUUID();
        sessionStorage.setItem("ae-demo-attempt", attemptId);
      }
      const result = await payDemo({
        data: {
          attemptId,
          outcome,
          method,
          brand: method === "card" ? brand! : "Visa",
          lastFour: method === "card" ? number.replace(/\D/g, "").slice(-4) : "4242",
          expectedTotal: Math.round((subtotal + shipping) * 100),
          address: {
            email: address.email,
            first_name: address.firstName,
            last_name: address.lastName,
            phone: address.phone,
            street: address.address,
            unit: address.unit ?? "",
            delivery_instructions: address.deliveryInstructions ?? "",
            suburb: address.suburb,
            city: address.city,
            postal_code: address.postcode,
          },
        },
      });
      if (result.status === "approved") {
        // Persist receipt before refreshing the converted cart. Never persist card fields.
        setReceipt(result);
        setNumber("");
        setCvv("");
        setName("");
        setExpiry("");
        sessionStorage.setItem("ae-demo-receipt", JSON.stringify(result));
        sessionStorage.removeItem("ae-demo-attempt");
        sessionStorage.removeItem("ae-checkout-address");
        sessionStorage.removeItem("ae-checkout-draft");
        await refresh().catch(() => {});
      } else {
        sessionStorage.removeItem("ae-demo-attempt");
        setMessage(
          result.status === "declined"
            ? "Your payment was declined. Check your details or use another payment method."
            : result.status === "insufficient_funds"
              ? "This payment could not be approved. Please use another payment method."
              : "Payment cancelled. Your bag is unchanged.",
        );
        setStep("form");
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Connection interrupted. Retry to recover this payment attempt safely.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function begin() {
    setMessage("");
    if (method === "card") {
      const issue = !name.trim() ? "Enter a cardholder name." : cardError(number, expiry, cvv);
      if (issue) {
        setMessage(issue);
        return;
      }
    }
    if (method !== "card") {
      setStep("wallet");
      return;
    }
    setCode("");
    setChallengeAt(Date.now());
    setStep("verify");
  }
  if (!ready) return <p className="p-16 text-center">Loading checkout…</p>;
  if (recoveryError)
    return (
      <div className="p-16 text-center" role="alert">
        Could not confirm the previous payment result. Refresh this page to recover it safely.
      </div>
    );
  if (receipt)
    return (
      <main className="gateway-shell">
        <div className="gateway-receipt gateway-enter">
          <div className="gateway-success">
            <Check size={38} strokeWidth={2.5} />
          </div>
          <p className="gateway-kicker">PAYMENT COMPLETE</p>
          <h1 ref={stageHeading} tabIndex={-1}>
            You're all set.
          </h1>
          <p className="gateway-muted">Your order is confirmed. Ready for your next move.</p>
          <div className="gateway-receipt-total">
            <span>Total paid · ZAR</span>
            <strong>{formatZar(receipt.totalCents / 100)}</strong>
            <span className="gateway-pill">Simulation approved</span>
          </div>
          <dl className="gateway-receipt-details">
            <div>
              <dt>Order number</dt>
              <dd>{receipt.orderNumber}</dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>
                {receipt.method === "card"
                  ? receipt.brand
                  : receipt.method === "apple_pay_demo"
                    ? "Apple Pay"
                    : "Google Pay"}{" "}
                · •••• {receipt.lastFour}
              </dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{receipt.reference}</dd>
            </div>
          </dl>
          <p className="gateway-demo-note">
            Demo transaction. No money was charged, and no shipment or email will be sent.
          </p>
          <Link to="/shop" className="gateway-pay">
            Continue shopping <ArrowRight size={18} />
          </Link>
          <div className="gateway-receipt-links">
            {receipt.orderId && (
              <Link to="/orders/$orderId" params={{ orderId: receipt.orderId }}>
                Track your order
              </Link>
            )}
            <Link to="/account">View my orders</Link>
            <button onClick={() => window.print()}>Print receipt</button>
          </div>
        </div>
      </main>
    );
  if (loading)
    return (
      <p className="p-16 text-center" role="status">
        Loading your bag…
      </p>
    );
  if (!address)
    return (
      <div className="p-16 text-center">
        <h1>Delivery details needed</h1>
        <Link to="/checkout" className="underline">
          Enter delivery details
        </Link>
      </div>
    );
  if (!lines.length)
    return (
      <div className="p-16 text-center">
        <h1>Your bag is empty</h1>
        <Link to="/shop" className="underline">
          Shop the collection
        </Link>
      </div>
    );
  const amount = formatZar(subtotal + shipping);
  return (
    <main className="gateway-shell">
      <div className="gateway-wrap">
        <div className="gateway-topline">
          <Link to="/checkout">
            <ArrowLeft size={15} /> Back to delivery
          </Link>
          <span className="gateway-demo-badge">
            <span />
            Demo mode · no real charges
          </span>
        </div>
        <div className="gateway-layout">
          <section className="gateway-panel">
            <header className="gateway-header">
              <div className="gateway-mark">
                AE<span>PAY</span>
              </div>
              <span>
                <Lock size={13} /> Private checkout
              </span>
            </header>
            <ol className="gateway-steps" aria-label="Checkout progress">
              <li>
                <Check size={12} /> Delivery
              </li>
              <li className="is-current">02 Payment</li>
              <li>03 Confirmation</li>
            </ol>
            {busy ? (
              <div className="gateway-stage gateway-enter" role="status">
                <div className="gateway-processing">
                  <ShieldCheck size={34} />
                </div>
                <p className="gateway-kicker">PROCESSING PAYMENT</p>
                <h1 ref={stageHeading} tabIndex={-1}>
                  Just a moment.
                </h1>
                <p className="gateway-muted">
                  We're confirming your payment of {amount}.<br />
                  Please keep this page open.
                </p>
                <div className="gateway-progress">
                  <span />
                </div>
                <p className="gateway-demo-note">Simulated authorisation · no money will move</p>
              </div>
            ) : step === "verify" ? (
              <form
                className="gateway-stage gateway-enter"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (Date.now() - challengeAt > 180000) {
                    setMessage("Your verification session expired. Please try again.");
                    setStep("form");
                    return;
                  }
                  if (code !== "123456") {
                    setMessage("That code isn't correct. Check the six-digit code and try again.");
                    return;
                  }
                  void settle("approved");
                }}
              >
                <div className="gateway-stage-icon">
                  <Smartphone size={30} />
                </div>
                <p className="gateway-kicker">ONE LAST STEP</p>
                <h1 ref={stageHeading} tabIndex={-1}>
                  Confirm it's you.
                </h1>
                <p className="gateway-muted">
                  Approve {amount} to ActiveEdge using
                  <br />
                  your verification code.
                </p>
                <label className="gateway-code-label">
                  Verification code
                  <input
                    autoFocus
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setMessage("");
                    }}
                    className="gateway-code"
                    aria-describedby="verification-help"
                  />
                </label>
                <p id="verification-help" className="gateway-demo-note">
                  Demo code: <strong>123456</strong> · No SMS is sent.
                </p>
                {message && (
                  <p className="gateway-error" role="alert">
                    {message}
                  </p>
                )}
                <button className="gateway-pay" type="submit">
                  Confirm payment <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="gateway-cancel"
                  onClick={() => void settle("cancelled")}
                >
                  Cancel payment
                </button>
              </form>
            ) : step === "wallet" ? (
              <section className="gateway-stage gateway-enter" aria-label="Wallet confirmation">
                <div className="gateway-stage-icon">
                  <Wallet size={30} />
                </div>
                <p className="gateway-kicker">
                  {method === "apple_pay_demo" ? "APPLE PAY" : "GOOGLE PAY"}
                </p>
                <h1 ref={stageHeading} tabIndex={-1}>
                  Review your payment.
                </h1>
                <p className="gateway-muted">ActiveEdge · {amount}</p>
                <div className="gateway-wallet-card">
                  <CreditCard size={28} />
                  <div>
                    <strong>Visa Debit</strong>
                    <span>•••• 4242 · Demo wallet</span>
                  </div>
                  <CheckCircle2 size={20} />
                </div>
                <p className="gateway-demo-note">
                  Wallet simulation. Your device wallet is not connected.
                </p>
                <button className="gateway-pay" onClick={() => void settle("approved")}>
                  Confirm {amount} <ArrowRight size={18} />
                </button>
                <button className="gateway-cancel" onClick={() => void settle("cancelled")}>
                  Cancel payment
                </button>
                {message && (
                  <p className="gateway-error" role="alert">
                    {message}
                  </p>
                )}
              </section>
            ) : (
              <form
                className="gateway-form gateway-enter"
                onSubmit={(e) => {
                  e.preventDefault();
                  begin();
                }}
              >
                <h1>Make it yours.</h1>
                <p className="gateway-muted">Choose how you'd like to pay.</p>
                <div className="gateway-methods" aria-label="Payment method">
                  {(
                    [
                      ["card", "Card", CreditCard],
                      ["apple_pay_demo", "Apple Pay", Wallet],
                      ["google_pay_demo", "Google Pay", Wallet],
                    ] as const
                  ).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={method === value}
                      className={method === value ? "is-active" : ""}
                      onClick={() => {
                        setMethod(value);
                        setMessage("");
                      }}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                {method === "card" ? (
                  <div key="card" className="gateway-enter">
                    <div
                      className={`gateway-card-scene ${cardBack ? "is-flipped" : ""}`}
                      aria-hidden="true"
                    >
                      <div className="gateway-card">
                        <div className="gateway-card-front">
                          <div className="gateway-card-top">
                            <span>
                              ACTIVEEDGE
                              <span className="gateway-card-sub">EVERYDAY / EVERY EDGE</span>
                            </span>
                            <span className="gateway-card-brand">
                              {brand === "Mastercard" ? (
                                <span className="gateway-mastercard">
                                  <i />
                                  <i />
                                </span>
                              ) : brand === "Visa" ? (
                                <em>VISA</em>
                              ) : (
                                <CreditCard size={25} />
                              )}
                            </span>
                          </div>
                          <div className="gateway-chip" />
                          <div className="gateway-card-number">
                            {number || "••••  ••••  ••••  ••••"}
                          </div>
                          <div className="gateway-card-bottom">
                            <span>
                              <small>CARDHOLDER</small>
                              {name || "YOUR NAME"}
                            </span>
                            <span>
                              <small>VALID THRU</small>
                              {expiry || "MM/YY"}
                            </span>
                          </div>
                        </div>
                        <div className="gateway-card-back">
                          <div className="gateway-card-stripe" />
                          <div className="gateway-card-signature">
                            <span>Authorised signature</span>
                            <strong>{"•".repeat(cvv.length) || "•••"}</strong>
                          </div>
                          <p>ACTIVEEDGE PAY · DEMO CARD</p>
                        </div>
                      </div>
                    </div>
                    <div className="gateway-fields">
                      <label>
                        Cardholder name
                        <input
                          required
                          autoComplete="off"
                          placeholder="Name on card"
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={field}
                        />
                      </label>
                      <label>
                        Card number
                        <span className="gateway-input-wrap">
                          <input
                            required
                            aria-label="Card number"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="0000 0000 0000 0000"
                            value={number}
                            onChange={(e) => {
                              setNumber(formatCard(e.target.value));
                              setMessage("");
                            }}
                            className={field}
                          />
                          <span className="gateway-detected" aria-live="polite">
                            {brand ?? <CreditCard size={18} />}
                          </span>
                        </span>
                      </label>
                      <div className="gateway-field-pair">
                        <label>
                          Expiry date
                          <input
                            required
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                            }}
                            className={field}
                          />
                        </label>
                        <label>
                          Security code
                          <input
                            required
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="CVV"
                            maxLength={3}
                            value={cvv}
                            onFocus={() => setCardBack(true)}
                            onBlur={() => setCardBack(false)}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                            className={field}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={method} className="gateway-wallet-intro gateway-enter">
                    <div className="gateway-stage-icon">
                      <Wallet size={30} />
                    </div>
                    <h2>A simpler way to pay.</h2>
                    <p>
                      Review your saved demo card and confirm
                      <br />
                      with {method === "apple_pay_demo" ? "Apple Pay" : "Google Pay"}.
                    </p>
                    <span>Simulated wallet · no device access</span>
                  </div>
                )}
                {(message || cartError) && (
                  <p className="gateway-error" role="alert">
                    {message || cartError}
                  </p>
                )}
                <button type="submit" disabled={updating} className="gateway-pay">
                  <Lock size={16} />
                  <span>Pay {amount}</span>
                  <ArrowRight size={18} />
                </button>
                <p className="gateway-privacy">
                  Use test card details only. No real money is charged.
                  <br />
                  Your full card number and security code are never sent or saved.
                </p>
              </form>
            )}
            <footer className="gateway-footer">
              <ShieldCheck size={14} /> ACTIVEEDGE PAY{" "}
              <span>Private. Simple. Made for your next move.</span>
            </footer>
          </section>
          <aside className="gateway-summary">
            <p className="gateway-kicker">YOUR NEXT MOVE</p>
            <h2>Good kit. Great choice.</h2>
            <div className="gateway-summary-items">
              {lines.map((l) => (
                <div className="gateway-summary-item" key={l.id}>
                  <div className="gateway-product-image">
                    <img src={l.image} alt={l.name} />
                    <span>{l.qty}</span>
                  </div>
                  <div>
                    <h3>{l.name}</h3>
                    <p>
                      {l.variant} / {l.size}
                    </p>
                    <strong>{formatZar(l.price * l.qty)}</strong>
                  </div>
                </div>
              ))}
            </div>
            <dl className="gateway-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatZar(subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{shipping ? formatZar(shipping) : "On us"}</dd>
              </div>
              <div className="gateway-total">
                <dt>
                  Total <small>ZAR · VAT included</small>
                </dt>
                <dd>{amount}</dd>
              </div>
            </dl>
            <div className="gateway-delivery">
              <CheckCircle2 size={18} />
              <div>
                <strong>Delivery details confirmed</strong>
                <p>
                  {address.firstName} {address.lastName}
                  <br />
                  {address.unit ? `${address.unit}, ` : ""}
                  {address.address}, {address.city}
                </p>
                <Link to="/checkout">Edit details</Link>
              </div>
            </div>
            <p className="gateway-summary-note">
              A demonstration of the full checkout experience.
              <br />
              Demo orders won't be shipped.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
