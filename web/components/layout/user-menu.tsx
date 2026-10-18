"use client";
import { useRouter } from "next/navigation";
import { History, LogOut, MapPinned, Settings, ShieldCheck } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown";
import { useAuth } from "@/lib/auth";
import { useDB } from "@/lib/store";

export function Avatar({ name, src, className = "h-10 w-10 text-sm" }: { name?: string; src?: string | null; className?: string }) {
  const initials = (name || "?")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${className} rounded-full object-cover`} />;
  return <span className={`${className} grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-ink`}>{initials}</span>;
}

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const db = useDB();
  const profile = db?.profile;
  const staff = user?.role === "admin" || user?.role === "expert";

  const go = (href: string) => router.push(href);

  return (
    <Menu>
      <MenuTrigger className="rounded-full focus-visible:outline-2" aria-label="Account menu">
        <Avatar name={profile?.full_name} src={profile?.avatar_url} />
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>
          <span className="block text-[15px] font-medium text-ink">{profile?.full_name ?? "…"}</span>
          <span className="block">{profile?.email}</span>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem onSelect={() => go("/profile")}>
          <Settings className="h-4 w-4" /> Profile
        </MenuItem>
        <MenuItem onSelect={() => go("/fields")}>
          <MapPinned className="h-4 w-4" /> My Fields
        </MenuItem>
        <MenuItem onSelect={() => go("/history")}>
          <History className="h-4 w-4" /> Scan History
        </MenuItem>
        {staff && (
          <MenuItem onSelect={() => go(user?.role === "admin" ? "/admin" : "/admin/scans")}>
            <ShieldCheck className="h-4 w-4" /> Admin Panel
          </MenuItem>
        )}
        <MenuSeparator />
        <MenuItem
          onSelect={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="h-4 w-4" /> Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
