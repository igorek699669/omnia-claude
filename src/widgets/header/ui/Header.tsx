"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCart, cartCount, CartIcon } from "@/features/cart";
import { Dialog, DialogContent, DialogTitle, DialogClose, Popover, PopoverTrigger, PopoverContent, Skeleton } from "@/shared/ui";
import {
  useSession,
  signOut,
  formatPhone,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_TELEGRAM_URL,
  CONTACT_WHATSAPP_URL,
  CONTACT_MAX_URL,
} from "@/shared/lib";

const nav = [
  { href: "/catalog", label: "Каталог" },
  // { href: "/#sound", label: "Подбор звука" }, // временно скрыт, вернуть позже
  { href: "/delivery", label: "Доставка и оплата" },
  { href: "/return", label: "Возврат и обмен" },
];

export function Header() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const [open, setOpen] = useState(false);
  // isPending — сессия ещё проверяется. Без него вошедший пользователь на первых
  // кадрах видит кнопку «Войти», и она тут же подменяется иконкой аккаунта.
  const { data: session, isPending: isSessionLoading } = useSession();

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error("Не получилось выйти — попробуйте ещё раз");
      return;
    }
    toast.success("Вы вышли");
    // Без этого уже отрисованные серверные страницы (например /profile) не
    // перепроверяют сессию сами — человек, нажавший «Выйти» на них, останется
    // видеть свои заказы, пока не перейдёт куда-то вручную.
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-50 border-b border-ink-900/8 bg-paper-50/88 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-3 px-5 md:px-12 justify-between ">
          <Link href="/" className="font-display text-[20px] font-semibold tracking-[0.16em] sm:text-[26px]">
            <b className="font-semibold text-brand">OM</b>NIA
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <a href={CONTACT_PHONE_HREF} className="hidden text-[15px] font-medium sm:block">
              {CONTACT_PHONE}
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
            {isSessionLoading ? (
              <Skeleton className="h-10.5 w-23 rounded-full" />
            ) : session ? (
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
                    onClick={handleSignOut}
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
              className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <DialogContent>
        <div className="flex items-center justify-between">
          <span className="font-display text-[20px] font-semibold tracking-[0.16em] sm:text-[26px]">
            <b className="font-semibold text-brand">OM</b>NIA
          </span>
          <DialogClose asChild>
            <button
              aria-label="Закрыть меню"
              className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <DialogTitle className="sr-only">Меню</DialogTitle>
        <nav aria-label="Основная навигация" className="mt-8">
          <ul className="flex flex-col gap-5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block text-lg font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-3 border-t border-ink-900/10 pt-5">
              {isSessionLoading ? (
                <Skeleton className="h-7 w-48" />
              ) : session ? (
                <div className="flex flex-col gap-4">
                  <Link href="/profile" onClick={() => setOpen(false)} className="block text-lg font-medium">
                    {/* Номер есть у всех: войти иначе нельзя. Подпись на случай, если
                        сессия завелась в обход телефона (например, старый аккаунт). */}
                    {(() => {
                      const phone = (session.user as { phoneNumber?: string }).phoneNumber;
                      return phone ? formatPhone(phone) : "Личный кабинет";
                    })()}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
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
            <li className="mt-1 flex gap-2.5">
              <Messenger label="Telegram" href={CONTACT_TELEGRAM_URL}><path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" /></Messenger>
              <Messenger label="WhatsApp" href={CONTACT_WHATSAPP_URL}><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" /></Messenger>
              <Messenger label="MAX" href={CONTACT_MAX_URL} viewBox="0 0 1000 1000">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.786 0 375.947 171.001 375.947 381.604.707 207.347-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z"
                />
              </Messenger>
            </li>
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}

function Messenger({
  label,
  href,
  viewBox = "0 0 24 24",
  children,
}: {
  label: string;
  href: string;
  viewBox?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="grid size-10.5 place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100 hover:text-brand"
    >
      <svg width="18" height="18" viewBox={viewBox} fill="currentColor">{children}</svg>
    </a>
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
