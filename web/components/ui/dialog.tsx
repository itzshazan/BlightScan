"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-deep/50 backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-6 shadow-2xl focus:outline-none",
          className
        )}
      >
        <D.Title className="pr-8 text-xl font-medium">{title}</D.Title>
        {description ? (
          <D.Description className="mt-2 text-[15px] text-muted">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        <div className="mt-5">{children}</div>
        <D.Close className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-ink/5" aria-label="Close">
          <X className="h-4 w-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Slide-in panel from the right, used for review and message drawers. */
export function Drawer({ open, onOpenChange, title, children, footer }: DrawerProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-deep/40" />
        <D.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg animate-slide-in flex-col bg-surface shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-line/10 px-6 py-4">
            <D.Title className="text-lg font-medium">{title}</D.Title>
            <D.Close className="rounded-full p-1.5 text-muted hover:bg-ink/5" aria-label="Close">
              <X className="h-5 w-5" />
            </D.Close>
          </div>
          <D.Description className="sr-only">{title}</D.Description>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line/10 px-6 py-4">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

interface ConfirmDialogProps {
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Confirm before any delete (spec 3: shared UI behaviour). */
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Delete", onConfirm, open: controlled, onOpenChange }: ConfirmDialogProps) {
  const [inner, setInner] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = controlled ?? inner;
  const setOpen = onOpenChange ?? setInner;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent title={title} description={description}>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
