import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import heroRun from "@/assets/hero-night-run.jpg";
import heroConcrete from "@/assets/hero-concrete.jpg";
import heroGym from "@/assets/hero-gym.jpg";

const slides = [
  {
    src: heroRun,
    alt: "Runner sprinting on a rain-slicked city street at night in ActiveEdge kit",
    kicker: "Chapter 01 — Road",
    line1: "Move",
    line2: "better",
    copy: "Wet streets, cold air, zero excuses. Engineered for the miles nobody sees.",
  },
  {
    src: heroConcrete,
    alt: "Athlete lunging in a concrete studio wearing ActiveEdge seamless set",
    kicker: "Chapter 02 — Studio",
    line1: "Live",
    line2: "better",
    copy: "Second-skin seamless knits that hold their shape through every rep.",
  },
  {
    src: heroGym,
    alt: "Two athletes training with kettlebells in a dark gym in ActiveEdge apparel",
    kicker: "Chapter 03 — Iron",
    line1: "Every",
    line2: "edge",
    copy: "Sweat-tested under load. Built to be trained in, not looked at.",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(id);
  }, [index]);

  const active = slides[index] ?? slides[0]!;

  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <div className="relative h-[86svh] min-h-[560px] w-full lg:h-[92svh]">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            width={1920}
            height={1088}
            fetchPriority={i === 0 ? "high" : "low"}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-out ${
              i === index ? "opacity-100 ae-kenburns" : "opacity-0"
            }`}
          />
        ))}

        {/* cinematic grading */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,transparent,rgba(0,0,0,0.75))]" />

        {/* vertical rule + chapter */}
        <div className="pointer-events-none absolute inset-y-0 left-5 hidden w-px bg-white/15 lg:block" />
        <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 lg:block">
          <span
            key={active.kicker}
            className="ae-fade-up block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.42em] text-white/60 [writing-mode:vertical-rl]"
          >
            {active.kicker}
          </span>
        </div>

        <div className="relative flex h-full flex-col justify-end px-5 pb-10 sm:px-10 lg:px-20 lg:pb-16">
          <div key={index} className="ae-fade-up max-w-4xl">
            <p className="eyebrow text-white/60 lg:hidden">{active.kicker}</p>
            <h1 className="mt-3 text-[17vw] leading-[0.82] sm:text-[13vw] lg:text-[9.5vw]">
              <span className="block">{active.line1}</span>
              <span className="block text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.85)]">
                {active.line2}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75">{active.copy}</p>
          </div>

          <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="btn-solid bg-white !px-9 !py-4 text-black hover:opacity-90"
              >
                Shop the collection
              </Link>
              <Link
                to="/about"
                className="btn-outline !px-9 !py-4 text-white hover:bg-white hover:text-black"
              >
                Our fabric
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-display text-xs tracking-[0.2em] text-white/70">
                {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.src}
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className="group relative h-[3px] w-12 overflow-hidden bg-white/25"
                  >
                    <span
                      className={`absolute inset-y-0 left-0 bg-white ${
                        i === index ? "ae-progress" : "w-0"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
