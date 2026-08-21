export function LegalBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-2xl font-medium">{title}</h2>
      <div className="flex flex-col gap-3 text-ink-600">{children}</div>
    </div>
  );
}
