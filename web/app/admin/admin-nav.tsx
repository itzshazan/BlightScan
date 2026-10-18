"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Gauge, Inbox, ScanSearch, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: Gauge, admin: true },
  { href: "/admin/users", label: "Users", icon: Users, admin: true },
  { href: "/admin/scans", label: "Scan Review", icon: ScanSearch },
  { href: "/admin/messages", label: "Messages", icon: Inbox, admin: true },
];

export function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = ITEMS.filter((i) => user?.role === "admin" || !i.admin);
  return (
    <aside className="border-b border-line/10 bg-page md:sticky md:top-[72px] md:h-[calc(100vh-72px)] md:w-[240px] md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:py-5">
        <p className="hidden px-3 pb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted md:block">{user?.role === "expert" ? "Expert" : "Admin"}</p>
        {items.map((i) => {
          const on = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={cn("flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink/75 hover:bg-ink/5", on && "bg-accent-soft text-ink hover:bg-accent-soft")}>
              <i.icon className={cn("h-[19px] w-[19px]", on && "text-accent")} /> {i.label}
            </Link>
          );
        })}
        <Link href="/dashboard" className="flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] text-muted hover:bg-ink/5 md:mt-6">
          <ArrowLeft className="h-[19px] w-[19px]" /> Back to app
        </Link>
      </div>
    </aside>
  );
}
