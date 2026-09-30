import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminSales } from "@/server/admin";
import "@/sales.css";
export function AdminSales() {
  const { user } = useAuth();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const query = useQuery({
    queryKey: ["admin-sales", user?.id, days],
    queryFn: () => adminSales({ data: { days } }),
    refetchInterval: 30000,
  });
  const sales = query.data;
  const money = (cents: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
  const peak = Math.max(1, ...(sales?.daily.map((day) => day.cents) ?? []));
  return (
    <section aria-label="Sales reporting">
      <div className="ops-section-heading">
        <h2>Sales overview</h2>
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
        Simulated sales only · No real money collected. Includes paid orders through delivery;
        excludes unpaid, cancelled and refunded orders.
      </p>
      <div className="sales-periods" aria-label="Sales date range">
        {([7, 30, 90] as const).map((n) => (
          <button key={n} aria-pressed={days === n} onClick={() => setDays(n)}>
            Last {n} days
          </button>
        ))}
      </div>
      {query.isPending ? (
        <p role="status">Loading sales…</p>
      ) : query.isError ? (
        <p role="alert">Sales could not load. Please refresh to retry.</p>
      ) : (
        sales && (
          <>
            <div className="sales-metrics">
              {[
                ["Simulated sales", money(sales.total), "Order totals including VAT and delivery"],
                ["Paid orders", String(sales.orders), "Successfully completed demo checkouts"],
                ["Average order", money(sales.average), "Average total per paid order"],
                ["Delivery charges", money(sales.shipping), "Included in the sales total"],
              ].map(([label, value, hint]) => (
                <div className="sales-metric" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{hint}</small>
                </div>
              ))}
            </div>
            <div className="sales-chart">
              <h3>Daily sales</h3>
              <p>By order date · South Africa time · Includes today</p>
              {sales.orders === 0 ? (
                <div className="sales-empty">
                  No paid demo orders in this period. Complete a demo checkout to see sales here.
                </div>
              ) : (
                <>
                  <div
                    className="sales-bars"
                    role="img"
                    aria-label={`Daily simulated sales for the last ${days} days. Total ${money(sales.total)}. Exact values are in the table below.`}
                  >
                    {sales.daily.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.date}: ${money(day.cents)} · ${day.orders} orders`}
                      >
                        <span style={{ height: `${(day.cents / peak) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="sales-axis">
                    <span>{sales.daily[0]?.date}</span>
                    <span>{sales.daily.at(-1)?.date}</span>
                  </div>
                  <details className="sales-details">
                    <summary>View daily figures</summary>
                    <div className="sales-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Paid orders</th>
                            <th>Simulated sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...sales.daily].reverse().map((day) => (
                            <tr key={day.date}>
                              <td>{day.date}</td>
                              <td>{day.orders}</td>
                              <td>{money(day.cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              )}
            </div>
            <p className="ops-hint">
              Updated{" "}
              {new Date(sales.updatedAt).toLocaleTimeString("en-ZA", {
                timeZone: "Africa/Johannesburg",
              })}{" "}
              SAST · Refreshes every 30 seconds.
            </p>
          </>
        )
      )}
    </section>
  );
}
