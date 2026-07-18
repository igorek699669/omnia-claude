"use client";

import * as RadixPopover from "@radix-ui/react-popover";
import type { ComponentProps, ReactNode } from "react";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export function PopoverContent({
  children,
  className = "",
  sideOffset = 10,
  align = "end",
  ...props
}: ComponentProps<typeof RadixPopover.Content> & { children: ReactNode }) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        align={align}
        className={`z-50 min-w-[200px] overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(28,20,16,0.35)] outline-none data-[state=open]:animate-overlay-fade-in ${className}`}
        {...props}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
