"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { useCart, cartTotal } from "@/features/cart";
import { createOrderPayment, type CheckoutInput } from "@/features/checkout";
import { formatPrice, formatDeliveryCost, useSession, formatPhone, isValidRuPhone } from "@/shared/lib";
import { SectionTitle, ArrowButton, Checkbox, Backdrop, LegalLinks, PhoneInput, HandpanArt, CheckIcon } from "@/shared/ui";
import { DeliveryPicker, type Delivery } from "@/features/select-delivery";
import { PhoneConfirmDialog } from "./components/PhoneConfirmDialog";

const orderSchema = z.object({
  lastName: z.string().min(1, "Введите фамилию"),
  firstName: z.string().min(1, "Введите имя"),
  // pipe, а не z.email().min(1) — иначе на пустом поле первым сообщением
  // окажется «опечатка в адресе» вместо «введите почту».
  email: z
    .string()
    .min(1, "Введите почту")
    .pipe(z.email("Похоже, в адресе опечатка — проверьте и попробуйте ещё раз")),
  phone: z.string().min(1, "Введите телефон").refine(isValidRuPhone, "Введите телефон полностью"),
  consentPersonalData: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие на обработку персональных данных",
  }),
  consentOffer: z.boolean().refine((v) => v === true, {
    message: "Нужно подтвердить, что вы ознакомлены с офертой и условиями возврата",
  }),
  consentMarketing: z.boolean(),
});
type OrderValues = z.infer<typeof orderSchema>;

