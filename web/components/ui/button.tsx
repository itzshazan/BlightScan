import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Harvest button: 17px / 500 / pill radius. Colours: Greenhouse evergreen + mint.
export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-page hover:bg-ink/85",
        accent: "bg-accent text-white hover:bg-accent-strong dark:text-deep",
        outline: "border border-ink/80 text-ink hover:bg-ink hover:text-page",
        soft: "bg-accent-soft text-ink hover:bg-accent-soft/70",
        ghost: "text-ink hover:bg-ink/5",
        danger: "bg-late text-white hover:bg-late/90 dark:text-deep",
        "danger-outline": "border border-late/40 text-late hover:bg-late-soft",
        light: "bg-deep-ink text-deep hover:bg-white",
        "light-outline": "border border-deep-ink/40 text-deep-ink hover:bg-deep-ink/10",
      },
      size: {
        lg: "h-[52px] px-7 text-[17px]",
        md: "h-11 px-5 text-[15px]",
        sm: "h-9 px-4 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type Common = VariantProps<typeof buttonVariants> & { className?: string; children?: ReactNode };
type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; external?: undefined; loading?: boolean };
type AsLink = Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; external?: boolean; loading?: undefined };
export type ButtonProps = AsButton | AsLink;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const cls = cn(buttonVariants({ variant: props.variant, size: props.size }), props.className);

  if (props.href !== undefined) {
    const { variant, size, className, href, external, loading, children, ...rest } = props;
    const aRef = ref as Ref<HTMLAnchorElement>;
    if (external)
      return (
        <a ref={aRef} href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
          {children}
        </a>
      );
    return (
      <Link ref={aRef} href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant, size, className, href, external, loading, children, ...rest } = props;
  return (
    <button ref={ref as Ref<HTMLButtonElement>} className={cls} {...rest} disabled={loading || rest.disabled}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
