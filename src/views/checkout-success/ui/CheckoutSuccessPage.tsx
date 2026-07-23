"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrderStatus } from "@/features/checkout";
import { useCart } from "@/features/cart";
import { formatPrice } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";

type Status = "loading" | "pending" | "paid" | "cancelled" | "not-found";

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

export function CheckoutSuccessPage({ orderId }: { orderId?: string }) {
  const removeItems = useCart((s) => s.removeMany);

  const { data, isPending } = useQuery({
    queryKey: ["order-status", orderId],
    queryFn: () => getOrderStatus(orderId!),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;
      if (currentStatus === "paid" || currentStatus === "cancelled") return false;
      return query.state.dataUpdateCount >= MAX_POLL_ATTEMPTS ? false : POLL_INTERVAL_MS;
    },
  });

  let status: Status;
  if (!orderId) status = "not-found";
  else if (isPending) status = "loading";
  else if (!data) status = "not-found";
  else if (data.status === "paid" || data.status === "cancelled") status = data.status;
  else status = "pending";
  const total = data?.total ?? null;

  useEffect(() => {
    // Из корзины убираем только то, что реально было в этом заказе — оплата части
    // корзины не должна стирать остальные выбранные позиции.
    if (status === "paid" && data) removeItems(data.productIds);
  }, [status, data, removeItems]);

  return (
    <section className="relative isolate flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[560px] rounded-card bg-paper-50 p-8 text-center shadow-[0_40px_80px_-32px_rgba(28,20,16,0.35)] md:p-10">
        {status === "loading" && <p className="text-ink-600">Проверяем статус оплаты…</p>}

        {status === "not-found" && (
          <>
            <SectionTitle className="text-[28px]">Заказ не найден</SectionTitle>
            <p className="mt-3 text-ink-600">Проверьте ссылку из письма или обратитесь в поддержку.</p>
          </>
        )}

        {status === "paid" && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <SectionTitle className="mt-6 text-[32px]">Оплата прошла успешно</SectionTitle>
            <p className="mt-3 text-ink-600">
              Спасибо за заказ{total ? ` на ${formatPrice(total)}` : ""}! Мы свяжемся с вами для подтверждения.
              Статус и трек-номер появятся в личном кабинете.
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <SectionTitle className="text-[28px]">Платёж обрабатывается</SectionTitle>
            <p className="mt-3 text-ink-600">
              Обычно это занимает несколько секунд. Актуальный статус заказа появится в личном кабинете.
            </p>
          </>
        )}

        {status === "cancelled" && (
          <>
            <SectionTitle className="text-[28px]">Оплата не прошла</SectionTitle>
            <p className="mt-3 text-ink-600">Заказ отменён. Вы можете попробовать оформить его заново.</p>
            <Link
              href="/checkout"
              className="mt-4 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              Вернуться к оформлению
            </Link>
          </>
        )}

        {(status === "paid" || status === "pending") && (
          <Link
            href="/profile"
            className="mt-6 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Перейти в личный кабинет
          </Link>
        )}
      </div>
    </section>
  );
}
