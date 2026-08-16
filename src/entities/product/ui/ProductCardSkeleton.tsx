import { Skeleton } from "@/shared/ui";

/** Заглушка карточки товара на время загрузки — повторяет раскладку ProductCard. */
export function ProductCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white">
      <Skeleton className="aspect-[4/3] rounded-none" />

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8.5 w-44 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="size-8.5 rounded-full" />
            <Skeleton className="size-8.5 rounded-full" />
          </div>
        </div>

        <Skeleton className="mt-1 h-7 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="mt-1 h-8 w-40" />
        <Skeleton className="h-4 w-full" />

        <div className="mt-auto flex items-center gap-4 pt-2">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="size-12 rounded-full" />
        </div>
      </div>
    </article>
  );
}
