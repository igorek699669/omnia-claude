import { Skeleton } from "@/shared/ui";

export default function ProductLoading() {
  return (
    <section
      role="status"
      aria-label="Загружаем инструмент"
      className="mx-auto max-w-[1440px] px-5 py-16 md:px-12"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-card" />

        <div>
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="mt-5 h-14 w-4/5" />

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-ink-900/10 py-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-2 h-5 w-32" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-8 h-11 w-52" />
          <Skeleton className="mt-8 h-14 w-64 rounded-full" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    </section>
  );
}
