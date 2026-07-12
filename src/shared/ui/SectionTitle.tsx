export function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-balance font-display text-[clamp(32px,3.4vw,48px)] font-medium leading-[1.08] tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}
