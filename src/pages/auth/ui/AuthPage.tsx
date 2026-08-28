"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/lib";
import { Spinner, SectionTitle } from "@/shared/ui";
import { CallStep, useCallCheck } from "@/features/phone-auth";
import { PhoneStep } from "./components/PhoneStep";
import { DoneStep } from "./components/DoneStep";

export function AuthPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [isDone, setIsDone] = useState(false);
  const [phone, setPhone] = useState("");
  const { start, isStarting, call, secondsLeft, reset } = useCallCheck(() => {
    setIsDone(true);
    refetch();
  });

  useEffect(() => {
    if (session) router.replace("/profile");
  }, [session, router]);

  const isCheckingSession = !isDone && (isPending || Boolean(session));

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col justify-center px-5 py-16">
      {isDone ? (
        <DoneStep />
      ) : isCheckingSession ? (
        <div role="status" className="flex items-center justify-center gap-3 text-ink-600">
          <Spinner />
          {session ? "Переходим в личный кабинет…" : "Проверяем, вошли ли вы…"}
        </div>
      ) : call ? (
        <div>
          <SectionTitle>Позвоните нам</SectionTitle>
          <div className="mt-4">
            <CallStep phone={phone} call={call} secondsLeft={secondsLeft} />
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-6 cursor-pointer border-b border-ink-900/25 py-2 text-[15px] font-medium text-ink-600 transition-colors hover:border-brand hover:text-ink-900"
          >
            Изменить номер
          </button>
        </div>
      ) : (
        <PhoneStep
          isPending={isStarting}
          onSubmit={(submitted) => {
            setPhone(submitted);
            start(submitted);
          }}
        />
      )}
    </section>
  );
}
