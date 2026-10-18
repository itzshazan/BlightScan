"use client";
import * as M from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ children, className, align = "end" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={8}
        className={cn("z-50 min-w-[210px] rounded-2xl border border-line/10 bg-surface p-1.5 shadow-xl data-[state=open]:animate-fade-up", className)}
      >
        {children}
      </M.Content>
    </M.Portal>
  );
}

export function MenuItem({ className, danger, ...props }: ComponentPropsWithoutRef<typeof M.Item> & { danger?: boolean }) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[15px] outline-none data-[highlighted]:bg-ink/5",
        danger && "text-late",
        className
      )}
      {...props}
    />
  );
}

export const MenuSeparator = () => <M.Separator className="my-1 h-px bg-line/10" />;
export const MenuLabel = ({ children }: { children: ReactNode }) => <M.Label className="px-3 pb-1 pt-2 text-xs text-muted">{children}</M.Label>;
