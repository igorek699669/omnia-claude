"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { authClient, errorMessage, normalizePhone, formatPhone } from "@/shared/lib";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/shared/ui";

const codeSchema = z.object({
  code: z.string().length(6, "Код состоит из 6 цифр"),
});
type CodeValues = z.infer<typeof codeSchema>;

/**
 * Подтверждение телефона прямо на чекауте тем же одноразовым кодом, что и на /auth.
 *
 * Успешная проверка кода не только помечает номер подтверждённым, но и заводит сессию
 * (Better Auth создаёт пользователя по первому верному коду) — гость, оформивший заказ,
 * заодно получает личный кабинет с историей заказов.
 */
export function PhoneConfirmDialog({
  phone,
  validate,
  onConfirmed,
}: {
  /** Значение поля в маске — наружу уходит нормализованным в E.164. */
  phone: string;
  validate: () => Promise<boolean>;
  onConfirmed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: normalizePhone(phone) });
      if (error) throw error;
    },
    onSuccess: () => {
      codeForm.reset();
      setOpen(true);
      toast.success("Код отправлен по SMS");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Не получилось отправить код — попробуйте ещё раз"));
    },
  });

  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.phoneNumber.verify({ phoneNumber: normalizePhone(phone), code });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      onConfirmed();
      toast.success("Телефон подтверждён");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Неверный код — проверьте и попробуйте ещё раз"));
    },
  });

  async function handleSendClick() {
    const valid = await validate();
    if (!valid) return;
    sendOtp();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSendClick}
        disabled={isSendingOtp}
        className="shrink-0 cursor-pointer rounded-full bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
      >
        {isSendingOtp ? "Отправляем…" : "Подтвердить"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="font-display text-2xl font-medium">Введите код подтверждения</DialogTitle>
          <p className="mt-3 text-ink-600">
            Мы отправили шестизначный код на <b className="text-ink-900">{formatPhone(normalizePhone(phone))}</b>
          </p>

          <form onSubmit={codeForm.handleSubmit((values) => verifyOtp(values.code))} className="mt-6">
            <Controller
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 text-center font-display text-2xl tracking-[0.4em] outline-none transition-colors focus:border-brand"
                />
              )}
            />
            {codeForm.formState.errors.code && (
              <p className="mt-2 text-sm text-brand-dark">{codeForm.formState.errors.code.message}</p>
            )}

            <div className="mt-6 flex items-center gap-5">
              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="flex-1 cursor-pointer rounded-full bg-brand px-6 py-3.5 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
              >
                {isVerifyingOtp ? "Проверяем…" : "Подтвердить"}
              </button>
              <DialogClose asChild>
                <button
                  type="button"
                  className="cursor-pointer border-b border-ink-900/25 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand hover:text-ink-900"
                >
                  Отмена
                </button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
