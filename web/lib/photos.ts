// Site photography. Originals (PNG) live in /assets/source-images; these WebP copies are what ships.
// All are AI-generated illustrations of typical symptoms, checked against extension references.
import type { StaticImageData } from "next/image";
import type { DiseaseLabel } from "./types";
import hero from "@/public/images/hero.webp";
import authPanel from "@/public/images/auth-panel.webp";
import detectHealthy from "@/public/images/detect-healthy.webp";
import detectEarly from "@/public/images/detect-early-blight.webp";
import detectLate from "@/public/images/detect-late-blight.webp";
import early1 from "@/public/images/early-blight-1.webp";
import early2 from "@/public/images/early-blight-2.webp";
import early3 from "@/public/images/early-blight-3.webp";
import late1 from "@/public/images/late-blight-1.webp";
import late2 from "@/public/images/late-blight-2.webp";
import late3 from "@/public/images/late-blight-3.webp";

export interface Photo {
  src: StaticImageData;
  alt: string;
}

export const heroPhoto: Photo = {
  src: hero,
  alt: "A farmer holding a tomato leaf with early blight spots in a staked tomato field",
};

export const authPhoto: Photo = { src: authPanel, alt: "Rows of staked tomato plants under an overcast sky" };

/** One representative photo per class (home "What we detect", library cards, related-disease links). */
export const classPhoto: Record<DiseaseLabel, Photo> = {
  healthy: { src: detectHealthy, alt: "A healthy tomato leaf with even green leaflets" },
  early_blight: { src: detectEarly, alt: "A lower tomato leaf with ringed brown early blight spots and yellow halos" },
  late_blight: { src: detectLate, alt: "A wet tomato leaf with dark late blight lesions spreading from the edges" },
};

/** Disease page galleries: one large, two small. */
export const galleryPhotos: Record<string, [Photo, Photo, Photo]> = {
  "early-blight": [
    { src: early1, alt: "Early blight on the lower leaves of a staked tomato plant while the upper leaves stay green" },
    { src: early2, alt: "Close-up of an early blight lesion with concentric target rings and a yellow halo" },
    { src: early3, alt: "A green tomato with a dark ringed early blight lesion at the stem end" },
  ],
  "late-blight": [
    { src: late1, alt: "A tomato plant collapsing from late blight in a misty field" },
    { src: late2, alt: "White fuzzy late blight growth on the underside of a tomato leaflet" },
    { src: late3, alt: "A green tomato with a greasy brown late blight blotch" },
  ],
};

// Real screenshots of the app in demo mode (regenerate after UI changes; see scratch script product.js).
import shotDiagnose from "@/public/images/product/diagnose.webp";
import shotTreat from "@/public/images/product/treat.webp";
import shotForecast from "@/public/images/product/forecast.webp";
import shotMap from "@/public/images/product/map.webp";
import shotHistory from "@/public/images/product/history.webp";

export const productShots = {
  diagnose: { src: shotDiagnose, alt: "BlightScan result page: Early Blight at 91.4% confidence with class probabilities" },
  treat: { src: shotTreat, alt: "Recommended next steps with organic and chemical options" },
  forecast: { src: shotForecast, alt: "7-day spread-risk chart with daily temperature, humidity and rain" },
  map: { src: shotMap, alt: "Spread risk map with fields coloured by risk" },
  history: { src: shotHistory, alt: "Scan history table with photos, results and confidence" },
} satisfies Record<string, Photo>;
