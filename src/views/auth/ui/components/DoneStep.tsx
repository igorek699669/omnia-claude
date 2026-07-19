import { SectionTitle } from "@/shared/ui";

export function DoneStep() {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <SectionTitle className="mt-6">Вы вошли</SectionTitle>
      <p className="mt-3 text-ink-600">Переходим в личный кабинет…</p>
    </div>
  );
}
