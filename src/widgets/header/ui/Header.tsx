"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCart, cartCount } from "@/features/cart";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Skeleton,
  CartIcon,
  CloseIcon,
  MenuIcon,
  MESSENGERS,
  UserIcon,
} from "@/shared/ui";
import {
  useSession,
  signOut,
  formatPhone,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  reachGoal,
  GOALS,
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
            {/* До sm номер в шапку не помещается — на телефоне он живёт в меню ниже. */}
            <a
              href={CONTACT_PHONE_HREF}
              onClick={() => reachGoal(GOALS.phoneClick, { place: "header" })}
              className="hidden text-[15px] font-medium sm:block"
            >
              {CONTACT_PHONE}
            </a>
            <Link
              href="/cart"
              aria-label={`Корзина, товаров: ${count}`}
              className="relative grid size-10.5 place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100"
            >
              <CartIcon size={18} strokeWidth={1.8} />
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
                    <UserIcon size={18} strokeWidth={1.8} />
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
              {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
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
              <CloseIcon size={18} />
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
            {/* С телефона номера в шапке нет вовсе, а больше половины покупателей приходят
                именно оттуда, — в меню он должен быть на виду, а не только в подвале. */}
            <li className="mt-1">
              <a
                href={CONTACT_PHONE_HREF}
                onClick={() => reachGoal(GOALS.phoneClick, { place: "menu" })}
                className="block font-display text-[22px] font-medium sm:hidden"
              >
                {CONTACT_PHONE}
              </a>
            </li>
            <li className="mt-1 flex gap-2.5">
              {MESSENGERS.map(({ id, label, href, Icon }) => (
                <Messenger key={id} label={label} href={href} channel={id}>
                  <Icon size={18} />
                </Messenger>
              ))}
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
  channel,
  children,
}: {
  label: string;
  href: string;
  channel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => reachGoal(GOALS.messengerClick, { channel, place: "menu" })}
      className="grid size-10.5 place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:bg-paper-100 hover:text-brand"
    >
      {children}
    </a>
  );
}
