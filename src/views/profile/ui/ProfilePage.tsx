import { Tag, SectionTitle } from "@/shared/ui";

/** Мок-заказы. TODO: реальные заказы из Payload + статусы СДЭК — см. CLAUDE.md */
const orders = [
  {
    id: "OM-1042",
    date: "28 июня 2026",
    product: "Танцующие волны · D Kurd",
    status: "В пути",
    track: "1054893201",
  },
  {
    id: "OM-0987",
    date: "3 мая 2026",
    product: "Утренний туман · Celtic Minor",
    status: "Доставлен",
    track: "1049112458",
  },
];

export function ProfilePage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Личный кабинет</Tag>
      <SectionTitle className="mt-5">Мои заказы</SectionTitle>

      <div className="mt-10 flex flex-col gap-5">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[28px] bg-white p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-medium">Заказ {order.id}</h2>
              <span className="text-sm text-ink-600">{order.date}</span>
            </div>
            <p className="mt-2 text-ink-600">{order.product}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ink-900/10 pt-5 text-[15px]">
              <span>
                Статус:{" "}
                <b className={order.status === "Доставлен" ? "text-ink-900" : "text-brand-dark"}>
                  {order.status}
                </b>
              </span>
              <span>
                Трек-номер СДЭК:{" "}
                <a
                  href={`https://www.cdek.ru/ru/tracking?order_id=${order.track}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline decoration-ink-900/25 underline-offset-4 transition-colors hover:text-brand-dark"
                >
                  {order.track}
                </a>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
