import Image from "next/image";
import { heroPhoto } from "@/lib/photos";

// Field-guide treatment: the photo, a magnified inset of one lesion, and a label on the yellow halo.
//
// Coordinates are % of the 4:5 frame. The 2:3 photo is cropped equally top and bottom, so photo
// (x, y) px maps to (x / 1024, (1.5 * y / 1536 - 0.125) / 1.25). Re-measure if hero.webp changes.
const RINGS = { x: 66.2, y: 61.1 }; // ringed lesion, photo (678, 910)
const HALO = { x: 50, y: 70 }; // yellow tissue between lesions
const HALO_LABEL = { x: 18, y: 86 };

// Magnifier: a circle 36% of the frame width, top-right, showing RINGS at ZOOM×.
// Background maths: to put image point u at the circle's centre with the image S× the circle's size,
// background-position = (0.5 − u·S) / (1 − S). Height of the photo is 1.5 × its width.
const LOUPE = { left: 58, top: 5, size: 36 };
const ZOOM = 2.2;
const S = ZOOM / (LOUPE.size / 100); // photo width ÷ circle width
const u = { x: 678 / 1024, y: 910 / 1536 }; // RINGS in photo fractions (uncropped)
const bgPos = (frac: number, scale: number) => `${(((0.5 - frac * scale) / (1 - scale)) * 100).toFixed(1)}%`;
const loupeBottomY = LOUPE.top + LOUPE.size / 1.25; // % of frame height (the frame is 1.25× taller than wide)

export function HeroVisual() {
  return (
    // Width is capped so the 4:5 photo's height never exceeds the screen below the navbar (100svh − 11rem).
    // lg+: flush right so the photo lines up with the navbar's right edge.
    <figure className="relative mx-auto w-full max-w-[min(480px,calc((100svh_-_11rem)_*_0.8))] lg:mr-0">
      {/* data-intro parts are animated in by components/motion/page-motion.tsx */}
      <div data-intro="photo" className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-sunken">
        <Image
          src={heroPhoto.src}
          alt={heroPhoto.alt}
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-cover object-[40%_50%]"
        />

        {/* Leader lines. viewBox matches the 4:5 frame: x in % of width, y in % of height × 1.25. */}
        <svg viewBox="0 0 100 125" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <line data-intro="line" x1={LOUPE.left + LOUPE.size / 2} y1={(loupeBottomY + 3) * 1.25} x2={RINGS.x} y2={RINGS.y * 1.25} stroke="white" strokeOpacity="0.9" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          <line data-intro="line" x1={HALO.x} y1={HALO.y * 1.25} x2={HALO_LABEL.x} y2={HALO_LABEL.y * 1.25} stroke="white" strokeOpacity="0.9" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        </svg>

        {[RINGS, HALO].map((p) => (
          <span
            key={`${p.x}-${p.y}`}
            data-intro="dot"
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(3,28,23,.35)]"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-hidden
          />
        ))}

        {/* Magnified lesion */}
        <div
          data-intro="loupe"
          className="absolute aspect-square rounded-full border-[3px] border-white bg-sunken shadow-[0_8px_24px_rgba(3,28,23,.35)]"
          style={{
            left: `${LOUPE.left}%`,
            top: `${LOUPE.top}%`,
            width: `${LOUPE.size}%`,
            backgroundImage: `url(${heroPhoto.src.src})`,
            backgroundSize: `${(S * 100).toFixed(1)}% auto`,
            backgroundPosition: `${bgPos(u.x, S)} ${bgPos(u.y, S * 1.5)}`,
          }}
          role="img"
          aria-label={`Close-up of an early blight lesion, magnified ${ZOOM} times, showing concentric rings`}
        />
        <span
          data-intro="label"
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-deep/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          style={{ left: `${LOUPE.left + LOUPE.size / 2}%`, top: `${loupeBottomY}%` }}
        >
          Concentric rings · {ZOOM}×
        </span>

        <span
          data-intro="label"
          className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-deep/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          style={{ left: `${HALO_LABEL.x}%`, top: `${HALO_LABEL.y}%` }}
        >
          Yellow halo
        </span>
      </div>
      <figcaption className="sr-only">Early blight on a lower tomato leaflet: concentric rings inside each spot and a yellow halo around it.</figcaption>
    </figure>
  );
}
