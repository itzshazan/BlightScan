import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { AdminNav } from "./admin-nav";

// Role check happens in middleware.ts (admin, or expert → /admin/scans only).
export const metadata = { title: { default: "Admin", template: "%s · Admin · BlightScan" } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar app />
      <div className="md:flex">
        <AdminNav />
        <main id="main" className="mx-auto min-w-0 max-w-[1180px] flex-1 px-4 pb-16 pt-8 md:px-8">
          {children}
        </main>
      </div>
    </>
  );
}
