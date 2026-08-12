import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import logo from "@/assets/ae-logo.svg";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Our Fabric" },
  { to: "/faq", label: "Help" },
];

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-primary py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
        Free courier over R900 · 30-day returns · Pay in 4 with Payflex
      </div>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
          <button
            className="-ml-1 p-1 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ActiveEdge" className="h-8 w-auto" />
            <span className="font-display text-lg font-extrabold uppercase tracking-tight">
              Active<span className="text-muted-foreground">Edge</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.14em] md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/cart"
            className="relative ml-auto flex items-center gap-2 text-sm md:ml-8"
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
