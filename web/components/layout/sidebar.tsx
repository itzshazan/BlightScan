"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Camera, ChevronsLeft, History, LayoutDashboard, Map, MapPinned, RotateCcw, Settings, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { resetDemo } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}
import { toast } from "sonner";

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: Camera, exact: true },
  { href: "/history", label: "Scan History", icon: History },
  { href: "/fields", label: "My Fields", icon: MapPinned },
  { href: "/spread-map", label: "Spread Risk Map", icon: Map },
  { href: "/diseases", label: "Disease Library", icon: BookOpen },
  { href: "/profile", label: "Settings", icon: Settings },
];

const MOBILE: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan", icon: Camera, exact: true },
  { href: "/history", label: "History", icon: History },
  { href: "/fields", label: "Fields", icon: MapPinned },
  { href: "/profile", label: "Profile", icon: User },
];

const active = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/history" && pathname.startsWith("/scan/"));

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("bs-sidebar") === "1");
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("bs-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  const staff = user?.role === "admin" || user?.role === "expert";
  const items = staff ? [...ITEMS, { href: user.role === "admin" ? "/admin" : "/admin/scans", label: "Admin", icon: ShieldCheck }] : ITEMS;

  return (
    <aside
      className={cn(
        "sticky top-[72px] hidden h-[calc(100vh-72px)] shrink-0 flex-col border-r border-line/10 bg-page px-3 py-5 transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      <nav className="flex flex-col gap-0.5" aria-label="App">
        {items.map((item) => {
          const on = active(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink",
                on && "bg-accent-soft text-ink hover:bg-accent-soft",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-[19px] w-[19px] shrink-0", on && "text-accent")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        {!collapsed && !supabaseEnabled && (
          <div className="rounded-2xl bg-sunken p-4 text-sm">
            <p className="font-medium">Demo data</p>
            <p className="mt-1 text-muted">Stored in this browser until Supabase is connected.</p>
            <button
              onClick={() => {
                resetDemo();
                toast.success("Demo data reset");
              }}
              className="mt-3 inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
            </button>
          </div>
        )}
        <button
          onClick={toggle}
          className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-ink/5", collapsed && "justify-center px-0")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft className={cn("h-[18px] w-[18px] transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line/10 bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="App">
      {MOBILE.map((item) => {
        const on = active(pathname, item);
        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted", on && "text-accent")}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
