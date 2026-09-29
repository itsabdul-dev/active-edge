import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Boxes, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminAccess, adminOrders, adminInventory, advanceOrder, setStock } from "@/server/admin";
import { deliveryStage, deliverySteps } from "@/lib/tracking";
import { formatZar } from "@/lib/products";
import "@/operations.css";
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store management | ActiveEdge" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});
function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"orders" | "stock">("orders");
  const access = useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: () => adminAccess(),
    enabled: !loading && !!user,
    retry: false,
  });
  if (loading || (user && access.isPending))
    return (
      <div className="ops-shell" role="status">
        Checking store access…
      </div>
    );
  if (!user || !access.data)
    return (
      <div className="ops-shell">
        <span className="ops-eyebrow">Store management</span>
        <h1>For the team.</h1>
        <p>Sign in with your authorised ActiveEdge admin account to manage the store.</p>
        <Link className="ops-button" to="/account">
          Go to sign in
        </Link>
        {access.isError && <p role="alert">Access could not be checked. Refresh to retry.</p>}
      </div>
    );
  return (
    <div className="ops-shell">
      <div className="ops-heading">
        <div>
          <span className="ops-eyebrow">
            <ShieldCheck size={14} /> ActiveEdge studio
          </span>
          <h1>Behind every delivery.</h1>
          <p>Manage your orders and keep the collection ready to move.</p>
        </div>
        <Link to="/account" className="ops-link">
          My account <ArrowRight size={16} />
        </Link>
      </div>
      <div className="ops-tabs" aria-label="Admin sections">
        <button aria-pressed={tab === "orders"} onClick={() => setTab("orders")}>
          <Package size={18} />
          Orders
        </button>
        <button aria-pressed={tab === "stock"} onClick={() => setTab("stock")}>
          <Boxes size={18} />
          Inventory
        </button>
      </div>
      {tab === "orders" ? <Orders key={user.id} /> : <Inventory key={user.id} />}
    </div>
  );
}
type Order = Awaited<ReturnType<typeof adminOrders>>["orders"][number];
function Orders() {
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["admin-orders", user?.id, page],
    queryFn: () => adminOrders({ data: { page } }),
    refetchInterval: 15000,
  });
  return (
    <section>
      <div className="ops-section-heading">
        <h2>
          Orders <span>{query.data?.total ?? "…"}</span>
        </h2>
        <button
          className="ops-link"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      <p className="ops-hint">
        Demo fulfilment only. Status changes appear on the customer's tracking page.
      </p>
      {query.isPending ? (
        <p role="status">Loading orders…</p>
      ) : query.isError ? (
        <p role="alert">Orders could not load. Please refresh.</p>
      ) : query.data.orders.length === 0 ? (
        <div className="ops-card">No orders yet. Complete a demo checkout to get started.</div>
      ) : (
        query.data.orders.map((order) => <OrderCard key={order.order_id} order={order} />)
      )}
      <div className="ops-pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          disabled={!query.data || (page + 1) * 25 >= query.data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
function OrderCard({ order }: { order: Order }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const stage = deliveryStage(order.status, order.order_tracking_event);
  const step = deliverySteps.findIndex((s) => s.stage === stage);
  const next = step >= 0 ? deliverySteps[step + 1] : undefined;
  return (
    <details className="ops-card">
      <summary>
        <div>
          <span className="ops-eyebrow">
            {order.is_demo ? "Demo order" : "Order"} ·{" "}
            {new Date(order.placed_at).toLocaleDateString("en-ZA")}
          </span>
          <h3>{order.order_number}</h3>
          <p>
            {order.first_name_snapshot} {order.last_name_snapshot}
          </p>
        </div>
        <div className="ops-order-price">
          <strong>{formatZar(order.total_cents / 100)}</strong>
          <span className="ops-badge">
            {deliverySteps[step]?.label ?? order.status.replaceAll("_", " ")}
          </span>
        </div>
      </summary>
      <div className="ops-order-detail">
        <div>
          <h4>Items</h4>
          {order.order_item.map((item, i) => (
            <p key={i}>
              {item.quantity} × {item.product_name_snapshot}
              <small>
                {item.colour_snapshot} · {item.size_snapshot}
              </small>
            </p>
          ))}
          <h4>Delivery details</h4>
          <p>
            {[
              order.unit_snapshot,
              order.street_snapshot,
              order.suburb_snapshot,
              order.city_snapshot,
              order.postal_code_snapshot,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>
            {order.email_snapshot}
            <br />
            {order.phone_snapshot}
          </p>
          {order.delivery_instructions_snapshot && (
            <p className="ops-note">{order.delivery_instructions_snapshot}</p>
          )}
          {order.shipment && (
            <p>
              Tracking: {order.shipment.tracking_number} · {order.shipment.courier}
            </p>
          )}
        </div>
        <div>
          <h4>Fulfilment</h4>
          {order.is_demo && next ? (
            <form
              key={stage}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(true);
                setNotice("");
                try {
                  await advanceOrder({
                    data: {
                      orderId: order.order_id,
                      expected: stage as "paid" | "processing" | "shipped" | "out_for_delivery",
                      stage: next.stage as
                        "processing" | "shipped" | "out_for_delivery" | "delivered",
                      tracking: String(f.get("tracking") ?? ""),
                      courier: String(f.get("courier") ?? ""),
                      message: String(f.get("message") ?? ""),
                    },
                  });
                  setNotice("Delivery updated.");
                  await client.invalidateQueries({ queryKey: ["admin-orders"] });
                } catch (err) {
                  setNotice(err instanceof Error ? err.message : "Update failed.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {next.stage === "shipped" && (
                <>
                  <label>
                    Courier
                    <input
                      name="courier"
                      required
                      maxLength={100}
                      defaultValue="ActiveEdge Demo Courier"
                    />
                  </label>
                  <label>
                    Tracking number
                    <input
                      name="tracking"
                      required
                      maxLength={100}
                      defaultValue={`TRK-${order.order_number}`}
                    />
                  </label>
                </>
              )}
              <label>
                Customer update
                <textarea name="message" required maxLength={300} defaultValue={next.description} />
              </label>
              <button className="ops-button" disabled={busy}>
                {busy ? "Saving…" : `Mark as ${next.label.toLowerCase()}`}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <p>
              {stage === "delivered"
                ? "All done. This demo order has been delivered."
                : "No demo fulfilment action available for this order."}
            </p>
          )}
          {notice && (
            <p role="status" className="ops-note">
              {notice}
            </p>
          )}
          <ol className="ops-history">
            {[...order.order_tracking_event]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((event) => (
                <li key={event.stage}>
                  <strong>{event.message}</strong>
                  <small>{new Date(event.created_at).toLocaleString("en-ZA")}</small>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </details>
  );
}
function Inventory() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin-inventory", user?.id],
    queryFn: () => adminInventory(),
  });
  const rows =
    query.data?.filter((r) =>
      `${r.sku} ${r.product_colour?.product?.name} ${r.product_colour?.colour_name} ${r.size_code}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) ?? [];
  return (
    <section>
      <div className="ops-section-heading">
        <h2>Inventory</h2>
        <button
          className="ops-link"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      <p className="ops-hint">
        Set the total stock on hand for each colour and size. Changes are saved individually.
      </p>
      <label className="ops-search">
        Find a product, colour or SKU
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory…"
        />
      </label>
      {query.isPending ? (
        <p>Loading stock…</p>
      ) : query.isError ? (
        <p role="alert">Inventory could not load. Please refresh.</p>
      ) : (
        <div className="ops-stock-list">
          {rows.map((row) => (
            <StockRow key={`${row.variant_id}-${row.stock_on_hand}`} row={row} />
          ))}
          {rows.length === 0 && <p>No matching products.</p>}
        </div>
      )}
    </section>
  );
}
function StockRow({ row }: { row: Awaited<ReturnType<typeof adminInventory>>[number] }) {
  const client = useQueryClient();
  const [qty, setQty] = useState(String(row.stock_on_hand)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="ops-stock-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await setStock({
            data: { variantId: row.variant_id, expected: row.stock_on_hand, quantity: Number(qty) },
          });
          await client.invalidateQueries({ queryKey: ["admin-inventory"] });
          setError("Stock saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save stock.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <strong>{row.product_colour?.product?.name}</strong>
        <small>
          {row.product_colour?.colour_name} · {row.size_code} · {row.sku}
        </small>
        {row.stock_on_hand <= 5 && (
          <span className="ops-badge">
            {row.stock_on_hand === 0 ? "Out of stock" : "Low stock"}
          </span>
        )}
      </div>
      <label>
        Stock
        <input
          aria-label={`Stock for ${row.sku}`}
          type="number"
          min={0}
          max={100000}
          step={1}
          required
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </label>
      <button
        className="ops-button"
        disabled={busy || qty === "" || Number(qty) === row.stock_on_hand}
      >
        {busy ? "Saving…" : "Save"}
      </button>
      {error && <p role="status">{error}</p>}
    </form>
  );
}
