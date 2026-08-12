import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, RefreshCw, ShieldCheck, Recycle, ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Hero } from "@/components/hero";
import { bestsellers } from "@/lib/products";
import womensNavy from "@/assets/AE_Womens_Motion_Set_Navy.webp";
import mensBlack from "@/assets/AE_Motion_Shorts_Black.webp";
import heroGym from "@/assets/hero-gym.jpg";
import heroConcrete from "@/assets/hero-concrete.jpg";
import fabricHero from "@/assets/fabric-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ActiveEdge | Performance Activewear Built For Every Edge" },
      {
        name: "description",
        content:
          "ActiveEdge performance apparel: training tees, shorts, tanks and sets engineered for every session. Free courier over R900, 30-day returns.",
      },
      { property: "og:title", content: "ActiveEdge | Performance Activewear" },
      {
        property: "og:description",
        content: "Move better. Live better. Performance apparel built for every edge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const marquee = [
  "Move better. Live better.",
  "Free courier over R900",
  "Sweat-tested fabric",
  "30-day returns",
  "Made for every edge",
];

const perks = [
  { icon: Truck, title: "Fast delivery", copy: "2–4 working days nationwide, free over R900." },
  { icon: RefreshCw, title: "30-day returns", copy: "Train in it. Not right? Send it back." },
  {
    icon: ShieldCheck,
    title: "2-year repairs",
    copy: "Free repairs on seams and zips for two years.",
  },
  { icon: Recycle, title: "Recycled fibre", copy: "78% rPET knits, low-water dye house." },
];

const index_stats = [
  { value: "4-way", label: "Stretch knit" },
  { value: "78%", label: "Recycled fibre" },
  { value: "42km", label: "Wear-tested" },
  { value: "2026", label: "Founded in CPT" },
];

function Index() {
  return (
    <div>
      <Hero />

      <div className="overflow-hidden border-y border-border bg-primary py-3 text-primary-foreground">
        <div className="marquee-track whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span
              key={i}
              className="mx-6 text-[11px] font-bold uppercase tracking-[0.28em] opacity-90"
            >
              {m} <span className="ml-6 opacity-40">/</span>
            </span>
          ))}
        </div>
      </div>

      {/* Index strip */}
      <section className="mx-auto max-w-7xl px-5 pt-16 lg:pt-24">
        <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
          {index_stats.map((s) => (
            <div key={s.label} className="bg-background p-6 lg:p-8">
              <p className="font-display text-4xl leading-none tracking-tight lg:text-5xl">
                {s.value}
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial split */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <Link
            to="/shop"
            className="group relative overflow-hidden bg-sand lg:col-span-7 lg:row-span-2"
          >
            <img
              src={mensBlack}
              alt="Man wearing ActiveEdge Motion Shorts in black"
              loading="lazy"
              className="h-[420px] w-full object-cover transition-transform duration-[900ms] group-hover:scale-105 lg:h-[680px]"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6 text-white sm:p-10">
              <p className="eyebrow opacity-70">01 — Men</p>
              <h2 className="mt-2 text-4xl sm:text-5xl">Men's training</h2>
              <p className="mt-3 max-w-sm text-sm opacity-85">
                Tees, shorts and full performance sets that move as hard as you do.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
                Shop men{" "}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </div>
          </Link>

          <Link to="/shop" className="group relative overflow-hidden bg-sand lg:col-span-5">
            <img
              src={womensNavy}
              alt="Women's Motion Set in Indigo Navy"
              loading="lazy"
              className="h-[340px] w-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
              <p className="eyebrow opacity-70">02 — Women</p>
              <h2 className="mt-2 text-3xl">Women's</h2>
              <p className="mt-2 text-sm opacity-85">Second-skin sets and squat-proof leggings.</p>
            </div>
          </Link>

          <Link
            to="/about"
            className="group relative overflow-hidden bg-primary text-primary-foreground lg:col-span-5"
          >
            <img
              src={fabricHero}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-40 transition-transform duration-[900ms] group-hover:scale-105"
            />
            <div className="relative flex h-[340px] flex-col justify-end p-6">
              <p className="eyebrow opacity-70">03 — Fabric</p>
              <h2 className="mt-2 text-3xl">The knit file</h2>
              <p className="mt-2 max-w-xs text-sm opacity-80">
                78% recycled fibre, low-water dye, bar-tacked in Cape Town.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-5 pb-16 lg:pb-24">
        <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
          <div>
            <p className="eyebrow text-muted-foreground">Most trained in</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Best sellers</h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="eyebrow opacity-60">The ActiveEdge standard</p>
            <p className="mt-6 font-display text-3xl uppercase leading-[1.05] tracking-tight sm:text-5xl">
              We don't make clothes for the{" "}
              <span className="italic opacity-50">highlight reel</span>. We make them for the 5am,
              the last set, the ugly kilometre.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img
              src={heroConcrete}
              alt="Athlete training in an ActiveEdge seamless set"
              loading="lazy"
              className="h-[320px] w-full object-cover lg:h-full"
            />
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title}>
              <p.icon className="size-5" />
              <h3 className="mt-4 text-sm">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative isolate overflow-hidden bg-black text-white">
        <img
          src={heroGym}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        <div className="relative mx-auto max-w-3xl px-5 py-28 text-center">
          <p className="eyebrow opacity-70">Move better. Live better.</p>
          <h2 className="mt-5 text-5xl sm:text-7xl">Built for every edge</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm opacity-80">
            Every ActiveEdge piece is sweat-tested on the road, in the gym and on the trail before
            it ever reaches you.
          </p>
          <Link
            to="/shop"
            className="btn-solid mt-9 bg-white !px-10 !py-4 text-black hover:opacity-90"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      <div className="overflow-hidden border-t border-border bg-background py-4">
        <div className="marquee-reverse whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span
              key={i}
              className="mx-6 text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground"
            >
              {m} <span className="ml-6 opacity-40">/</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
