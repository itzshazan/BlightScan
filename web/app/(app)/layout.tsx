import { Navbar } from "@/components/layout/navbar";
import { Sidebar, MobileTabBar } from "@/components/layout/sidebar";
import { BottomBar } from "@/components/layout/footer";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar app />
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main id="main" className="mx-auto max-w-[1180px] px-4 pb-28 pt-8 md:px-8 md:pb-12">
            {children}
          </main>
          <div className="mx-auto max-w-[1180px] border-t border-line/10 px-4 text-muted md:px-8">
            <BottomBar className="pb-24 md:pb-6" />
          </div>
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
