"use client";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}

export function FormField({ label, htmlFor, error, hint, children, className, optional }: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn("field-input", invalid && "border-late focus:border-late focus:ring-late/15", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn("field-input h-auto min-h-[120px] py-3", invalid && "border-late", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, invalid, ...p }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn("field-input appearance-none pr-10", invalid && "border-late", className)} {...p}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(function PasswordInput({ invalid, ...p }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} invalid={invalid} className="pr-12" {...p} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export function Checkbox({ label, className, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-[15px]", className)}>
      <input type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[rgb(var(--accent))]" {...p} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <span>
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-ink/20")}
      >
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
