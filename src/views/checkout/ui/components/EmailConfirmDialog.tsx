"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { authClient, errorMessage } from "@/shared/lib";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/shared/ui";

const codeSchema = z.object({
  code: z.string().length(6, "Код состоит из 6 цифр"),
});
type CodeValues = z.infer<typeof codeSchema>;

export function EmailConfirmDialog({
  email,
  validate,
  onConfirmed,
}: {
  email: string;
  validate: () => Promise<boolean>;
  onConfirmed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const sendOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (error) throw error;
    },
    onSuccess: () => {
      codeForm.reset();
      setOpen(true);
      toast.success(`Код отправлен на ${email}`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Не получилось отправить код — попробуйте ещё раз"));
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async (otp: string) => {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      onConfirmed();
      toast.success("Почта подтверждена");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Неверный код — проверьте и попробуйте ещё раз"));
    },
  });

  async function handleSendClick() {
    const valid = await validate();
    if (!valid) return;
    sendOtp.mutate();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSendClick}
        disabled={sendOtp.isPending}
        className="shrink-0 cursor-pointer rounded-full bg-paper-100 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-brand hover:text-white disabled:cursor-default disabled:opacity-50"
      >
        {sendOtp.isPending ? "Отправляем…" : "Подтвердить"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="font-display text-2xl font-medium">Введите код подтверждения</DialogTitle>
          <p className="mt-3 text-ink-600">
            Мы отправили шестизначный код на <b className="text-ink-900">{email}</b>
          </p>

          <form onSubmit={codeForm.handleSubmit((values) => verifyOtp.mutate(values.code))} className="mt-6">
            <Controller
              control={codeForm.control}
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
                disabled={verifyOtp.isPending}
                className="flex-1 cursor-pointer rounded-full bg-brand px-6 py-3.5 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
              >
                {verifyOtp.isPending ? "Проверяем…" : "Подтвердить"}
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
