"use client";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="bs-theme">
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: 16 } }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