export function CheckoutPage() {
  const { items } = useCart();
  const { data: session, refetch: refetchSession } = useSession();
  const [showDelivery, setShowDelivery] = useState(false);
  // Открытый однажды пикер больше не размонтируется, а прячется: иначе при повторном
  // открытии терялись бы выбранный город, загруженные пункты выдачи и посчитанный тариф —
  // покупатель, зашедший «поправить квартиру», начинал бы с пустых полей. До первого
  // открытия не монтируем вовсе, чтобы не держать его разметку у тех, кто до неё не дошёл.
  const [deliveryMounted, setDeliveryMounted] = useState(false);

  const selectedIds = useCart((s) => s.selectedIds);

  // Пустой выбор трактуем как всю корзину: снять все галочки покупатель может, а прийти
  // сюда по прямой ссылке — тоже, и тогда он увидел бы пустой заказ при непустой корзине.
  const chosen = selectedIds ? items.filter((i) => selectedIds.includes(i.productId)) : items;
  const orderItems = chosen.length > 0 ? chosen : items;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      email: "",
      phone: "",
      consentPersonalData: false,
      consentOffer: false,
      consentMarketing: false,
    },
  });

  // Вошедшему номер подставляется из сессии и считается подтверждённым сразу — отдельным
  // состоянием держим только подтверждение звонком здесь и сейчас, остальное выводится.
  const [confirmedByCall, setConfirmedByCall] = useState(false);
  const sessionPhone = (session?.user as { phoneNumber?: string } | undefined)?.phoneNumber;
  const phoneConfirmed = confirmedByCall || Boolean(sessionPhone);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    // Форма — внешнее по отношению к React состояние, её синхронизация эффектом уместна.
    if (sessionPhone) setValue("phone", formatPhone(sessionPhone));
  }, [sessionPhone, setValue]);

  // watch() здесь намеренно, несмотря на предупреждение линта: именно он заставляет React
  // Compiler отказаться от оптимизации компонента. С useWatch компилятор мемоизирует чтения
  // formState — Proxy, на котором RHF строит подписку, — и ошибки валидации перестают
  // появляться. Ловится E2E «без согласий, доставки и телефона заказ не уходит».
  // eslint-disable-next-line react-hooks/incompatible-library
  const phone = watch("phone");
  const subtotal = cartTotal(orderItems);
  const total = subtotal + (delivery?.cost ?? 0);

  const { mutate: submitOrder, isPending: isSubmittingOrder } = useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const result = await createOrderPayment(input);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      window.location.href = result.confirmationUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить заказ. Попробуйте ещё раз.");
    },
  });

  function handleOrderSubmit(values: OrderValues) {
    if (!delivery || !phoneConfirmed) return;
    submitOrder({
      items: orderItems.map((item) => ({ productId: item.productId, qty: item.qty })),
      customer: {
        lastName: values.lastName,
        firstName: values.firstName,
        email: values.email,
        phone: values.phone,
      },
      delivery: {
        provider: delivery.provider,
        type: delivery.type,
        label: delivery.label,
        address: delivery.address,
        cost: delivery.cost,
        pvzCode: delivery.pvzCode,
        city: delivery.city,
        cityCode: delivery.cityCode,
        tariffCode: delivery.tariffCode,
      },
      consents: {
        personalData: values.consentPersonalData,
        offer: values.consentOffer,
        marketing: values.consentMarketing,
      },
    });
  }

  return (
    <>
      {deliveryMounted && (
        // hidden на обёртке, а не на самой <section>: у секций есть утилиты flex, а они
        // перебивают `[hidden] { display: none }` из preflight Tailwind по порядку правил.
        <div hidden={!showDelivery}>
          <DeliveryPicker
            items={orderItems.map((item) => ({ productId: item.productId, qty: item.qty }))}
            onApply={(d) => {
              setDelivery(d);
              setShowDelivery(false);
            }}
            onBack={() => setShowDelivery(false)}
          />
        </div>
      )}
      <div hidden={showDelivery}>
        <section className="relative isolate flex min-h-[75vh] items-stretch justify-center overflow-hidden sm:items-center sm:px-5 sm:py-16">
          <Backdrop />

          <div className="relative w-full bg-paper-50 px-5 py-8 sm:max-w-[620px] sm:rounded-card sm:bg-paper-50/95 sm:p-8 sm:shadow-[0_40px_80px_-32px_rgba(28,20,16,0.35)] sm:backdrop-blur-sm md:p-10">
            {orderItems.length === 0 ? (
              <div>
                <SectionTitle as="h1" className="text-[32px]">Оформление заказа</SectionTitle>
                <p className="mt-4 text-ink-600">В корзине пока пусто.</p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-block border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
                >
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  setSubmitAttempted(true);
                  return handleSubmit(handleOrderSubmit)(e);
                }}
                noValidate
              >
                <SectionTitle as="h1" className="text-[32px]">Оформление заказа</SectionTitle>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Field label="Фамилия" error={errors.lastName?.message} {...register("lastName")} />
                  <Field label="Имя" error={errors.firstName?.message} {...register("firstName")} />
                </div>

                <div className="mt-5 flex flex-col gap-5">
                  <Field
                    label="you@mail.ru"
                    type="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                          <PhoneInput
                            className="min-w-0 flex-1"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled={phoneConfirmed}
                          />
                        )}
                      />
                      {phoneConfirmed ? (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-2 text-sm font-medium text-brand-dark">
                          <CheckIcon size={14} strokeWidth={3} />
                          Подтверждён
                        </span>
                      ) : (
                        <PhoneConfirmDialog
                          phone={phone}
                          validate={() => trigger("phone")}
                          onConfirmed={() => {
                            setConfirmedByCall(true);
                            // Подтверждение заводит сессию на сервере — перечитываем, иначе
                            // шапка до перезагрузки страницы показывает гостя.
                            refetchSession();
                          }}
                        />
                      )}
                    </div>
                    {errors.phone ? (
                      <p className="mt-1.5 text-sm text-brand-dark">{errors.phone.message}</p>
                    ) : (
                      submitAttempted &&
                      !phoneConfirmed && <p className="mt-1.5 text-sm text-brand-dark">Подтвердите телефон</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMounted(true);
                    setShowDelivery(true);
                  }}
                  className="mt-5 flex w-full cursor-pointer items-center justify-between gap-4 rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-left transition-colors hover:border-brand"
                >
                  {delivery ? (
                    <span className="min-w-0 truncate text-[15px]">
                      <span className="text-ink-600">Способ доставки: </span>
                      {delivery.label} · {formatDeliveryCost(delivery.cost)}
                    </span>
                  ) : (
                    <span className="text-ink-600">Способ доставки</span>
                  )}
                  <span className="shrink-0 rounded-full bg-paper-100 px-4 py-2 text-sm font-medium">
                    {delivery ? "Изменить" : "На карте"}
                  </span>
                </button>
                {submitAttempted && !delivery && (
                  <p className="mt-1.5 text-sm text-brand-dark">Выберите способ доставки</p>
                )}

                <div className="mt-5 flex flex-col gap-3">
                  <Controller
                    control={control}
                    name="consentPersonalData"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-start gap-3 text-[15px]">
                        <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                        <span>
                          Согласен на <ConsentLink href="/privacy">обработку персональных данных</ConsentLink> для
                          оформления и доставки заказа
                        </span>
                      </label>
                    )}
                  />
                  {errors.consentPersonalData && (
                    <p className="-mt-2 text-sm text-brand-dark">{errors.consentPersonalData.message}</p>
                  )}

                  <Controller
                    control={control}
                    name="consentOffer"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-start gap-3 text-[15px]">
                        <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                        <span>
                          Ознакомлен с <ConsentLink href="/oferta">офертой</ConsentLink> и{" "}
                          <ConsentLink href="/return">условиями возврата</ConsentLink>
                        </span>
                      </label>
                    )}
                  />
                  {errors.consentOffer && (
                    <p className="-mt-2 text-sm text-brand-dark">{errors.consentOffer.message}</p>
                  )}

                  <Controller
                    control={control}
                    name="consentMarketing"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink-600">
                        <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                        <span>Хочу получать новости и предложения рассылкой (необязательно)</span>
                      </label>
                    )}
                  />
                </div>

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
                    <p>Доставка: {delivery ? formatDeliveryCost(delivery.cost) : "не указана"}</p>
                    <p className="font-display text-2xl font-semibold text-ink-900">
                      Итог: {formatPrice(total)}
                    </p>
                  </div>
                  <ArrowButton type="submit" disabled={isSubmittingOrder}>
                    {isSubmittingOrder ? "Переходим к оплате…" : "Оформить заказ"}
                  </ArrowButton>
                </div>

                <LegalLinks />
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Ссылка из текста чекбокса согласия. Новая вкладка — иначе переход стёр бы заполненную форму.
 * Клик по ней не переключает чекбокс: активация label не идёт на интерактивных потомках.
 */
function ConsentLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-brand-dark"
    >
      {children}
    </Link>
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
