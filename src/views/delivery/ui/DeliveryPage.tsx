import { Tag, SectionTitle } from "@/shared/ui";

export function DeliveryPage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Доставка</Tag>
      <SectionTitle className="mt-5">Доставка и оплата</SectionTitle>

      <div className="mt-10 flex flex-col gap-10 text-[17px] leading-relaxed">
        <Block title="Как мы отправляем">
          Каждый инструмент едет в жёстком кофре (входит в стоимость) внутри плотного
          короба с амортизацией по контуру. Отправляем СДЭК — до двери или до пункта
          выдачи, на ваш выбор.
        </Block>
        <Block title="Сроки и стоимость">
          Стоимость доставки рассчитывается автоматически при оформлении заказа по
          тарифам СДЭК — вы увидите её до оплаты. Сроки по России — обычно от 2 до 7 дней
          в зависимости от региона.
        </Block>
        <Block title="Отслеживание">
          После передачи инструмента в доставку трек-номер и статус заказа появляются
          в вашем личном кабинете. Продублируем ссылку на отслеживание на почту.
        </Block>
        <Block title="Оплата">
          Оплатить заказ можно картой онлайн (ЮKassa) или связаться с нами в
          Telegram/WhatsApp, если удобнее обсудить детали перед покупкой.
        </Block>
        <Block title="Если что-то пошло не так">
          Мы отвечаем за сохранность инструмента до момента получения. При повреждении
          в доставке — фиксируйте на видео при вскрытии и напишите нам: заменим или починим.
        </Block>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-2xl font-medium">{title}</h2>
      <p className="text-ink-600">{children}</p>
    </div>
  );
}
