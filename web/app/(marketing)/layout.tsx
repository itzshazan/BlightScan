import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageMotion } from "@/components/motion/page-motion";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" data-motion>
        {children}
      </main>
      <PageMotion />
      <Footer />
    </>
  );
}
