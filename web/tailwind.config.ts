import type { Config } from "tailwindcss";

// Colour roles map to CSS variables in app/globals.css (Greenhouse 2.0 palette).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,ts}"],
  theme: {
    // Padding keys only apply to breakpoints listed in container.screens, so md/lg/xl must be listed here.
    // 2xl = 1200px of content + 2 × 3rem padding.
    container: { center: true, padding: { DEFAULT: "1rem", md: "2rem", lg: "3rem" }, screens: { md: "768px", lg: "1024px", xl: "1280px", "2xl": "1296px" } },
    extend: {
      colors: {
        page: v("page"),
        surface: v("surface"),
        sunken: v("sunken"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        accent: { DEFAULT: v("accent"), strong: v("accent-strong"), soft: v("accent-soft"), tint: v("accent-tint") },
        deep: { DEFAULT: v("deep"), ink: v("deep-ink"), muted: v("deep-muted") },
        healthy: { DEFAULT: v("healthy"), soft: v("healthy-soft") },
        early: { DEFAULT: v("early"), soft: v("early-soft") },
        late: { DEFAULT: v("late"), soft: v("late-soft") },
        info: { DEFAULT: v("info"), soft: v("info-soft") },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: { card: "20px", pill: "30px" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        scan: { "0%": { top: "8%" }, "50%": { top: "88%" }, "100%": { top: "8%" } },
      },
      animation: {
        "fade-up": "fade-up .4s ease-out both",
        "accordion-down": "accordion-down .25s ease-out",
        "accordion-up": "accordion-up .25s ease-out",
        "slide-in": "slide-in .25s ease-out",
        scan: "scan 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
