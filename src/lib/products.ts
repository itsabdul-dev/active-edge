import coreTankNavy from "@/assets/AE_Core_Tank_Navy.webp";
import coreTankWhite from "@/assets/AE_Core_Tank_White.webp";
import shortsBlack from "@/assets/AE_Motion_Shorts_Black.webp";
import shortsNavy from "@/assets/AE_Motion_Shorts_Navy.png";
import teeGreen from "@/assets/AE_Perfomance_Tee_Green.webp";
import teeBlack from "@/assets/AE_Performance_Tee_Black.webp";
import setBlue from "@/assets/AE_Velocity_Men_s_Performance_Set_Blue.webp";
import setGreen from "@/assets/AE_Velocity_Men_s_Performance_Set_Green.webp";
import womensGreen from "@/assets/AE_Womens_Motion_Set_Green.webp";
import womensNavy from "@/assets/AE_Womens_Motion_Set_Navy.webp";
import womensBlack from "@/assets/AE_Womens_Motion_Set_Black.png";
import hoodieBlack from "@/assets/AE_Apex_Hoodie_Black.jpg";
import hoodieStone from "@/assets/AE_Apex_Hoodie_Stone.jpg";
import strideBlack from "@/assets/AE_Stride_Leggings_Black.jpg";
import strideSand from "@/assets/AE_Stride_Leggings_Sand.jpg";
import jacketBlack from "@/assets/AE_Slipstream_Jacket_Black.jpg";
import jacketSlate from "@/assets/AE_Slipstream_Jacket_Slate.jpg";
import cropBlack from "@/assets/AE_Ascent_Crop_Black.jpg";
import cropCream from "@/assets/AE_Ascent_Crop_Cream.jpg";
import joggerBlack from "@/assets/AE_Terrain_Jogger_Black.jpg";
import joggerOlive from "@/assets/AE_Terrain_Jogger_Olive.jpg";
import joggerStone from "@/assets/AE_Terrain_Jogger_Stone.jpg";
import haloBlack from "@/assets/AE_Halo_Bra_Black.jpg";
import haloPowder from "@/assets/AE_Halo_Bra_Powder.jpg";
import haloClay from "@/assets/AE_Halo_Bra_Clay.jpg";

export type Variant = { name: string; image: string; sizes?: { id: string; size: string; price: number; stock: number }[] };

export type Product = {
  isSet?: boolean;
  featuredRank?: number | null;
  slug: string;
  name: string;
  price: number;
  category: "Men" | "Women" | "Sets";
  tagline: string;
  description: string;
  fabric: string;
  sizes: string[];
  imageFit?: "cover" | "contain";
  variants: Variant[];
};

