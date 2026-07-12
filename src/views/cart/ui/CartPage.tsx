"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart, cartTotal } from "@/features/cart";
import { formatPrice } from "@/shared/lib/format";
import { Tag, SectionTitle, ArrowLink } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";
import { CHECKOUT_SELECTION_KEY } from "@/shared/lib/storage-keys";

export function CartPage() {
  const { items, setQty, remove } = useCart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const seenIds = useRef<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Новые товары (в т.ч. подгруженные из localStorage при гидратации) выбраны по умолчанию.
  useEffect(() => {
    const unseen = items.filter((i) => !seenIds.current.has(i.productId));
    if (unseen.length === 0) return;
    unseen.forEach((i) => seenIds.current.add(i.productId));
    setSelected((prev) => {
      const next = new Set(prev);
      unseen.forEach((i) => next.add(i.productId));
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selected.size > 0 && selected.size < items.length;
    }
  }, [selected, items.length]);

  function toggleOne(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.productId))));
  }

  function handleRemove(productId: string) {
    remove(productId);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }

  function removeSelected() {
    selected.forEach((id) => remove(id));
    setSelected(new Set());
  }

  const selectedItems = items.filter((i) => selected.has(i.productId));
  const selectedQty = selectedItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartTotal(selectedItems);
  const oldSubtotal = selectedItems.reduce((sum, i) => sum + (i.oldPrice ?? i.price) * i.qty, 0);
  const savings = oldSubtotal - subtotal;

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <Tag>Корзина</Tag>
      <SectionTitle className="mt-5">Ваш заказ</SectionTitle>

      {items.length === 0 ? (
        <div className="mt-10">
          <p className="text-lg text-ink-600">В корзине пока пусто.</p>
          <Link
            href="/catalog"
            className="mt-6 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-white px-6 py-4">
              <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  className="size-5 cursor-pointer accent-brand"
                />
                Выбрать все ({items.length})
              </label>
              {selected.size > 0 && (
                <button
                  onClick={removeSelected}
                  className="cursor-pointer text-sm font-medium text-ink-600 transition-colors hover:text-brand-dark"
                >
                  Удалить выбранное ({selected.size})
                </button>
              )}
            </div>

            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.productId} className="flex flex-wrap items-center gap-4 rounded-[28px] bg-white p-6">
                  <input
                    type="checkbox"
                    checked={selected.has(item.productId)}
                    onChange={() => toggleOne(item.productId)}
                    aria-label={`Выбрать «${item.name}»`}
                    className="size-5 shrink-0 cursor-pointer accent-brand"
                  />
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper-200">
                    <HandpanArt className="h-3/4 w-3/4" />
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <Link href={`/product/${item.slug}`} className="font-display text-lg font-medium hover:text-brand-dark">
                      {item.name}
                    </Link>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-xl font-semibold">{formatPrice(item.price)}</span>
                      {item.oldPrice && item.oldPrice > item.price && (
                        <>
                          <s className="text-sm text-ink-600">{formatPrice(item.oldPrice)}</s>
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                            −{Math.round((1 - item.price / item.oldPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <QtyBtn onClick={() => setQty(item.productId, item.qty - 1)}>−</QtyBtn>
                    <span className="w-6 text-center font-medium">{item.qty}</span>
                    <QtyBtn onClick={() => setQty(item.productId, item.qty + 1)}>+</QtyBtn>
                  </div>
                  <span className="w-28 text-right font-display text-lg font-semibold">
                    {formatPrice(item.price * item.qty)}
                  </span>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    aria-label={`Убрать «${item.name}» из корзины`}
                    className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-ink-900/15 text-ink-600 transition-colors hover:border-brand hover:text-brand-dark"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-card bg-white p-7 lg:sticky lg:top-28">
            <h2 className="font-display text-xl font-medium">Ваш заказ</h2>
            <div className="mt-5 flex flex-col gap-3 border-t border-ink-900/10 pt-5 text-[15px]">
              <div className="flex justify-between">
                <span className="text-ink-600">Товары, шт.</span>
                <span className="font-medium">{selectedQty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Сумма</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-brand-dark">
                  <span>Скидка</span>
                  <span className="font-medium">−{formatPrice(savings)}</span>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-ink-900/10 pt-5">
              <span className="text-lg">Итого</span>
              <span className="font-display text-2xl font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className={`mt-6 flex justify-center ${selected.size === 0 ? "pointer-events-none opacity-50" : ""}`}>
              <ArrowLink
                href="/checkout"
                className="lg:w-full lg:justify-center"
                onClick={() => {
                  try {
                    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify([...selected]));
                  } catch {
                    // ignore
                  }
                }}
              >
                Оформить заказ{selectedQty > 0 ? ` (${selectedQty})` : ""}
              </ArrowLink>
            </div>
            <p className="mt-4 text-center text-sm text-ink-600 lg:text-left">
              Стоимость доставки СДЭК рассчитается на следующем шаге, до оплаты.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

function QtyBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid size-9 cursor-pointer place-items-center rounded-full border border-ink-900/15 text-lg transition-colors hover:border-brand"
    >
      {children}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
