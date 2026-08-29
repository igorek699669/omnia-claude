/**
 * Прямоугольник-заглушка под контент, который ещё грузится: размеры и радиус задаются
 * снаружи классами, здесь только цвет и пульсация (отключается при prefers-reduced-motion).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-ink-900/8 motion-reduce:animate-none ${className}`}
    />
  );
}
