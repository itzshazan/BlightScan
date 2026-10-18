"use client";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/** Primary CTA that goes to /scan when signed in, otherwise /signup (spec 4.1). */
export function ScanCTA({
  children = "Start Free Scan",
  variant = "accent",
  size = "lg",
  className,
}: {
  children?: ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const { user } = useAuth();
  return (
    <Button href={user ? "/scan" : "/signup"} variant={variant} size={size} className={className}>
      {children}
    </Button>
  );
}
