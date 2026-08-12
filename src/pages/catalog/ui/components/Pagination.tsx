import Link from "next/link";

function hrefFor(base: URLSearchParams, page: number) {
  const params = new URLSearchParams(base);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

function getPageList(current: number, total: number): (number | "...")[] {
  const delta = 1;
  const list: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      list.push(i);
    } else if (list[list.length - 1] !== "...") {
      list.push("...");
    }
  }
  return list;
}

export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const base = new URLSearchParams(
    Object.entries(searchParams).filter(
      (entry): entry is [string, string] => entry[1] != null && entry[0] !== "page",
    ),
  );
  const pages = getPageList(page, totalPages);

  return (
    <nav aria-label="Пагинация" className="mt-12 flex items-center justify-center gap-2">
      <PageLink href={hrefFor(base, page - 1)} disabled={page <= 1} aria-label="Предыдущая страница">
        ‹
      </PageLink>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-ink-600">
            …
          </span>
        ) : (
          <PageLink key={p} href={hrefFor(base, p)} current={p === page}>
            {p}
          </PageLink>
        ),
      )}
      <PageLink href={hrefFor(base, page + 1)} disabled={page >= totalPages} aria-label="Следующая страница">
        ›
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  current,
  disabled,
  children,
  ...rest
}: {
  href: string;
  current?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<"a">) {
  if (disabled) {
    return (
      <span aria-disabled className="grid size-10 place-items-center rounded-full text-ink-600/40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`grid size-10 place-items-center rounded-full text-[15px] font-medium transition-colors ${
        current
          ? "bg-brand text-white"
          : "border border-ink-900/20 hover:border-brand hover:text-brand-dark"
      }`}
      {...rest}
    >
      {children}
    </Link>
  );
}
