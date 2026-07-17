"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, ArrowButton } from "@/shared/ui";
import { authClient, useSession } from "@/shared/lib/auth-client";

type Step = "email" | "code" | "done";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: "Неверный код — проверьте и попробуйте ещё раз",
  OTP_EXPIRED: "Код истёк — запросите новый",
  TOO_MANY_ATTEMPTS: "Слишком много попыток — запросите новый код",
};

export function AuthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session) router.replace("/profile");
  }, [session, router]);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Похоже, в адресе опечатка — проверьте и попробуйте ещё раз");
      return;
    }
    setError(null);
    setPending(true);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setPending(false);
    if (sendError) {
      setError(ERROR_MESSAGES[sendError.code ?? ""] ?? "Не получилось отправить код — попробуйте ещё раз");
      return;
    }
    setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Код состоит из 6 цифр");
      return;
    }
    setError(null);
    setPending(true);
    const { error: signInError } = await authClient.signIn.emailOtp({ email, otp: code });
    setPending(false);
    if (signInError) {
      setError(ERROR_MESSAGES[signInError.code ?? ""] ?? "Не получилось войти — попробуйте ещё раз");
      return;
    }
    setStep("done");
  }

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col justify-center px-5 py-16">
      {step === "email" && (
        <form onSubmit={submitEmail} noValidate>
          <SectionTitle>Вход или регистрация</SectionTitle>
          <p className="mt-4 text-ink-600">
            Укажите почту — пришлём на неё код подтверждения. Пароль не нужен.
          </p>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-8 w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 text-lg outline-none transition-colors focus:border-brand"
          />
          {error && <p className="mt-3 text-sm text-brand-dark">{error}</p>}
          <div className="mt-6">
            <ArrowButton type="submit" disabled={pending}>
              {pending ? "Отправляем…" : "Получить код"}
            </ArrowButton>
          </div>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={submitCode} noValidate>
          <SectionTitle>Введите код</SectionTitle>
          <p className="mt-4 text-ink-600">
            Отправили 6-значный код на <b className="text-ink-900">{email}</b>. Письмо может
            попасть в «Промоакции» или спам.
          </p>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mt-8 w-full rounded-input border border-ink-900/18 bg-white px-5 py-4 text-center font-display text-3xl tracking-[0.5em] outline-none transition-colors focus:border-brand"
          />
          {error && <p className="mt-3 text-sm text-brand-dark">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <ArrowButton type="submit" disabled={pending}>
              {pending ? "Проверяем…" : "Войти"}
            </ArrowButton>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setCode("");
              }}
              className="cursor-pointer border-b border-ink-900/25 py-2 text-[15px] font-medium text-ink-600 transition-colors hover:border-brand hover:text-ink-900"
            >
              Изменить почту
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <SectionTitle className="mt-6">Вы вошли</SectionTitle>
          <p className="mt-3 text-ink-600">Переходим в личный кабинет…</p>
        </div>
      )}
    </section>
  );
}
