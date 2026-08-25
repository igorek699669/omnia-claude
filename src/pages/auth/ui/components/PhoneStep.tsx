"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SectionTitle, ArrowButton, PhoneInput } from "@/shared/ui";
import { normalizePhone, isValidRuPhone } from "@/shared/lib";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Укажите телефон")
    .refine(isValidRuPhone, "Введите номер полностью"),
});
type PhoneValues = z.infer<typeof phoneSchema>;

export function PhoneStep({
  onSubmit,
  isPending,
}: {
  /** Номер приходит уже в E.164 — маска нужна только человеку в поле. */
  onSubmit: (phone: string) => void;
  isPending: boolean;
}) {
  const form = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(normalizePhone(values.phone)))} noValidate>
      <SectionTitle>Вход или регистрация</SectionTitle>
      <p className="mt-4 text-ink-600">
        Укажите номер телефона — подтвердим его бесплатным звонком. Пароль и код не нужны.
      </p>
      <div className="mt-8">
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              autoFocus
              error={form.formState.errors.phone?.message}
            />
          )}
        />
      </div>
      <div className="mt-6">
        <ArrowButton type="submit" disabled={isPending}>
          {isPending ? "Готовим звонок…" : "Продолжить"}
        </ArrowButton>
      </div>
    </form>
  );
}
