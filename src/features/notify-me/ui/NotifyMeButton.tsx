"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { reachGoal, GOALS } from "@/shared/lib";
import { subscribeToRestock } from "../api/actions";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose, BellIcon } from "@/shared/ui";
import type { Product } from "@/entities/product";

const emailSchema = z.object({
  email: z.email("Введите корректную почту"),
});
type EmailValues = z.infer<typeof emailSchema>;

export function NotifyMeButton({
  product,
  variant = "icon",
}: {
  product: Product;
  variant?: "icon" | "pill";
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });

  const { mutate, isPending } = useMutation({
    mutationFn: (email: string) => subscribeToRestock(product.id, email),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      reset();
      reachGoal(GOALS.restockSubscribed, { product: product.slug });
      toast.success("Сообщим на почту, когда товар появится в наличии");
    },
    onError: () => toast.error("Не получилось оформить подписку — попробуйте ещё раз"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <button
            type="button"
            aria-label={`Уведомить о наличии «${product.name}»`}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-ink-900/20 text-ink-900 transition-colors hover:border-brand hover:text-brand-dark"
          >
            <BellIcon size={18} strokeWidth={1.8} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-3.5 rounded-full border border-ink-900/20 px-7 py-4 font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Уведомить о наличии
          </button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogTitle className="font-display text-2xl font-medium">Уведомить о наличии</DialogTitle>
        <p className="mt-3 text-ink-600">
          Оставьте почту — напишем, как только «{product.name}» снова появится в наличии.
        </p>

        <form onSubmit={handleSubmit((values) => mutate(values.email))} className="mt-6">
          <input
            type="email"
            autoFocus
            placeholder="you@example.com"
            {...register("email")}
            className="w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 outline-none transition-colors focus:border-brand"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-brand-dark">{errors.email.message}</p>
          )}

          <div className="mt-6 flex items-center gap-5">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 cursor-pointer rounded-full bg-brand px-6 py-3.5 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
            >
              {isPending ? "Отправляем…" : "Уведомить меня"}
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
  );
}
