import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex items-center gap-3.5 rounded-full font-medium transition-colors cursor-pointer";
const variants = {
  primary: "bg-brand text-white py-2 pr-2 pl-7 hover:bg-brand-dark",
  inverse: "bg-ink-900 text-paper-50 py-2 pr-2 pl-7 hover:bg-brand-dark",
} as const;

function Arrow({ variant }: { variant: keyof typeof variants }) {
  return (
    <span
      aria-hidden
      className={`grid size-10.5 place-items-center rounded-full ${
        variant === "primary" ? "bg-white/20" : "bg-brand text-white"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </span>
  );
}

type Props = { variant?: keyof typeof variants; children: ReactNode };

export function ArrowButton({
  variant = "primary",
  children,
  ...rest
}: Props & ComponentProps<"button">) {
  return (
    <button className={`${base} ${variants[variant]}`} {...rest}>
      {children}
      <Arrow variant={variant} />
    </button>
  );
}

export function ArrowLink({
  variant = "primary",
  children,
  ...rest
}: Props & ComponentProps<typeof Link>) {
  return (
    <Link className={`${base} ${variants[variant]}`} {...rest}>
      {children}
      <Arrow variant={variant} />
    </Link>
  );
}
