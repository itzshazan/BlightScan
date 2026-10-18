import { Besley, Figtree } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";

// Harvest pairs Besley (display serif) with Muoto (grotesk). Figtree is the closest free grotesk.
const serif = Besley({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-serif", display: "swap" });
const sans = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: { default: "BlightScan: tomato blight detection", template: "%s · BlightScan" },
  description: "Snap a tomato leaf photo. Get a Healthy / Early Blight / Late Blight diagnosis and a 7-day spread forecast for your field.",
};

export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fcfaf9" }, { media: "(prefers-color-scheme: dark)", color: "#031c17" }] };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable}`}>
      <head>
        {/* Lets globals.css hide first-screen elements until the GSAP entrance runs (components/motion/page-motion.tsx).
            Skipped for reduced motion; if the animation code never starts, everything is shown after 4 s. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.classList.add("motion");setTimeout(function(){if(!window.__motionReady)d.classList.remove("motion")},4000)})()`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
