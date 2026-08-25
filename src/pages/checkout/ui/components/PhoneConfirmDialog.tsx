"use client";

import { useEffect } from "react";
import { normalizePhone } from "@/shared/lib";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/shared/ui";
import { CallStep, useCallCheck } from "@/features/phone-auth";

/**
 * Подтверждение телефона прямо на чекауте — тем же входящим звонком, что и на /auth.
 *
 * Подтверждение не только помечает номер проверенным, но и заводит сессию (Better Auth
 * создаёт пользователя при первом подтверждении) — гость, оформивший заказ, заодно
 * получает личный кабинет с историей заказов.
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
  const { start, isStarting, call, secondsLeft, reset } = useCallCheck(onConfirmed);
  const normalized = normalizePhone(phone);

  // Пока ждём звонка, покупатель может поправить номер в форме — тогда проверка
  // относится уже не к тому номеру, и её надо сбросить.
  useEffect(() => {
    if (call) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  async function handleClick() {
    const valid = await validate();
    if (!valid) return;
    start(normalized);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isStarting}
        className="shrink-0 cursor-pointer rounded-full bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
      >
        {isStarting ? "Готовим…" : "Подтвердить"}
      </button>

      <Dialog open={Boolean(call)} onOpenChange={(open) => !open && reset()}>
        <DialogContent>
          <DialogTitle className="font-display text-2xl font-medium">Позвоните нам</DialogTitle>
          {call && (
            <div className="mt-3">
              <CallStep phone={normalized} call={call} secondsLeft={secondsLeft} />
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <DialogClose asChild>
              <button
                type="button"
                className="cursor-pointer border-b border-ink-900/25 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand hover:text-ink-900"
              >
                Отмена
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
