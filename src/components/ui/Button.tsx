import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost" | "dangerOutline";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerOutline: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </button>
  );
}

const iconTones = {
  neutral: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  blue: "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  label: string;
  tone?: keyof typeof iconTones;
};

export function IconButton({ icon, label, tone = "neutral", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 sm:size-9",
        iconTones[tone],
        className,
      )}
      {...props}
    >
      <Icon name={icon} className="size-[18px]" />
    </button>
  );
}
