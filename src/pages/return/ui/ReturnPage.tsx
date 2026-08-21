import Link from "next/link";
import { Tag, SectionTitle, LegalBlock } from "@/shared/ui";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, SELLER_CLAIMS_ADDRESS, SELLER_RESPONSE_TIME } from "@/shared/lib";

export function ReturnPage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Документы</Tag>
      <SectionTitle className="mt-5">Возврат и обмен</SectionTitle>

      <div className="mt-10 flex flex-col gap-10 text-[17px] leading-relaxed">
        <LegalBlock title="Возврат товара надлежащего качества">
          <p>
            По ст. 26.1 Закона РФ №2300-1 «О защите прав потребителей» вы вправе отказаться
            от товара в течение 7 дней после получения, если сохранены его товарный вид,
            комплектация и потребительские свойства.
          </p>
          <p>
            Согласно временному порядку, разъяснённому Роспотребнадзором в апреле 2026 года
            во исполнение Постановления Конституционного суда РФ №7-П от 17.02.2026, вернуть
            товар можно любым удобным способом, включая отправку через перевозчика — если
            продавец может проверить состояние товара при получении.
          </p>
          <p>
            Стоимость обратной пересылки при возврате товара надлежащего качества оплачивает
            Покупатель, если иное не согласовано отдельно.
          </p>
        </LegalBlock>

        <LegalBlock title="Возврат товара ненадлежащего качества">
          <p>
            Если инструмент повреждён в доставке или не соответствует описанию — зафиксируйте
            это на видео при вскрытии посылки и напишите нам. Обратную пересылку в этом
            случае оплачивает Продавец; по договорённости — заменим товар или вернём деньги.
          </p>
        </LegalBlock>

        <LegalBlock title="Как оформить возврат">
          <p>
            Адрес возврата: {SELLER_CLAIMS_ADDRESS}. Перед отправкой напишите на{" "}
            <a href={CONTACT_EMAIL_HREF} className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              {CONTACT_EMAIL}
            </a>{" "}
            с номером заказа — мы согласуем способ и подскажем детали. Отвечаем {SELLER_RESPONSE_TIME}.
          </p>
          <p>
            Возврат денег — на способ оплаты, использованный при заказе, в срок,
            установленный ст. 22 Закона РФ №2300-1.
          </p>
        </LegalBlock>

        <LegalBlock title="Обмен">
          <p>
            Обмен инструмента на другую модель проходит как возврат оплаченного заказа и
            оформление нового —{" "}
            <Link href="/catalog" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              каталог
            </Link>{" "}
            открыт для нового заказа сразу после подтверждения возврата.
          </p>
        </LegalBlock>
      </div>
    </section>
  );
}
