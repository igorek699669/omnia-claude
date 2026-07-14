"use client";

import * as RadixSelect from "@radix-ui/react-select";
import type { ComponentProps, ReactNode } from "react";

export const Select = RadixSelect.Root;

export function SelectTrigger({
  className = "",
  ...props
}: ComponentProps<typeof RadixSelect.Trigger>) {
  return (
    <RadixSelect.Trigger
      className={`flex w-full max-w-[360px] cursor-pointer items-center justify-between gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-base outline-none transition-colors focus-visible:border-brand data-[placeholder]:text-ink-600 ${className}`}
      {...props}
    >
      <RadixSelect.Value />
      <RadixSelect.Icon className="shrink-0 text-ink-900">
        <ChevronIcon />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export function SelectContent({
  children,
  className = "",
  ...props
}: ComponentProps<typeof RadixSelect.Content> & { children: ReactNode }) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        position="popper"
        sideOffset={8}
        className={`z-50 overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-[0_16px_40px_-16px_rgba(28,20,16,0.35)] ${className}`}
        {...props}
      >
        <RadixSelect.Viewport className="p-1.5">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({
  children,
  className = "",
  ...props
}: ComponentProps<typeof RadixSelect.Item> & { children: ReactNode }) {
  return (
    <RadixSelect.Item
      className={`cursor-pointer rounded-xl px-4 py-3 text-base outline-none transition-colors data-[highlighted]:bg-paper-100 data-[state=checked]:font-medium ${className}`}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
