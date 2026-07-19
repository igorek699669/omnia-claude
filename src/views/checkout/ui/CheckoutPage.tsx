"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "zod";
import { useCart, cartTotal } from "@/features/cart";
import { formatPrice } from "@/shared/lib/format";
import { CHECKOUT_SELECTION_KEY } from "@/shared/lib/storage-keys";
import { SectionTitle, ArrowButton, Checkbox } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";
import { Backdrop } from "./components/Backdrop";
import { LegalLinks } from "./components/LegalLinks";
import { DeliveryPicker, type Delivery } from "./components/DeliveryPicker";

type Step = "form" | "code" | "done";

const orderSchema = z.object({
  lastName: z.string().min(1, "Введите фамилию"),
  firstName: z.string().min(1, "Введите имя"),
  email: z.string().min(1, "Введите почту").email("Похоже, в адресе опечатка — проверьте и попробуйте ещё раз"),
  phone: z.string().min(1, "Введите телефон"),
  agreed: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие с политикой конфиденциальности",
  }),
});
type OrderValues = z.infer<typeof orderSchema>;

const emailCodeSchema = z.object({
  code: z.string().length(4, "Код состоит из 4 цифр"),
});
type EmailCodeValues = z.infer<typeof emailCodeSchema>;

export function CheckoutPage() {
  const { items, clear } = useCart();
  const [step, setStep] = useState<Step>("form");
  const [showDelivery, setShowDelivery] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);
      if (raw) setSelectedIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const orderItems = selectedIds ? items.filter((i) => selectedIds.includes(i.productId)) : items;

  const orderForm = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { lastName: "", firstName: "", email: "", phone: "", agreed: false },
  });
  const emailCodeForm = useForm<EmailCodeValues>({
    resolver: zodResolver(emailCodeSchema),
    defaultValues: { code: "" },
  });

  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  const agreed = orderForm.watch("agreed");
  const email = orderForm.watch("email");
  const subtotal = cartTotal(orderItems);
  const total = subtotal + (delivery?.cost ?? 0);
  const canSubmit = agreed && orderItems.length > 0;

  async function requestEmailCode() {
    const valid = await orderForm.trigger("email");
    if (!valid) return;
    setStep("code"); // TODO: await authClient.emailOtp.sendVerificationOtp({ email }) — см. CLAUDE.md
  }

  function submitEmailCode() {
    setEmailConfirmed(true);
    setStep("form"); // TODO: await authClient.signIn.emailOtp({ email, otp: emailCodeForm.getValues("code") })
    toast.success("Почта подтверждена");
  }

  function submitOrder() {
    if (orderItems.length === 0) return;
    // TODO: создание заказа (pending) → создание платежа ЮKassa → redirect — см. CLAUDE.md Roadmap
    clear();
    setStep("done");
  }

  if (showDelivery) {
    return (
      <DeliveryPicker
        onApply={(d) => {
          setDelivery(d);
          setShowDelivery(false);
        }}
        onBack={() => setShowDelivery(false)}
      />
    );
  }

  return (
    <section className="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden px-5 py-16">
      <Backdrop />

      <div className="relative w-full max-w-[620px] rounded-card bg-paper-50/95 p-8 shadow-[0_40px_80px_-32px_rgba(28,20,16,0.35)] backdrop-blur-sm md:p-10">
        {step === "code" ? (
          <form onSubmit={emailCodeForm.handleSubmit(submitEmailCode)} noValidate className="text-center">
            <SectionTitle className="text-[32px]">Введите код подтверждения</SectionTitle>
            <p className="mt-3 text-ink-600">
              Мы отправили четырёхзначный код на почту <b className="text-ink-900">{email}</b>{" "}
              <button
                type="button"
                onClick={() => setStep("form")}
                className="cursor-pointer text-brand-dark underline underline-offset-2"
              >
                Изменить
              </button>
            </p>
            <Controller
              control={emailCodeForm.control}
              name="code"
              render={({ field }) => (
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                  placeholder="Введите код"
                  className="mx-auto mt-8 block w-full max-w-[280px] rounded-input border border-ink-900/18 bg-white px-5 py-4 text-center font-display text-2xl tracking-[0.4em] outline-none transition-colors focus:border-brand"
                />
              )}
            />
            {emailCodeForm.formState.errors.code && (
              <p className="mt-3 text-sm text-brand-dark">{emailCodeForm.formState.errors.code.message}</p>
            )}
            <button
              type="submit"
              className="mt-6 w-full max-w-[280px] cursor-pointer rounded-full bg-brand px-7 py-4 font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Подтвердить
            </button>
          </form>
        ) : step === "done" ? (
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <SectionTitle className="mt-6 text-[32px]">Заказ оформлен</SectionTitle>
            <p className="mt-3 text-ink-600">
              Спасибо! Мы свяжемся с вами для подтверждения. Статус и трек-номер появятся в личном
              кабинете.
            </p>
            <Link
              href="/profile"
              className="mt-6 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              Перейти в личный кабинет
            </Link>
          </div>
        ) : orderItems.length === 0 ? (
          <div>
            <SectionTitle className="text-[32px]">Оформление заказа</SectionTitle>
            <p className="mt-4 text-ink-600">В корзине пока пусто.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <form onSubmit={orderForm.handleSubmit(submitOrder)} noValidate>
            <SectionTitle className="text-[32px]">Оформление заказа</SectionTitle>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Фамилия" error={orderForm.formState.errors.lastName?.message} {...orderForm.register("lastName")} />
              <Field label="Имя" error={orderForm.formState.errors.firstName?.message} {...orderForm.register("firstName")} />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    disabled={emailConfirmed}
                    placeholder="you@mail.ru"
                    className="w-full min-w-0 flex-1 rounded-input border border-ink-900/18 bg-white px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-brand disabled:bg-paper-100 disabled:text-ink-600"
                    {...orderForm.register("email")}
                  />
                  {!emailConfirmed && (
                    <button
                      type="button"
                      onClick={requestEmailCode}
                      className="shrink-0 cursor-pointer rounded-full bg-paper-100 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-brand hover:text-white"
                    >
                      Подтвердить
                    </button>
                  )}
                </div>
                {orderForm.formState.errors.email && (
                  <p className="mt-1.5 text-sm text-brand-dark">{orderForm.formState.errors.email.message}</p>
                )}
              </div>
              <Field label="Телефон" type="tel" error={orderForm.formState.errors.phone?.message} {...orderForm.register("phone")} />
            </div>

            <button
              type="button"
              onClick={() => setShowDelivery(true)}
              className="mt-5 flex w-full cursor-pointer items-center justify-between gap-4 rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-left transition-colors hover:border-brand"
            >
              {delivery ? (
                <span className="min-w-0 truncate text-[15px]">
                  <span className="text-ink-600">Способ доставки: </span>
                  {delivery.label} · {formatPrice(delivery.cost)}
                </span>
              ) : (
                <span className="text-ink-600">Способ доставки</span>
              )}
              <span className="shrink-0 rounded-full bg-paper-100 px-4 py-2 text-sm font-medium">
                {delivery ? "Изменить" : "На карте"}
              </span>
            </button>

            <Controller
              control={orderForm.control}
              name="agreed"
              render={({ field }) => (
                <label className="mt-5 flex cursor-pointer items-start gap-3 text-[15px]">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                  Я согласен с политикой конфиденциальности
                </label>
              )}
            />
            {orderForm.formState.errors.agreed && (
              <p className="mt-1.5 text-sm text-brand-dark">{orderForm.formState.errors.agreed.message}</p>
            )}

            <ul className="mt-5 flex max-h-56 flex-col gap-3 overflow-y-auto rounded-input border border-ink-900/12 p-4">
              {orderItems.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="grid size-12 place-items-center overflow-hidden rounded-xl bg-paper-200">
                      <HandpanArt className="h-3/4 w-3/4" />
                    </div>
                    <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">
                      {item.qty}
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 truncate font-medium">{item.name}</p>
                  <div className="shrink-0 text-right">
                    <span className="font-semibold">{formatPrice(item.price)}</span>
                    {item.oldPrice && item.oldPrice > item.price && (
                      <s className="ml-2 text-sm text-ink-600">{formatPrice(item.oldPrice)}</s>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div className="text-[15px] text-ink-600">
                <p>Доставка: {delivery ? formatPrice(delivery.cost) : "не указана"}</p>
                <p className="font-display text-2xl font-semibold text-ink-900">
                  Итог: {formatPrice(total)}
                </p>
              </div>
              <div className={!canSubmit ? "pointer-events-none opacity-50" : ""}>
                <ArrowButton type="submit" disabled={!canSubmit}>
                  Оформить заказ
                </ArrowButton>
              </div>
            </div>

            <LegalLinks />
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  type = "text",
  ...register
}: {
  label: string;
  error?: string;
  type?: string;
} & UseFormRegisterReturn) {
  return (
    <div>
      <input
        type={type}
        placeholder={label}
        className="w-full rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-base outline-none transition-colors focus:border-brand"
        {...register}
      />
      {error && <p className="mt-1.5 text-sm text-brand-dark">{error}</p>}
    </div>
  );
}
