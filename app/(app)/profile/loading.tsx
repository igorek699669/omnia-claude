import { Skeleton } from "@/shared/ui";

export default function ProfileLoading() {
  return (
    <section
      role="status"
      aria-label="Загружаем заказы"
      className="mx-auto max-w-[900px] px-5 py-16 md:px-12"
    >
      <Skeleton className="h-8 w-40 rounded-full" />
      <Skeleton className="mt-5 h-12 w-64" />

      <div className="mt-10 flex flex-col gap-5">
        {Array.from({ length: 2 }, (_, i) => (
          <article key={i} className="rounded-[28px] bg-white p-7">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-ink-900/10 pt-5">
              <Skeleton className="size-16 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="mt-5 flex items-center justify-between gap-8 border-t border-ink-900/10 pt-5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-44" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
