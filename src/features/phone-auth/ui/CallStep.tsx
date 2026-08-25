"use client";

import { Spinner } from "@/shared/ui";
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
 * Кнопка — ссылка tel:, на мобильном она открывает набор номера; на десктопе покупатель
 * просто видит номер и набирает его на телефоне, поэтому номер продублирован текстом.
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

      <a
        href={`tel:${call.callPhone}`}
        className="mt-6 flex items-center justify-center rounded-input border border-ink-900/18 bg-white px-5 py-5 font-display text-3xl font-medium tracking-tight text-ink-900 transition-colors hover:border-brand"
      >
        {call.callPhonePretty}
      </a>

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
