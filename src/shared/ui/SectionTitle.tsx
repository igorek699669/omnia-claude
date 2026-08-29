/**
 * Крупный заголовок секции. По умолчанию h2; `as="h1"` — там, где это главный заголовок
 * страницы: без него у каталога и служебных страниц не было h1 вообще.
 */
export function SectionTitle({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={`text-balance font-display text-[clamp(32px,3.4vw,48px)] font-medium leading-[1.08] tracking-tight ${className}`}
    >
      {children}
    </Tag>
  );
}
