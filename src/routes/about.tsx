import { createFileRoute, Link } from "@tanstack/react-router";
import { Recycle, Droplets, Factory, Package } from "lucide-react";
import fabricHero from "@/assets/fabric-hero.jpg";
import setGreen from "@/assets/AE_Velocity_Men_s_Performance_Set_Green.webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Fabric & Ethics | ActiveEdge" },
      {
        name: "description",
        content:
          "How ActiveEdge makes low-impact activewear in South Africa since 2026: recycled rPET knits, organic cotton, waterless dye and plastic-free delivery.",
      },
      { property: "og:title", content: "Our Fabric & Ethics | ActiveEdge" },
      {
        property: "og:description",
        content: "Recycled fibres, waterless dye and fair pay in a single Cape Town studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const pillars = [
  {
    icon: Recycle,
    title: "Recycled first",
    body: "78% of our fibre comes from post-consumer PET collected in Gauteng and the Western Cape. Roughly 11 bottles per performance set.",
  },
  {
    icon: Droplets,
    title: "Waterless dye",
    body: "Our dye partner uses a closed-loop CO₂ process, cutting water use per garment by 92% against conventional dyeing.",
  },
  {
    icon: Factory,
    title: "One studio",
    body: "Cut, sewn and finished in Woodstock, Cape Town. Living-wage certified, 34 machinists, no outsourcing.",
  },
  {
    icon: Package,
    title: "Plastic-free out the door",
    body: "Kraft mailers, paper tape, no polybags. Returns come back in the same mailer you received.",
  },
];

const stats = [
  { value: "2026", label: "Founded in Cape Town" },
  { value: "78%", label: "Recycled fibre content" },
  { value: "92%", label: "Less water per garment" },
  { value: "2 yrs", label: "Free repairs, every seam" },
];

const journey = [
  {
    step: "Collected",
    body: "Post-consumer bottles are baled at kerbside co-ops in Gauteng and the Western Cape.",
  },
  {
    step: "Spun",
    body: "Flake is washed, extruded and spun into a fine rPET filament with elastane for recovery.",
  },
  {
    step: "Dyed",
    body: "Colour is set in a closed-loop CO₂ chamber — no dye bath, no effluent, no rinse water.",
  },
  {
    step: "Sewn",
    body: "Flatlock seams, bar-tacked stress points, finished by hand in our Woodstock studio.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img
          src={fabricHero}
          alt="Hands stretching ActiveEdge recycled performance knit to show its rib texture"
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 lg:py-32">
          <p className="eyebrow opacity-70">Our fabric — since 2026</p>
          <h1 className="mt-5 max-w-3xl text-4xl sm:text-6xl">
            Activewear shouldn't cost the coastline it's trained on.
          </h1>
          <p className="mt-6 max-w-2xl text-sm opacity-80 sm:text-base">
            ActiveEdge started in 2026 with a simple frustration: gear that felt disposable. We
            build a small range, from recycled and organic fibre, in one South African studio — then
            we repair it free for two years.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-3xl sm:text-4xl">{s.value}</dt>
              <dd className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-x-10 gap-y-10 px-5 py-20 sm:grid-cols-2">
        {pillars.map((p, i) => (
          <div key={p.title} className="border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <p.icon className="size-4" />
              <span className="eyebrow text-clay">0{i + 1}</span>
            </div>
            <h2 className="mt-3 text-xl">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl sm:text-4xl">Bottle to bar-tack</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((j, i) => (
              <li key={j.step} className="border-t border-border pt-5">
                <span className="eyebrow text-clay">Step {i + 1}</span>
                <h3 className="mt-2 text-lg">{j.step}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{j.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2">
        <img
          src={setGreen}
          alt="ActiveEdge Velocity performance set in Fynbos Green"
          loading="lazy"
          className="w-full rounded-md bg-sand object-contain p-4"
        />
        <div>
          <p className="eyebrow text-clay">The guarantee</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Made to be worn out, not thrown out.</h2>
          <p className="mt-5 text-muted-foreground">
            Every piece carries a two-year seam and zip guarantee. Blow out a flatlock on a long run
            and we'll repair it free — post it back in the mailer it arrived in.
          </p>
          <Link to="/shop" className="btn-solid mt-8 inline-block">
            Shop the collection
          </Link>
        </div>
      </section>
    </div>
  );
}
