import { Tag, SectionTitle } from "@/shared/ui";

const points = [
  ["Отвечаем за сохранность и качество", "Принимаем ответственность за инструмент до момента получения — проверим строй и состояние перед отправкой."],
  ["Индивидуальные заказы без переплаты", "Соберём инструмент под ваш строй и звукоряд без наценки за индивидуальность."],
  ["Цены без посредников", "Вы не оплачиваете цепочку перекупщиков — от мастерской это выгоднее и для вас, и для нас."],
  ["Мастерская, а не конвейер", "Делаем для людей: каждый инструмент проходит ручную настройку и отслушивается мастером."],
] as const;

export function Firsthand() {
  return (
    <section className="px-3 md:px-6">
      <div className="rounded-card bg-paper-100">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-12">
          <Tag>Гарантия качества</Tag>
          <SectionTitle className="mt-5">Инструменты из первых рук</SectionTitle>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {points.map(([title, text]) => (
              <div key={title} className="flex flex-col gap-2.5 rounded-[28px] bg-white p-8">
                <h3 className="font-display text-[21px] font-medium leading-tight">{title}</h3>
                <p className="text-[15px] text-ink-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
