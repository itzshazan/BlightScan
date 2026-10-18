import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink/[0.06]", className)} />;
}

export function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-card" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  art?: ReactNode;
  title: string;
  body?: string;
  action?: string;
  href?: string;
  onAction?: () => void;
}

export function EmptyState({ art, title, body, action, href, onAction }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {art}
      <h3 className="title-card mt-5">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-muted">{body}</p>}
      {action &&
        (href ? (
          <Button className="mt-6" variant="accent" href={href}>
            {action}
          </Button>
        ) : (
          <Button className="mt-6" variant="accent" onClick={onAction}>
            {action}
          </Button>
        ))}
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: ReactNode;
}

export function PageHeader({ title, description, actions, crumbs }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {crumbs}
        <h1 className="display-3">{title}</h1>
        {description && <div className="mt-1.5 text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {c.href ? (
            <Link href={c.href} className="hover:text-ink hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
