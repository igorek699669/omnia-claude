"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, cartCount, CartIcon } from "@/features/cart";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#sound", label: "Подбор звука" },
  { href: "/delivery", label: "Доставка" },
  { href: "/#faq", label: "Вопросы" },
];

export function Header() {
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/8 bg-paper-50/88 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-10 px-5 md:px-12">
        <Link href="/" className="font-display text-[26px] font-semibold uppercase tracking-[0.16em]">
          Omn<b className="font-semibold text-brand">i</b>a
        </Link>

        <nav aria-label="Основная навигация" className="mx-auto hidden gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          <a href="tel:+79000000000" className="hidden text-[15px] font-medium sm:block">
            +7 900 000-00-00
          </a>
          <Link
            href="/cart"
            aria-label={`Корзина, товаров: ${count}`}
            className="relative grid size-10.5 place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-ink-900 px-5.5 py-2.5 text-[15px] font-medium text-paper-50 transition-colors hover:bg-brand-dark"
          >
            Войти
          </Link>
          <button
            aria-label="Меню"
            onClick={() => setOpen(!open)}
            className="grid size-10.5 place-items-center rounded-full border border-ink-900/15 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Мобильная навигация" className="border-t border-ink-900/8 px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-1 text-lg font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
