import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Only allow internal paths as redirect targets (prevents open redirects). */
export function safeRedirect(path: string | null | undefined, fallback = "/dashboard") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
