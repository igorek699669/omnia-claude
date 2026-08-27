"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import type { ComponentProps } from "react";
import { CheckIcon, MinusIcon } from "./assets/icons";

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
        {props.checked === "indeterminate" ? (
          <MinusIcon size={12} strokeWidth={3} />
        ) : (
          <CheckIcon size={12} strokeWidth={3} />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}




