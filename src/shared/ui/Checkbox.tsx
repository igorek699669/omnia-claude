"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import type { ComponentProps } from "react";

export function Checkbox({
  className = "",
  ...props
}: ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      className={`group grid size-5 shrink-0 cursor-pointer place-items-center rounded-md border border-ink-900/25 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      <RadixCheckbox.Indicator className="text-white">
        {props.checked === "indeterminate" ? <MinusIcon /> : <CheckIcon />}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}
