import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, RotateCcw, Ruler, CreditCard } from "lucide-react";

const faqs = [
  {
    q: "How long does delivery take in South Africa?",
    a: "Main centres (Cape Town, Johannesburg, Pretoria, Durban, Gqeberha) get orders in 2–3 working days. Outlying areas take 3–5 working days. Courier is free on orders over R900, otherwise a flat R85 countrywide.",
  },
  {
    q: "Can I return or exchange an item?",
    a: "Yes — 30 days from delivery, unworn with tags on. Exchanges for a different size are free countrywide; refunds go back to your original payment method within 5 working days of us receiving the parcel.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Visa and Mastercard, instant EFT (Ozow), SnapScan and Payflex — pay in 4 interest-free instalments on any order.",
  },
  {
    q: "Are prices in Rand and do they include VAT?",
    a: "Every price on the site is in ZAR and includes 15% VAT. No customs, no import duties, no surprise fees at checkout.",
  },
  {
    q: "Where is ActiveEdge made?",
    a: "Designed in Cape Town and cut and sewn by partner factories audited for fair wages and safe hours. Our knits are 78% recycled rPET dyed in a low-water dye house.",
  },
  {
    q: "How do I care for the fabric?",
    a: "Cold machine wash inside out with like colours, no fabric softener, hang to dry out of direct sun. Softener clogs the wicking channels — skip it and the kit lasts seasons longer.",
  },
];

const sizeRows = [
  { size: "XS", chest: "84–88", waist: "64–68", hip: "88–92" },
  { size: "S", chest: "89–94", waist: "69–74", hip: "93–98" },
  { size: "M", chest: "95–100", waist: "75–80", hip: "99–104" },
  { size: "L", chest: "101–107", waist: "81–87", hip: "105–111" },
  { size: "XL", chest: "108–114", waist: "88–94", hip: "112–118" },
  { size: "XXL", chest: "115–122", waist: "95–102", hip: "119–126" },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Delivery, Returns & Size Guide | ActiveEdge" },
      {
        name: "description",
        content:
          "ActiveEdge delivery times across South Africa, 30-day returns, payment options including Payflex and Ozow, plus a full cm size guide.",
      },
      { property: "og:title", content: "Delivery, Returns & Size Guide | ActiveEdge" },
      {
        property: "og:description",
        content:
          "Everything about ActiveEdge delivery, returns, payments and sizing in South Africa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

const helpCards = [
  { icon: Truck, title: "Free over R900", copy: "Flat R85 below that, 2–3 days to main centres." },
  { icon: RotateCcw, title: "30-day returns", copy: "Free size exchanges anywhere in SA." },
  { icon: CreditCard, title: "Pay in 4", copy: "Payflex, Ozow EFT, SnapScan, Visa & Mastercard." },
  { icon: Ruler, title: "True to size", copy: "Between sizes? Size down for compression fits." },
];

function FaqPage() {
  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:py-24">
          <p className="eyebrow opacity-60">Help centre</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[0.95] sm:text-6xl">
            Delivery, returns &amp; sizing
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed opacity-70">
            Straight answers, no fine print. Everything below applies to every order shipped inside
            South Africa.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {helpCards.map((c) => (
            <div key={c.title} className="bg-background px-5 py-8">
              <c.icon className="size-5" />
              <p className="mt-4 font-display text-sm uppercase tracking-tight">{c.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{c.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-16 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <section>
          <h2 className="text-2xl sm:text-3xl">Questions</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-sm uppercase tracking-tight">
                  {f.q}
                  <span className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="size-guide" className="scroll-mt-24">
          <h2 className="text-2xl sm:text-3xl">Size guide</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            All measurements in centimetres, taken on the body, not the garment.
          </p>
          <div className="mt-8 overflow-x-auto border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand">
                <tr className="font-display text-[11px] uppercase tracking-[0.16em]">
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest</th>
                  <th className="px-4 py-3">Waist</th>
                  <th className="px-4 py-3">Hip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sizeRows.map((r) => (
                  <tr key={r.size}>
                    <td className="px-4 py-3 font-semibold">{r.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.chest}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.waist}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Compression pieces (Halo Bra, Stride Set) run snug by design. Hoodies and joggers are
            cut relaxed — take your everyday size.
          </p>
          <Link to="/shop" className="btn-solid mt-8 inline-flex">
            Shop the collection
          </Link>
        </section>
      </div>
    </div>
  );
}
