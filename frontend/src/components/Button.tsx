import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const buttonStyles = {
  primary:
    "bg-slate-950 text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.65)] hover:bg-slate-800 focus-visible:outline-slate-950",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-slate-300",
} as const;

type ButtonVariant = keyof typeof buttonStyles;

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

type LinkProps = CommonProps & {
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

function baseClasses(className?: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={`${baseClasses(className)} ${buttonStyles[variant]}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", className, children, to, ...props }: LinkProps) {
  return (
    <Link className={`${baseClasses(className)} ${buttonStyles[variant]}`} to={to} {...props}>
      {children}
    </Link>
  );
}
