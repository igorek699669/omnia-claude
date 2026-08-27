"use client";

import { PhoneIcon, Spinner } from "@/shared/ui";
import { formatPhone } from "@/shared/lib";
import type { PendingCall } from "./use-call-check";

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Экран ожидания звонка: покупатель звонит с подтверждаемого номера на выданный SMS.ru,
 * звонок сбрасывается, и опрос в useCallCheck ловит подтверждение.
 *
 * Кнопка «Позвонить» — ссылка tel:, на мобильном она открывает набор номера; на десктопе
 * покупатель набирает номер на телефоне, поэтому номер показан текстом рядом с кнопкой.
 */
export function CallStep({
  phone,
  call,
  secondsLeft,
}: {
  /** Подтверждаемый номер в E.164 — тот, с которого надо звонить. */
  phone: string;
  call: PendingCall;
  secondsLeft: number;
}) {
  return (
    <div>
      <p className="text-ink-600">
        Позвоните с номера <b className="text-ink-900">{formatPhone(phone)}</b> на наш номер.
        Отвечать не нужно — мы сбросим звонок и сразу вас впустим. Звонок бесплатный.
      </p>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-input border border-ink-900/18 bg-white px-5 py-5">
        <span className="font-display text-3xl font-medium tracking-tight text-ink-900">
          {call.callPhonePretty}
        </span>
        <a
          href={`tel:${call.callPhone}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <PhoneIcon size={16} />
          Позвонить
        </a>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-5 flex items-center justify-center gap-3 text-ink-600"
      >
        <Spinner />
        Ждём звонка… {formatCountdown(secondsLeft)}
      </div>
    </div>
  );
}
