import { SectionTitle, CheckIcon } from "@/shared/ui";

export function DoneStep() {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
        <CheckIcon size={28} strokeWidth={2.5} />
      </div>
      <SectionTitle className="mt-6">Вы вошли</SectionTitle>
      <p className="mt-3 text-ink-600">Переходим в личный кабинет…</p>
    </div>
  );
}
