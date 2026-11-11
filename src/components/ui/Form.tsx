import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function inputClass(invalid?: boolean) {
  return cn(
    "block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2",
    invalid
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/25"
      : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/25",
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Pembungkus label + pesan galat/petunjuk. Kontrol di dalamnya harus memakai `id` yang sama. */
export function Field({ id, label, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(inputClass(invalid), "h-10 appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

type SearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  onChange: (value: string) => void;
  label: string;
};

export function SearchInput({ onChange, label, className, ...props }: SearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        aria-label={label}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass(false), "h-10 pl-10")}
        {...props}
      />
    </div>
  );
}
