import { useState } from "react";
import { subscribeNewsletter } from "@/server/newsletter";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/ae-logo.svg";

export function SiteFooter() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logo} alt="ActiveEdge" className="h-10 w-auto brightness-0 invert" />
          <p className="mt-4 font-display text-lg font-extrabold uppercase tracking-tight">
            ActiveEdge
          </p>
          <p className="mt-3 max-w-xs text-sm opacity-70">
            Performance apparel built for every edge. Recycled fibres, plastic-free delivery, made
            to outlast the season.
          </p>
        </div>
        <div className="text-sm">
          <p className="eyebrow opacity-60">Shop</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link to="/shop" className="opacity-70 hover:opacity-100">
                All products
              </Link>
            </li>
            <li>
              <Link to="/about" className="opacity-70 hover:opacity-100">
                Our fabric
              </Link>
            </li>
            <li>
              <Link to="/faq" className="opacity-70 hover:opacity-100">
                Delivery &amp; returns
              </Link>
            </li>
            <li>
              <Link to="/faq" hash="size-guide" className="opacity-70 hover:opacity-100">
                Size guide
              </Link>
            </li>
            <li>
              <Link to="/cart" className="opacity-70 hover:opacity-100">
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow opacity-60">Delivery</p>
          <ul className="mt-4 space-y-2 opacity-70">
            <li>Free courier over R900</li>
            <li>2–3 days to main centres</li>
            <li>30-day returns, free size swaps</li>
            <li>Cape Town studio · Mon–Fri 9–5</li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow opacity-60">The edge list</p>
          <p className="mt-4 opacity-70">
            Early drops, restocks and training notes. No spam, ever.
          </p>
          <form
            className="mt-4 flex"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const values = new FormData(form);
              setBusy(true);
              setMessage("");
              try {
                await subscribeNewsletter({
                  data: {
                    email: String(values.get("email")),
                    website: String(values.get("website") ?? ""),
                  },
                });
                form.reset();
                setMessage("Your signup request has been saved.");
              } catch {
                setMessage("Signup is temporarily unavailable. Please try again later.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              aria-label="Email address"
              className="min-w-0 flex-1 border border-white/25 bg-transparent px-3 py-2.5 text-sm placeholder:text-white/40 focus:border-white focus:outline-none"
            />
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <button
              disabled={busy}
              type="submit"
              className="bg-white px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
            >
              {busy ? "Saving…" : "Join"}
            </button>
          </form>
          {message && (
            <p role="status" className="mt-3 text-xs">
              {message}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-5 py-5">
          {["Visa", "Mastercard", "Ozow EFT", "SnapScan", "Payflex"].map((p) => (
            <span
              key={p}
              className="border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] opacity-70"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} ActiveEdge · Cape Town, ZA · Prices in ZAR incl. 15% VAT
      </div>
    </footer>
  );
}
