import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Image from "next/image";
import { authPhoto } from "@/lib/photos";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // On desktop the photo panel stays put and only the form column scrolls
    <div className="grid min-h-dvh lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:overflow-hidden">
      <div className="flex min-h-dvh flex-col px-5 py-5 md:px-10 lg:min-h-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main id="main" className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-6">
          {children}
        </main>
        <p className="text-center text-sm text-muted">
          <Link href="/terms" className="hover:underline">
            Terms of Use
          </Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-deep p-12 text-deep-ink lg:flex lg:flex-col xl:p-14">
        <Image src={authPhoto.src} alt="" fill placeholder="blur" sizes="42vw" className="object-cover" />
        {/* Darken toward the bottom so the white text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/75 to-deep/20" />
        <div className="relative mt-auto">
          <p className="max-w-[18ch] font-serif text-[2.25rem] leading-[1.1] tracking-[-0.04em] xl:text-[2.5rem]">One photo. A clear next step for your field.</p>
          <ul className="mt-8 space-y-3 text-deep-muted">
            {["Diagnosis with a confidence score", "Treatment and prevention guidance", "7-day spread forecast from local weather"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7bf6d1]/15 text-[#7bf6d1]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
