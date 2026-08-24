"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/lib";
import { Spinner } from "@/shared/ui";
import { PhoneStep } from "./components/PhoneStep";
import { CodeStep } from "./components/CodeStep";
import { DoneStep } from "./components/DoneStep";

type Step = "phone" | "code" | "done";

export function AuthPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (session) router.replace("/profile");
  }, [session, router]);

  // Пока сессия проверяется — форму не показываем: иначе уже вошедший пользователь
  // на миг видит экран входа, и его тут же уносит в кабинет. Шаг "done" исключён:
  // там сессия уже появилась, и DoneStep сам сообщает о переходе в кабинет.
  const isCheckingSession = step !== "done" && (isPending || Boolean(session));

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col justify-center px-5 py-16">
      {isCheckingSession ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 text-ink-600"
        >
          <Spinner />
          {session ? "Переходим в личный кабинет…" : "Проверяем, вошли ли вы…"}
        </div>
      ) : (
        <>
          {step === "phone" && (
            <PhoneStep
              onSent={(sentPhone) => {
                setPhone(sentPhone);
                setStep("code");
              }}
            />
          )}
          {step === "code" && (
            <CodeStep phone={phone} onVerified={() => setStep("done")} onChangePhone={() => setStep("phone")} />
          )}
        </>
      )}
      {step === "done" && <DoneStep />}
    </section>
  );
}
