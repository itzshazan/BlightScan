import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import mark from "@/public/brand/blightscan-mark.png";

// Brand artwork lives in assets/brand/ (light and dark lockups, icon source). The mark here is the round
// icon cut out with a transparent surround so it sits on any section colour. The wordmark is live text:
// "Blight" follows the text colour; "Scan" turns mint (#6BE7BA, from the dark lockup) on dark — in dark
// mode, inside the navbar when it's over a dark section, and wherever `light` is passed (the footer).

export function LogoMark({ className }: { className?: string }) {
  return <Image src={mark} alt="" width={32} height={32} priority className={cn("h-8 w-8 shrink-0 rounded-full", className)} />;
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="BlightScan home">
      <LogoMark />
      <span className={cn("text-[20px] leading-none tracking-[-0.035em]", light && "text-deep-ink")}>
        <span className="font-medium">Blight</span>
        <span className={cn("font-extrabold transition-colors duration-500 dark:text-[#6BE7BA] [[data-tone=dark]_&]:text-[#6BE7BA]", light && "text-[#6BE7BA]")}>
          Scan
        </span>
      </span>
    </Link>
  );
}
