"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { SectionTitle, ArrowButton } from "@/shared/ui";
import { authClient } from "@/shared/lib/auth-client";
import { errorMessage } from "../error-messages";

const codeSchema = z.object({
  code: z.string().length(6, "Код состоит из 6 цифр"),
});
type CodeValues = z.infer<typeof codeSchema>;

export function CodeStep({
  email,
  onVerified,
  onChangeEmail,
}: {
  email: string;
  onVerified: () => void;
  onChangeEmail: () => void;
}) {
  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const verifyOtp = useMutation({
    mutationFn: async (otp: string) => {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) throw error;
    },
    onSuccess: onVerified,
  });

  const error =
    form.formState.errors.code?.message ??
    (verifyOtp.error ? errorMessage(verifyOtp.error, "Не получилось войти — попробуйте ещё раз") : null);

  return (
    <form onSubmit={form.handleSubmit((values) => verifyOtp.mutate(values.code))} noValidate>
      <SectionTitle>Введите код</SectionTitle>
      <p className="mt-4 text-ink-600">
        Отправили 6-значный код на <b className="text-ink-900">{email}</b>. Письмо может попасть в
        «Промоакции» или спам.
      </p>
      <Controller
        control={form.control}
        name="code"
        render={({ field }) => (
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={field.value}
            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mt-8 w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 text-center font-display text-3xl tracking-[0.5em] outline-none transition-colors focus:border-brand"
          />
        )}
      />
      {error && <p className="mt-3 text-sm text-brand-dark">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <ArrowButton type="submit" disabled={verifyOtp.isPending}>
          {verifyOtp.isPending ? "Проверяем…" : "Войти"}
        </ArrowButton>
        <button
          type="button"
          onClick={onChangeEmail}
          className="cursor-pointer border-b border-ink-900/25 py-2 text-[15px] font-medium text-ink-600 transition-colors hover:border-brand hover:text-ink-900"
        >
          Изменить почту
        </button>
      </div>
    </form>
  );
}
