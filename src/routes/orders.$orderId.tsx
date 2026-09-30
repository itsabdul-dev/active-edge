import { DeliveryJourney } from "@/components/delivery-journey";
import "@/tracking.css";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { trackOrder } from "@/server/tracking";
import { deliverySteps, deliveryStage } from "@/lib/tracking";
import { formatZar } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import "@/operations.css";
export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Track your order | ActiveEdge" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Tracking,
});
function Tracking() {
  const { orderId } = Route.useParams();
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["tracking", orderId, user?.id],
    queryFn: () => trackOrder({ data: { orderId } }),
    enabled: !loading,
    refetchInterval: 15000,
    retry: false,
  });
  if (loading || query.isPending)
    return (
      <div className="ops-shell" role="status">
        Finding your delivery…
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="ops-shell">
        <span className="ops-eyebrow">Order tracking</span>
        <h1>Let's find your order.</h1>
        <p role="alert">
          Sign in with the account used at checkout. Guest orders are available in the original
          checkout browser while its session is valid.
        </p>
        <Link to="/account" className="ops-button">
          Go to my account
        </Link>
        <button className="ops-link" onClick={() => void query.refetch()}>
          Try again
        </button>
      </div>
    );
  const order = query.data;
  const stage = deliveryStage(order.status, order.order_tracking_event);
  const current = deliverySteps.findIndex((s) => s.stage === stage);
  return (
    <div className="ops-shell tracking-shell">
      <Link to="/account" className="ops-link">
        <ArrowLeft size={16} />
        My account
      </Link>
      <div className="ops-heading">
        <div>
          <span className="ops-eyebrow">{order.order_number}</span>
          <h1>{stage === "delivered" ? "Made it to your door." : "Your order, every step."}</h1>
          <p>
            {order.is_demo
              ? "Simulated delivery · No physical shipment or live GPS."
              : "Delivery progress"}
          </p>
        </div>
        <button
          className="ops-link"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <DeliveryJourney current={current} city={order.city_snapshot} isDemo={order.is_demo} />
      <div className="tracking-layout">
        <section className="ops-card">
          <div className="tracking-hero" role="status" aria-live="polite">
            <div className={`tracking-icon ${stage === "out_for_delivery" ? "is-moving" : ""}`}>
              {stage === "delivered" ? (
                <Check size={30} />
              ) : stage === "shipped" || stage === "out_for_delivery" ? (
                <Truck size={30} />
              ) : (
                <Package size={30} />
              )}
            </div>
            <div>
              <span className="ops-eyebrow">Current status</span>
              <h2 key={stage} className="tracking-status-title">
                {deliverySteps[current]?.label ?? order.status.replaceAll("_", " ")}
              </h2>
              <p>{order.city_snapshot}</p>
            </div>
          </div>
          <div
            className="tracking-progress"
            role="progressbar"
            aria-label="Delivery milestones"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={Math.max(0, current)}
            aria-valuetext={deliverySteps[current]?.label ?? order.status}
          >
            <span style={{ width: `${Math.max(0, current) * 25}%` }} />
          </div>
          <ol className="tracking-timeline">
            {deliverySteps.map((step, i) => {
              const event = order.order_tracking_event.find((e) => e.stage === step.stage);
              return (
                <li
                  key={step.stage}
                  className={`${i <= current ? "is-complete" : ""} ${i === current ? "is-current" : ""}`}
                  aria-current={i === current ? "step" : undefined}
                >
                  <span className="tracking-dot">{i <= current ? <Check size={14} /> : i + 1}</span>
                  <div>
                    <h3>{step.label}</h3>
                    <p>{event?.message ?? (i <= current ? step.description : "Coming next")}</p>
                    {(event || (i === 0 && current >= 0)) && (
                      <time>
                        {new Date(event?.created_at ?? order.placed_at).toLocaleString("en-ZA")}
                      </time>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="ops-hint" role="status">
            {query.isFetching
              ? "Checking for updates…"
              : "Updates refresh automatically every 15 seconds."}
          </p>
        </section>
        <aside className="ops-card tracking-summary">
          <span className="ops-eyebrow">Packed for your next move</span>
          <h2>Your kit.</h2>
          <p className="tracking-order-number">{order.order_number}</p>
          {order.shipment ? (
            <div className="ops-note">
              <small>{order.shipment.courier}</small>
              <small>TRACKING NUMBER</small>
              <strong className="tracking-reference">{order.shipment.tracking_number}</strong>
            </div>
          ) : (
            <p className="ops-note">
              Your tracking number will appear when the order is dispatched.
            </p>
          )}
          {order.order_item.map((item, i) => (
            <div className="tracking-item" key={i}>
              <span className="tracking-item-icon" aria-hidden="true">
                <Package size={20} />
              </span>
              <strong>{item.product_name_snapshot}</strong>
              <small>
                {item.colour_snapshot} · {item.size_snapshot} · Qty {item.quantity}
              </small>
            </div>
          ))}
          <div className="tracking-total">
            <span>Order total</span>
            <strong>{formatZar(order.total_cents / 100)}</strong>
          </div>
          <Link to="/shop" className="ops-button">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
