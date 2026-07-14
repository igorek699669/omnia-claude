"use client";

import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import type { ComponentProps } from "react";

export const RadioGroup = RadixRadioGroup.Root;

export function RadioChip({
  className = "",
  ...props
}: ComponentProps<typeof RadixRadioGroup.Item>) {
  return (
    <RadixRadioGroup.Item
      className={`cursor-pointer rounded-full border border-ink-900/18 px-5 py-2.5 text-[15px] font-medium outline-none transition-colors hover:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=checked]:border-ink-900 data-[state=checked]:bg-ink-900 data-[state=checked]:text-paper-50 ${className}`}
      {...props}
    />
  );
}
