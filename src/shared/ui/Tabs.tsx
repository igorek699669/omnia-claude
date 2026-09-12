"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";

export const Tabs = RadixTabs.Root;

/**
 * Панель вкладки. Неактивную прячем классом, а не полагаемся на Radix: с forceMount он
 * оставляет её в разметке без атрибута hidden, и на странице оказываются сразу все темы.
 * Класс нужен именно тем панелям, что смонтированы всегда (ради поиска); остальным он
 * ничего не меняет — они и так не отрисованы.
 */
export function TabsContent({
  className = "",
  ...props
}: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={`data-[state=inactive]:hidden ${className}`} {...props} />;
}

/**
 * Два вида полосы вкладок: «pill» — оранжевая пилюля внутри светлой подложки, «underline» —
 * строка с оранжевой чертой под выбранным. Второй нужен там, где вкладки стоят над длинным
 * текстом: пилюли там читаются как кнопки действия и спорят с заголовком.
 */
type TabsVariant = "pill" | "underline";

const LIST_VARIANTS: Record<TabsVariant, string> = {
  pill: "flex gap-2 rounded-full bg-paper-100 p-1.5",
  // На телефоне четыре темы встают сеткой 2×2: в одну строку они не помещаются, а
  // перенос по одной оставляет последнюю висеть отдельной строкой.
  underline: "grid grid-cols-2 gap-x-4.5 border-b border-ink-900/12 sm:flex sm:flex-wrap sm:gap-x-6",
};

const TRIGGER_VARIANTS: Record<TabsVariant, string> = {
  pill: "flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 data-[state=active]:bg-brand data-[state=active]:text-white",
  underline:
    "-mb-px border-b-2 border-transparent pb-3.5 pt-3 text-left text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 data-[state=active]:border-brand data-[state=active]:text-ink-900",
};

export function TabsList({
  variant = "pill",
  className = "",
  ...props
}: ComponentProps<typeof RadixTabs.List> & { variant?: TabsVariant }) {
  return <RadixTabs.List className={`${LIST_VARIANTS[variant]} ${className}`} {...props} />;
}

export function TabsTrigger({
  variant = "pill",
  className = "",
  ...props
}: ComponentProps<typeof RadixTabs.Trigger> & { variant?: TabsVariant }) {
  return (
    <RadixTabs.Trigger
      className={`cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${TRIGGER_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
