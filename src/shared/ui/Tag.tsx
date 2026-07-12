export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-ink-900/10 bg-paper-100 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-600">
      <span className="size-[7px] rounded-full bg-brand" />
      {children}
    </span>
  );
}
