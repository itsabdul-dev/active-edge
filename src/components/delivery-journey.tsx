import { Home, Package, Truck, Check, ArrowUpRight } from "lucide-react";
import { deliverySteps } from "@/lib/tracking";
const points = [
  [80, 190],
  [240, 110],
  [400, 190],
  [560, 110],
  [720, 190],
] as const;
const road = "M80 190 C160 190 160 110 240 110 S320 190 400 190 S480 110 560 110 S640 190 720 190";
export function DeliveryJourney({
  current,
  city,
  isDemo,
}: {
  current: number;
  city: string;
  isDemo: boolean;
}) {
  const point = points[Math.max(0, Math.min(4, current))]!;
  const moving = current === 2 || current === 3;
  return (
    <section className="journey-card" aria-label="Delivery journey">
      <div className="journey-top">
        <span className="journey-label">
          <span className={moving ? "journey-status-dot moving" : "journey-status-dot"} />
          {current === 4
            ? "Journey complete"
            : current < 0
              ? "Awaiting fulfilment"
              : "Your delivery journey"}
        </span>
        <span className="journey-demo">{isDemo ? "SIMULATED ROUTE" : "ILLUSTRATED ROUTE"}</span>
      </div>
      <div className="journey-map" aria-hidden="true">
        <svg viewBox="0 0 800 300" fill="none">
          <defs>
            <pattern id="journey-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="#dce4d5" strokeWidth=".7" />
            </pattern>
          </defs>
          <rect width="800" height="300" fill="url(#journey-grid)" />
          <path
            d="M0 245C170 265 245 195 360 240S630 285 800 215"
            stroke="#dae5d8"
            strokeWidth="28"
          />
          <g fill="#e2e8db" stroke="#d0d9c8">
            <rect x="90" y="55" width="74" height="44" rx="12" />
            <rect x="295" y="24" width="100" height="53" rx="12" />
            <rect x="460" y="38" width="38" height="55" rx="10" />
            <rect x="626" y="45" width="93" height="37" rx="12" />
            <rect x="265" y="220" width="65" height="48" rx="12" />
            <rect x="520" y="228" width="90" height="45" rx="12" />
          </g>
          <g fill="#c2d2b3">
            <circle cx="195" cy="245" r="12" />
            <circle cx="212" cy="263" r="8" />
            <circle cx="650" cy="178" r="12" />
            <circle cx="674" cy="160" r="9" />
          </g>
          <path d={road} stroke="white" strokeWidth="22" strokeLinecap="round" />
          <path d={road} stroke="#cbd6c1" strokeWidth="3" strokeDasharray="4 8" />
          <path
            className="journey-road-progress"
            d={road}
            stroke="#59734a"
            strokeWidth="5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - Math.max(0, current) * 25}
          />
          {points.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="7"
              fill={i <= current ? "#59734a" : "#fff"}
              stroke={i <= current ? "#59734a" : "#cbd6c1"}
              strokeWidth="3"
            />
          ))}
          <g
            className="journey-vehicle"
            style={{ transform: `translate(${point[0]}px, ${point[1]}px)` }}
          >
            <circle
              className={moving ? "journey-beacon" : ""}
              r="27"
              fill="#59734a"
              opacity=".15"
            />
            <circle r="20" fill="#263b22" stroke="white" strokeWidth="3" />
            {current === 4 ? (
              <Check x={-10} y={-10} size={20} stroke="white" />
            ) : moving ? (
              <Truck x={-10} y={-10} size={20} stroke="white" />
            ) : (
              <Package x={-10} y={-10} size={20} stroke="white" />
            )}
          </g>
        </svg>
      </div>
      <div className="journey-endpoints">
        <div>
          <Package size={17} />
          <span>
            <small>FROM</small>ActiveEdge studio
          </span>
        </div>
        <ArrowUpRight size={19} />
        <div>
          <Home size={17} />
          <span>
            <small>TO</small>
            {city}
          </span>
        </div>
      </div>
      <div className="journey-next">
        <span>
          {current === 4
            ? "Delivered with care"
            : current < 0
              ? "We’re waiting for confirmation"
              : `Up next: ${deliverySteps[current + 1]?.label ?? "Delivery"}`}
        </span>
        <small>Illustration only · No live location</small>
      </div>
    </section>
  );
}
