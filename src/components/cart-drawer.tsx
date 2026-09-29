import "@/delivery.css";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Truck, Trash2 } from "lucide-react";
import { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";
import { formatZar } from "@/lib/products";

export function CartDrawer() {
  const cart = useCart();
  const returnFocus = useRef<HTMLElement | null>(null);
  const busy = cart.loading || cart.updating || Boolean(cart.pendingAddition);
  const shipping = cart.subtotal === 0 || cart.subtotal >= 900 ? 0 : 85;
  return (
    <Sheet
      open={cart.drawerOpen}
      onOpenChange={(open) => {
        if (!open) cart.closeDrawer();
      }}
    >
      <SheetContent
        className="bag-drawer flex h-dvh w-full flex-col gap-0 p-0 sm:max-w-[460px]"
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement)
            returnFocus.current = document.activeElement;
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (returnFocus.current?.isConnected) returnFocus.current.focus();
        }}
      >
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <ShoppingBag className="size-5" />
            Your bag{" "}
            <span className="text-sm font-normal text-muted-foreground">({cart.count})</span>
          </SheetTitle>
          <SheetDescription>Good kit for your next move. Review it here.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" aria-busy={busy}>
          {cart.addedMessage && (
            <p
              role="status"
              className="mb-5 flex items-center gap-2 rounded-lg bg-[#edf2e7] p-3 text-xs text-[#526444]"
            >
              <CheckCircle2 className="size-4" />
              {cart.addedMessage}
            </p>
          )}
          {cart.error && (
            <p role="alert" className="mb-4 rounded-lg border border-clay p-3 text-sm">
              {cart.error}
            </p>
          )}
          {cart.pendingAddition && (
            <div
              role="status"
              className="mb-5 flex items-center gap-4 rounded-xl border border-dashed border-border p-3"
            >
              <img
                src={cart.pendingAddition.image}
                alt=""
                className="h-20 w-16 rounded-lg object-cover opacity-60"
              />
              <div className="text-sm">
                <strong>Adding {cart.pendingAddition.name}…</strong>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cart.pendingAddition.variant} / {cart.pendingAddition.size} ·{" "}
                  {cart.pendingAddition.qty}
                </p>
              </div>
            </div>
          )}
          {cart.loading ? (
            <div role="status" className="space-y-5">
              <span className="sr-only">Loading your bag</span>
              {[0, 1].map((n) => (
                <div key={n} className="flex gap-4 motion-safe:animate-pulse">
                  <div className="h-24 w-20 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-3 py-3">
                    <div className="h-4 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : cart.lines.length ? (
            <ul className="space-y-6">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-4">
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    onClick={cart.closeDrawer}
                    className="shrink-0"
                  >
                    <img
                      src={line.image}
                      alt={line.name}
                      loading="lazy"
                      className="h-28 w-20 rounded-xl bg-muted object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <Link
                        to="/product/$slug"
                        params={{ slug: line.slug }}
                        onClick={cart.closeDrawer}
                        className="text-sm font-semibold"
                      >
                        {line.name}
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => cart.remove(line.id)}
                        aria-label={`Remove ${line.name}`}
                        className="p-1 text-muted-foreground disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.variant} · Size {line.size}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          aria-label={`Decrease ${line.name} quantity`}
                          disabled={busy}
                          onClick={() => cart.setQty(line.id, line.qty - 1)}
                          className="p-2.5 disabled:opacity-30"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-6 text-center text-xs">{line.qty}</span>
                        <button
                          aria-label={`Increase ${line.name} quantity`}
                          disabled={busy || line.qty >= 99}
                          onClick={() => cart.setQty(line.id, line.qty + 1)}
                          className="p-2.5 disabled:opacity-30"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <strong className="text-sm">{formatZar(line.price * line.qty)}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !cart.pendingAddition && (
              <div className="py-16 text-center">
                <ShoppingBag className="mx-auto mb-4 size-9 text-muted-foreground" />
                <h3 className="text-lg">Room for your next favourite.</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your bag is empty. Find something that moves with you.
                </p>
                <Link to="/shop" onClick={cart.closeDrawer} className="btn-solid mt-7 inline-block">
                  Explore the collection
                </Link>
              </div>
            )
          )}
        </div>
        {(cart.lines.length > 0 || cart.pendingAddition) && (
          <div className="border-t border-border bg-[#fafaf7] px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-4" />
              {cart.subtotal >= 900
                ? "You've unlocked free delivery."
                : `${formatZar(Math.max(0, 900 - cart.subtotal))} away from free delivery`}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#738465] transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${Math.min(100, cart.subtotal / 9)}%` }}
              />
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatZar(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Delivery</dt>
                <dd>{shipping ? formatZar(shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-2 text-lg font-semibold">
                <dt>Total</dt>
                <dd>{formatZar(cart.subtotal + shipping)}</dd>
              </div>
            </dl>
            {busy || cart.error || !cart.lines.length ? (
              <button
                disabled
                className="mt-5 w-full rounded-lg bg-primary px-5 py-4 text-sm text-primary-foreground opacity-50"
              >
                {busy ? "Updating your bag…" : "Check your bag before checkout"}
              </button>
            ) : (
              <Link
                to="/checkout"
                onClick={cart.closeDrawer}
                className="mt-5 flex w-full items-center justify-between rounded-lg bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground"
              >
                Checkout · {formatZar(cart.subtotal + shipping)}
                <ArrowRight className="size-4" />
              </Link>
            )}
            <button
              onClick={cart.closeDrawer}
              className="mt-3 w-full py-2 text-center text-xs underline"
            >
              Continue shopping
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              VAT included · Demo store, no real charges
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