export const products: Product[] = [
  {
    slug: "velocity-performance-set",
    name: "Velocity Performance Set",
    price: 899,
    category: "Sets",
    tagline: "Three pieces. One kit. Built for winter road miles.",
    description:
      'A complete cold-weather running kit: quarter-zip long sleeve, lined 5" shorts and compression tights. Reflective detailing on the calf and hip keeps you visible on early Cape Town starts.',
    fabric: "Recycled polyester knit (78% rPET) with elastane, bluesign® approved dye house",
    sizes: ["S", "M", "L", "XL", "2XL"],
    imageFit: "contain",
    variants: [
      { name: "Deep Sea", image: setBlue },
      { name: "Fynbos Green", image: setGreen },
    ],
  },
  {
    slug: "womens-motion-set",
    name: "Women's Motion Set",
    price: 649,
    category: "Women",
    tagline: "Crossover waist, second-skin hold.",
    description:
      "Racerback bra and crossover high-waist leggings in our softest recycled knit. Squat-proof, sweat-wicking and completely opaque through every rep.",
    fabric: "Recycled nylon + elastane, buttery matte handfeel, OEKO-TEX® certified",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { name: "Fynbos Green", image: womensGreen },
      { name: "Indigo Navy", image: womensNavy },
      { name: "Onyx Black", image: womensBlack },
    ],
  },
  {
    slug: "performance-tee",
    name: "Performance Tee",
    price: 299,
    category: "Men",
    tagline: "Raglan sleeves, zero cling.",
    description:
      "Our everyday training tee, cut with raglan sleeves for a full overhead range of motion and a drop hem that stays put through burpees.",
    fabric: "100% recycled performance jersey spun from post-consumer bottles",
    sizes: ["S", "M", "L", "XL", "2XL"],
    variants: [
      { name: "Fynbos Green", image: teeGreen },
      { name: "Charcoal Black", image: teeBlack },
    ],
  },
  {
    slug: "motion-shorts",
    name: "Motion Shorts",
    price: 349,
    category: "Men",
    tagline: "7-inch, zip pocket, no ride-up.",
    description:
      "Lightweight woven shorts with a bonded zip pocket, side splits for stride and an internal drawcord that actually holds.",
    fabric: "Recycled ripstop woven shell with a brushed inner brief",
    sizes: ["S", "M", "L", "XL", "2XL"],
    variants: [
      { name: "Charcoal Black", image: shortsBlack },
      { name: "Indigo Navy", image: shortsNavy },
    ],
  },
  {
    slug: "core-tank",
    name: "Core Tank",
    price: 199,
    category: "Men",
    tagline: "Ribbed, close-cut, arm-day approved.",
    description:
      "A ribbed cotton-blend tank with a classic scoop and a fitted body that follows your frame without restricting the shoulder.",
    fabric: "Organic cotton rib (GOTS certified) blended with recycled elastane",
    sizes: ["S", "M", "L", "XL"],
    variants: [
      { name: "Indigo Navy", image: coreTankNavy },
      { name: "Chalk White", image: coreTankWhite },
    ],
  },
  {
    slug: "apex-training-hoodie",
    name: "Apex Training Hoodie",
    price: 549,
    category: "Men",
    tagline: "Warm-up layer that never gets in the way.",
    description:
      "A lightweight brushed-back hoodie with raglan sleeves, a kangaroo pocket and a low-bulk hood. Cut close through the body so it layers under a shell without bunching.",
    fabric: "Brushed recycled poly-elastane fleece, anti-pill face",
    sizes: ["S", "M", "L", "XL", "2XL"],
    variants: [
      { name: "Charcoal Black", image: hoodieBlack },
      { name: "Stone Grey", image: hoodieStone },
    ],
  },
  {
    slug: "stride-seamless-set",
    name: "Stride Seamless Set",
    price: 599,
    category: "Women",
    tagline: "Seamless knit. Sculpted hold. Zero seams to chafe.",
    description:
      "High-waist seamless leggings with a supportive racerback bra, knitted in one piece for a smooth, chafe-free fit through long runs and studio sessions.",
    fabric: "Circular-knit recycled nylon with elastane, OEKO-TEX® certified",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { name: "Onyx Black", image: strideBlack },
      { name: "Desert Sand", image: strideSand },
    ],
  },
  {
    slug: "slipstream-jacket",
    name: "Slipstream Jacket",
    price: 699,
    category: "Men",
    tagline: "Packs to a fist. Blocks the southeaster.",
    description:
      "A featherweight wind shell with a bonded hood, zip hand pockets and elastic cuffs. Water-repellent face fabric that packs down into its own pocket for the ride home.",
    fabric: "Recycled ripstop nylon with a PFC-free DWR finish",
    sizes: ["S", "M", "L", "XL", "2XL"],
    variants: [
      { name: "Charcoal Black", image: jacketBlack },
      { name: "Slate Blue", image: jacketSlate },
    ],
  },
  {
    slug: "ascent-crop-long-sleeve",
    name: "Ascent Crop Long Sleeve",
    price: 379,
    category: "Women",
    tagline: "Thumbholes in, sleeves down, session on.",
    description:
      "A cropped long sleeve in a smooth compressive knit with raglan seams and thumbholes. Layers cleanly over a bra top for cool morning starts.",
    fabric: "Recycled nylon-elastane compressive knit, matte finish",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { name: "Onyx Black", image: cropBlack },
      { name: "Cream", image: cropCream },
    ],
  },
  {
    slug: "terrain-cargo-jogger",
    name: "Terrain Cargo Jogger",
    price: 629,
    category: "Men",
    tagline: "Zip everything down. Train, commute, repeat.",
    description:
      "A tapered technical jogger with bonded zip hand pockets, a secure cargo pocket on the thigh and articulated knees. Four-way stretch woven that moves through squats and stays sharp off the gym floor.",
    fabric: "Recycled four-way stretch woven with a brushed inner face",
    sizes: ["S", "M", "L", "XL", "2XL"],
    variants: [
      { name: "Charcoal Black", image: joggerBlack },
      { name: "Field Olive", image: joggerOlive },
      { name: "Stone Grey", image: joggerStone },
    ],
  },
  {
    slug: "halo-training-bra",
    name: "Halo Training Bra",
    price: 329,
    category: "Women",
    tagline: "Medium-high hold with nothing digging in.",
    description:
      "A racerback training bra knitted with a wide ribbed underband and bonded edges, so there's no seam to rub under a vest. Removable cups, sweat-wicking through the longest session.",
    fabric: "Seamless recycled nylon-elastane knit, OEKO-TEX® certified",
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      { name: "Onyx Black", image: haloBlack },
      { name: "Powder Blue", image: haloPowder },
      { name: "Rose Clay", image: haloClay },
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

const bestsellerSlugs = [
  "apex-training-hoodie",
  "womens-motion-set",
  "performance-tee",
  "motion-shorts",
];

export const bestsellers = bestsellerSlugs
  .map((slug) => getProduct(slug))
  .filter((p): p is Product => Boolean(p));

export const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents);
