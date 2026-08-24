"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { SectionTitle, ArrowButton, PhoneInput } from "@/shared/ui";
import { authClient, errorMessage, normalizePhone, isValidRuPhone } from "@/shared/lib";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Укажите телефон")
    .refine(isValidRuPhone, "Введите номер полностью"),
});
type PhoneValues = z.infer<typeof phoneSchema>;

export function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const form = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: async (masked: string) => {
      // Наружу номер всегда уходит в E.164 — маска нужна только человеку в поле.
      const phone = normalizePhone(masked);
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
      if (error) throw error;
      return phone;
    },
    onSuccess: (phone) => {
      toast.success("Код отправлен по SMS");
      onSent(phone);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Не получилось отправить код — попробуйте ещё раз"));
    },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => sendOtp(values.phone))} noValidate>
      <SectionTitle>Вход или регистрация</SectionTitle>
      <p className="mt-4 text-ink-600">
        Укажите номер телефона — пришлём на него код в SMS. Пароль не нужен.
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
        <ArrowButton type="submit" disabled={isSendingOtp}>
          {isSendingOtp ? "Отправляем…" : "Получить код"}
        </ArrowButton>
      </div>
    </form>
  );
}
