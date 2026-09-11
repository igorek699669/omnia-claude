import Image from "next/image";
import { HandpanArt } from "./assets/HandpanArt";

/**
 * Квадратная миниатюра инструмента для списков: корзина, чекаут, заказы в кабинете.
 *
 * Кадр приходит снаружи структурным типом, а не ProductMedia из entities: shared о доменных
 * сущностях знать не должен. Без кадра рисуется HandpanArt — у заказа со снятым с продажи
 * товаром фото взять неоткуда, а строка списка обязана отрисоваться.
 */
export function ProductThumb({
  image,
  size,
  className = "rounded-2xl",
}: {
  image?: { url: string; alt: string };
  /** Сторона в пикселях: по ней же считается, какой размер запросить у оптимизатора. */
  size: number;
  /** Скругление задаётся целиком отсюда: два класса rounded-* в одной строке конфликтуют. */
  className?: string;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden bg-paper-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <HandpanArt className="h-3/4 w-3/4" />
      )}
    </div>
  );
}
