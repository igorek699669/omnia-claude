/**
 * Прямоугольник-заглушка под контент, который ещё грузится. Размеры и радиус
 * задаются снаружи классами — компонент отвечает только за цвет и пульсацию.
 * Пульсация отключается при prefers-reduced-motion.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-ink-900/8 motion-reduce:animate-none ${className}`}
    />
  );
}
