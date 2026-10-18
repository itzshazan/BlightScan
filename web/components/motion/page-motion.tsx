"use client";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

const EASE = "power3.out";
// Revealed on scroll, outside the first section
const REVEAL = ".eyebrow, h2, .lead, [data-reveal]";
// Revealed on scroll in staggered batches
const ITEMS = ".card, [data-reveal-item]";

/**
 * Entrance and scroll animations for the public pages. Pages opt in through classes they already use
 * (.eyebrow, h1, h2, .lead, .card) plus a few data attributes:
 *   data-intro="text|photo|dot|line|loupe|label"  part of the first-screen entrance
 *   data-reveal / data-reveal="scale"              fade up (or scale up) when scrolled into view
 *   data-reveal-item                               like .card: staggered with its neighbours
 *   data-count="54,306"                            number counts up to this value
 *   data-parallax                                  drifts slightly while scrolling past
 * First-screen elements start hidden via the `.motion` rule in globals.css, so they don't flash before this runs.
 */
export function PageMotion() {
  const pathname = usePathname();

  useGSAP(
    () => {
      window.__motionReady = true;
      const root = document.querySelector<HTMLElement>("[data-motion]");
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        document.documentElement.classList.remove("motion");
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = root.querySelector<HTMLElement>(":scope > section:first-child");
        const nested = (el: Element) => !!el.parentElement?.closest("[data-reveal]");
        const inIntro = (el: Element) => !!intro?.contains(el);
        const q = (sel: string) => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(sel));

        // 1 · First screen: heading line by line, then the supporting text
        const h1 = intro?.querySelector<HTMLElement>("h1");
        if (h1) {
          gsap.set(h1, { autoAlpha: 1 });
          SplitText.create(h1, {
            type: "lines",
            autoSplit: true,
            onSplit: (self) => gsap.fromTo(self.lines, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.1, delay: 0.05 }),
          });
        }
        const introText = [...(intro ? gsap.utils.toArray<HTMLElement>(intro.querySelectorAll(".eyebrow, .lead")) : []), ...q("[data-intro='text']")];
        if (introText.length) gsap.fromTo(introText, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.1, delay: 0.25 });

        // Home hero photo: frame opens, then the annotations arrive in reading order.
        // Dots and labels are centred with CSS translate, so x/y are never animated on them. Labels only fade:
        // scaling would freeze their -50% offset in px, which drifts if the font swaps in afterwards.
        const photo = q("[data-intro='photo']");
        if (photo.length) {
          const dots = q("[data-intro='dot']");
          gsap
            .timeline({ delay: 0.2 })
            .fromTo(photo, { autoAlpha: 0, scale: 1.06, clipPath: "inset(10% 10% 10% 10% round 28px)" }, { autoAlpha: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.4, ease: "expo.out" })
            .fromTo(dots, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.15, ease: "back.out(3)" }, 0.7)
            .fromTo(q("[data-intro='line']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.15 }, 0.9)
            .fromTo(q("[data-intro='loupe']"), { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: "back.out(1.5)" }, 1)
            .fromTo(q("[data-intro='label']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.12 }, 1.4)
            .to(dots, { scale: 1.3, duration: 1.1, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }

        // 2 · Headings and blocks further down
        q(REVEAL)
          .filter((el) => !inIntro(el) && !nested(el))
          .forEach((el) => {
            const scale = el.dataset.reveal === "scale";
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: scale ? 48 : 32, scale: scale ? 0.94 : 1 },
              { autoAlpha: 1, y: 0, scale: 1, duration: scale ? 1.1 : 0.9, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%", once: true } },
            );
          });

        // 3 · Cards and list items, staggered as they come into view together
        const items = q(ITEMS).filter((el) => !inIntro(el) && !nested(el));
        if (items.length) {
          gsap.set(items, { autoAlpha: 0, y: 40 });
          ScrollTrigger.batch(items, {
            start: "top 90%",
            once: true,
            // A jump (anchor link, fast scroll) also batches everything skipped past; show those at once
            // so the stagger is spent only on what's on screen.
            onEnter: (batch) => {
              const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
              const onScreen = batch.filter((el) => !passed.includes(el));
              if (passed.length) gsap.set(passed, { autoAlpha: 1, y: 0, overwrite: true });
              if (onScreen.length) gsap.to(onScreen, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.12, overwrite: true });
            },
          });
        }

        // 4 · Count-up numbers, keeping any prefix/suffix and the original number format
        const restore: (() => void)[] = [];
        q("[data-count]").forEach((el) => {
          const text = el.dataset.count ?? "";
          const m = text.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
          if (!m) return;
          const [, pre, num, post] = m;
          const decimals = num.split(".")[1]?.length ?? 0;
          const fmt = (n: number) => pre + n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post;
          const counter = { n: 0 };
          el.textContent = fmt(0);
          restore.push(() => (el.textContent = text));
          gsap.to(counter, {
            n: parseFloat(num.replace(/,/g, "")),
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => (el.textContent = fmt(counter.n)),
          });
        });

        // 5 · Gentle drift on product screenshots
        q("[data-parallax]").forEach((el) => {
          gsap.fromTo(el, { y: 40 }, { y: -20, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });

        return () => restore.forEach((fn) => fn());
      });
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
