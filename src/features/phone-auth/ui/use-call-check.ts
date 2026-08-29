"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { startPhoneCall, confirmPhoneByCall } from "../api/actions";

/** Столько же, сколько SMS.ru ждёт звонка. */
const WINDOW_SECONDS = 300;
/** Раз в столько секунд спрашиваем SMS.ru, дозвонился ли покупатель. */
const POLL_SECONDS = 3;

export interface PendingCall {
  callPhone: string;
  callPhonePretty: string;
  ticket: string;
}

/** Заводит проверку звонком и опрашивает её до подтверждения или конца пятиминутки. */
export function useCallCheck(onConfirmed: () => void) {
  const [call, setCall] = useState<PendingCall | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(WINDOW_SECONDS);

  // Колбэк меняется на каждом рендере родителя — держим в ref, чтобы смена не дёргала эффект.
  const onConfirmedRef = useRef(onConfirmed);
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  });

  const { mutate: start, isPending: isStarting } = useMutation({
    mutationFn: async (phone: string) => {
      const result = await startPhoneCall(phone);
      if (result.error || !result.ticket || !result.callPhone) {
        throw new Error(result.error ?? "Не получилось подготовить звонок");
      }
      return {
        callPhone: result.callPhone,
        callPhonePretty: result.callPhonePretty ?? result.callPhone,
        ticket: result.ticket,
      };
    },
    onSuccess: (pending) => {
      setSecondsLeft(WINDOW_SECONDS);
      setCall(pending);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Не получилось подготовить звонок");
    },
  });

  const reset = useCallback(() => setCall(null), []);

  const { data: check } = useQuery({
    // Ключ по билету: следующая попытка — другой билет, а значит чистый запрос.
    queryKey: ["phone-call-check", call?.ticket],
    queryFn: () => confirmPhoneByCall(call!.ticket),
    enabled: Boolean(call),
    refetchInterval: (query) => {
      const result = query.state.data;
      return result?.confirmed || result?.error ? false : POLL_SECONDS * 1000;
    },
    gcTime: 0,
    retry: false,
  });

  // Ожидание закончилось, как только пришёл ответ, который что-то решает. Отдельным
  // состоянием не дублируем: зеркалить ответ в useState — лишний рендер и риск расхождения.
  const isFinished = Boolean(check?.confirmed || check?.error);
  const pendingCall = isFinished ? null : call;

  useEffect(() => {
    if (!check) return;
    if (check.confirmed) {
      onConfirmedRef.current();
      return;
    }
    if (check.error) toast.error(check.error);
  }, [check]);

  useEffect(() => {
    if (!pendingCall) return;

    // Считаем от метки времени: в свёрнутой вкладке браузер придерживает таймеры, и
    // счётчик разошёлся бы с реальной пятиминуткой у SMS.ru.
    const deadline = Date.now() + WINDOW_SECONDS * 1000;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setCall(null);
        toast.error("Время на звонок вышло — попробуйте ещё раз");
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [pendingCall]);

  return { start, isStarting, call: pendingCall, secondsLeft, reset };
}
