"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/lib/auth-client";
import { EmailStep } from "./components/EmailStep";
import { CodeStep } from "./components/CodeStep";
import { DoneStep } from "./components/DoneStep";

type Step = "email" | "code" | "done";

export function AuthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (session) router.replace("/profile");
  }, [session, router]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col justify-center px-5 py-16">
      {step === "email" && (
        <EmailStep
          onSent={(sentEmail) => {
            setEmail(sentEmail);
            setStep("code");
          }}
        />
      )}
      {step === "code" && (
        <CodeStep email={email} onVerified={() => setStep("done")} onChangeEmail={() => setStep("email")} />
      )}
      {step === "done" && <DoneStep />}
    </section>
  );
}
