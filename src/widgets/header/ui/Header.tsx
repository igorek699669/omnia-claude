"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, cartCount, CartIcon } from "@/features/cart";
import { Dialog, DialogContent, DialogTitle, DialogClose, Popover, PopoverTrigger, PopoverContent } from "@/shared/ui";
import { useSession, signOut } from "@/shared/lib/auth-client";

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
  const { data: session } = useSession();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Аккаунт"
                    className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100"
                  >
                    <UserIcon />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <Link
                    href="/profile"
                    className="block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors hover:bg-paper-100"
                  >
                    Личный кабинет
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[15px] font-medium text-ink-600 transition-colors hover:bg-paper-100"
                  >
                    Выйти
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                href="/auth"
                className="rounded-full bg-ink-900 px-5.5 py-2.5 text-[15px] font-medium text-paper-50 transition-colors hover:bg-brand-dark"
              >
                Войти
              </Link>
            )}
            <button
              aria-label={open ? "Закрыть меню" : "Меню"}
              onClick={() => setOpen((v) => !v)}
              className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <DialogContent className="lg:hidden">
        <div className="flex items-center justify-between">
          <span className="font-display text-[26px] font-semibold uppercase tracking-[0.16em]">
            Omn<b className="font-semibold text-brand">i</b>a
          </span>
          <DialogClose asChild>
            <button
              aria-label="Закрыть меню"
              className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <DialogTitle className="sr-only">Мобильное меню</DialogTitle>
        <nav aria-label="Мобильная навигация" className="mt-8">
          <ul className="flex flex-col gap-5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block text-lg font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-3 border-t border-ink-900/10 pt-5">
              {session ? (
                <div className="flex flex-col gap-4">
                  <Link href="/profile" onClick={() => setOpen(false)} className="block text-lg font-medium">
                    {session.user.email}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                    className="cursor-pointer text-left text-lg font-medium text-ink-600"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <Link href="/auth" onClick={() => setOpen(false)} className="block text-lg font-medium">
                  Войти
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}
