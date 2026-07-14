"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import type { ComponentProps, ReactNode } from "react";

export const Accordion = RadixAccordion.Root;

export function AccordionItem({
  className = "",
  ...props
}: ComponentProps<typeof RadixAccordion.Item>) {
  return <RadixAccordion.Item className={`border-b border-ink-900/12 ${className}`} {...props} />;
}

export function AccordionTrigger({
  children,
  className = "",
  ...props
}: ComponentProps<typeof RadixAccordion.Trigger> & { children: ReactNode }) {
  return (
    <RadixAccordion.Header>
      <RadixAccordion.Trigger
        className={`group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left font-display text-[21px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}
        {...props}
      >
        {children}
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ink-900/20 transition-transform group-data-[state=open]:rotate-45">
          <PlusIcon />
        </span>
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

export function AccordionContent({
  children,
  className = "",
  ...props
}: ComponentProps<typeof RadixAccordion.Content> & { children: ReactNode }) {
  return (
    <RadixAccordion.Content
      className={`overflow-hidden text-[15px] text-ink-600 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down ${className}`}
      {...props}
    >
      <div className="pb-6 pr-0 lg:pr-16">{children}</div>
    </RadixAccordion.Content>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
