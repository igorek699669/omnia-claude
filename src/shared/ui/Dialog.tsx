"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogTitle = RadixDialog.Title;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  children,
  className = "",
  ...props
}: ComponentProps<typeof RadixDialog.Content> & { children: ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm data-[state=open]:animate-overlay-fade-in" />
      <RadixDialog.Content
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-1 overflow-y-auto bg-paper-50 p-6 shadow-[0_0_60px_-16px_rgba(28,20,16,0.4)] outline-none data-[state=open]:animate-panel-slide-in ${className}`}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
