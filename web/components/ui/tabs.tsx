"use client";
import * as T from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export const TabsContent = ({ className, ...p }: ComponentPropsWithoutRef<typeof T.Content>) => <T.Content className={cn("focus:outline-none", className)} {...p} />;

/** Segmented pill tabs (Asana product-tab pattern). */
export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof T.List>) {
  return <T.List className={cn("inline-flex flex-wrap gap-1 rounded-pill bg-sunken p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "rounded-pill px-4 py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/** Underlined tabs for settings-style pages. */
export function LineTabsList({ className, ...props }: ComponentPropsWithoutRef<typeof T.List>) {
  return <T.List className={cn("flex gap-6 overflow-x-auto border-b border-line/10", className)} {...props} />;
}

export function LineTabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 border-transparent pb-3 text-[15px] font-medium text-muted hover:text-ink data-[state=active]:border-accent data-[state=active]:text-ink",
        className
      )}
      {...props}
    />
  );
}
