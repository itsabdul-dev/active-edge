export type SalesRow = { placed_at: string; total_cents: number; shipping_cents: number };
const dayMs = 86400000;
export function salesWindow(days: number, now = new Date()) {
  const today = new Date(now.getTime() + 7200000).toISOString().slice(0, 10);
  const start = new Date(new Date(`${today}T00:00:00+02:00`).getTime() - (days - 1) * dayMs);
  return { start: start.toISOString(), end: now.toISOString() };
}
export function summarizeSales(rows: SalesRow[], start: string, days: number) {
  const daily = Array.from({ length: days }, (_, i) => ({
    date: new Date(new Date(start).getTime() + i * dayMs + 7200000).toISOString().slice(0, 10),
    cents: 0,
    orders: 0,
  }));
  for (const row of rows) {
    const date = new Date(new Date(row.placed_at).getTime() + 7200000).toISOString().slice(0, 10);
    const day = daily.find((d) => d.date === date);
    if (day) {
      day.cents += row.total_cents;
      day.orders += 1;
    }
  }
  const total = rows.reduce((sum, row) => sum + row.total_cents, 0);
  return {
    total,
    orders: rows.length,
    average: rows.length ? Math.round(total / rows.length) : 0,
    shipping: rows.reduce((sum, row) => sum + row.shipping_cents, 0),
    daily,
  };
}
