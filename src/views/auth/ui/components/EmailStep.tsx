"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SectionTitle, ArrowButton } from "@/shared/ui";
import { authClient } from "@/shared/lib/auth-client";
import { errorMessage } from "../error-messages";

const emailSchema = z.object({
  email: z.string().min(1, "Укажите почту").email("Похоже, в адресе опечатка — проверьте и попробуйте ещё раз"),
});
type EmailValues = z.infer<typeof emailSchema>;

export function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const sendOtp = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (error) throw error;
      return email;
    },
    onSuccess: onSent,
  });

  const error =
    form.formState.errors.email?.message ??
    (sendOtp.error ? errorMessage(sendOtp.error, "Не получилось отправить код — попробуйте ещё раз") : null);

  return (
    <form onSubmit={form.handleSubmit((values) => sendOtp.mutate(values.email))} noValidate>
      <SectionTitle>Вход или регистрация</SectionTitle>
      <p className="mt-4 text-ink-600">
        Укажите почту — пришлём на неё код подтверждения. Пароль не нужен.
      </p>
      <input
        type="email"
        autoFocus
        placeholder="you@example.com"
        className="mt-8 w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 text-lg outline-none transition-colors focus:border-brand"
        {...form.register("email")}
      />
      {error && <p className="mt-3 text-sm text-brand-dark">{error}</p>}
      <div className="mt-6">
        <ArrowButton type="submit" disabled={sendOtp.isPending}>
          {sendOtp.isPending ? "Отправляем…" : "Получить код"}
        </ArrowButton>
      </div>
    </form>
  );
}
