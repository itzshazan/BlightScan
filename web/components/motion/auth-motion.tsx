"use client";
import type { RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

const EASE = "power3.out";

/**
 * Entrance for the login / sign-up / password screens (app/(auth)/layout.tsx). Same approach as PageMotion:
 * targets start hidden via the `.motion` rules in globals.css, and the animation plays for everyone.
 *   data-intro="photo|caption|item"     parts of the photo panel, animated here
 *   [data-auth-form]                    the form column, animated by useAuthEntrance
 */
export function AuthMotion() {
  // Photo panel: once per visit. It stays mounted when switching between login and sign-up.
  useGSAP(() => {
    window.__motionReady = true;
    const aside = document.querySelector<HTMLElement>("[data-auth-aside]");
    if (!aside) return;
    const q = (sel: string) => gsap.utils.toArray<HTMLElement>(aside.querySelectorAll(sel));

    const photo = q("[data-intro='photo']");
    if (photo.length) gsap.fromTo(photo, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 2.4, ease: "power2.out" });
    const caption = aside.querySelector<HTMLElement>("[data-intro='caption']");
    if (caption) {
      gsap.set(caption, { autoAlpha: 1 });
      SplitText.create(caption, {
        type: "lines",
        autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.lines, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.12, delay: 0.5 }),
      });
    }
    const items = q("[data-intro='item']");
    if (items.length) gsap.fromTo(items, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: EASE, stagger: 0.12, delay: 0.9 });
  });

  return null;
}

/**
 * Form column entrance: contents rise in, heading line by line. Called from AuthHeading (with a ref to it)
 * rather than the layout, because pages sit in a Suspense boundary that can hydrate after the layout, and
 * splitting the heading before then breaks React's hydration.
 */
export function useAuthEntrance(ref: RefObject<HTMLElement>) {
  useGSAP(() => {
    window.__motionReady = true;
    const column = ref.current?.closest<HTMLElement>("[data-auth-form]");
    if (!column) return;
    const blocks = gsap.utils.toArray<HTMLElement>(column.children);
    const h1 = column.querySelector<HTMLElement>("h1");

    // Stagger the form's fields one by one rather than the form as a single block
    const parts = blocks.flatMap((el) => (el.tagName === "FORM" ? [...el.children] : el.contains(h1) ? [...el.children].filter((c) => c !== h1) : [el])) as HTMLElement[];
    gsap.set(blocks, { autoAlpha: 1 });
    column.dataset.ready = ""; // later content (e.g. "check your email") isn't pre-hidden

    if (h1) {
      SplitText.create(h1, {
        type: "lines",
        autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.lines, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.1 }),
      });
    }
    // Buttons have a CSS transition on transform, so they only fade; transforms are cleared afterwards
    // so their :active nudge works again.
    if (parts.length)
      gsap.fromTo(
        parts,
        { autoAlpha: 0, y: (_: number, el: HTMLElement) => (el.matches("button, a") ? 0 : 20) },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.06, delay: 0.2, clearProps: "transform" },
      );
  });
}
