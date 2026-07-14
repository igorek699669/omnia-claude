"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className = "", ...props }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={`flex gap-2 rounded-full bg-paper-100 p-1.5 ${className}`}
      {...props}
    />
  );
}

export function TabsTrigger({
  className = "",
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={`flex-1 cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium text-ink-600 outline-none transition-colors hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=active]:bg-brand data-[state=active]:text-white ${className}`}
      {...props}
    />
  );
}
