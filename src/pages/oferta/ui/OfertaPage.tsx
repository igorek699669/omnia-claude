import Link from "next/link";
import { Tag, SectionTitle, LegalBlock } from "@/shared/ui";
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  SELLER_LEGAL_NAME,
  SELLER_TAX_STATUS,
  SELLER_INN,
} from "@/shared/lib";

export function OfertaPage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Документы</Tag>
      <SectionTitle as="h1" className="mt-5">Публичная оферта</SectionTitle>
      <p className="mt-4 text-sm text-ink-600">Действует в редакции от 25.08.2026.</p>

      <div className="mt-10 flex flex-col gap-10 text-[17px] leading-relaxed">
        <LegalBlock title="1. Предмет оферты">
          <p>
            {SELLER_LEGAL_NAME} ({SELLER_TAX_STATUS}, ИНН {SELLER_INN}), далее «Продавец»,
            предлагает любому физическому лицу, далее «Покупатель», заключить договор
            розничной купли-продажи товаров — хангов, глюкофонов и RAV-драмов ручной
            работы — на условиях, изложенных в настоящей оферте.
          </p>
        </LegalBlock>

        <LegalBlock title="2. Цена товара">
          <p>
            Цена товара указывается в карточке товара на сайте в рублях РФ. Продавец
            применяет специальный налоговый режим «Налог на профессиональный доход», НДС
            не начисляется. Продавец вправе изменить цену до момента оформления заказа
            Покупателем — цена, зафиксированная в оформленном и оплаченном заказе, изменению
            не подлежит.
          </p>
        </LegalBlock>

        <LegalBlock title="3. Момент заключения договора">
          <p>
            Размещение товара на сайте — публичное предложение (оферта) в значении ст. 437
            ГК РФ. Договор считается заключённым с момента подтверждения заказа Покупателем
            на странице оформления и внесения оплаты через ЮKassa.
          </p>
        </LegalBlock>

        <LegalBlock title="4. Порядок оплаты и доставки">
          <p>
            Оплата — банковской картой онлайн через ЮKassa. Продавец применяет специальный
            налоговый режим «Налог на профессиональный доход» и не применяет
            контрольно-кассовую технику: чек формируется в приложении «Мой налог» и
            направляется Покупателю на адрес электронной почты, указанный при оформлении
            заказа. Доставка осуществляется
            транспортной компанией СДЭК: до пункта выдачи или курьером, по выбору
            Покупателя на этапе оформления заказа. Условия и сроки — на странице{" "}
            <Link href="/delivery" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              «Доставка и оплата»
            </Link>
            .
          </p>
        </LegalBlock>

        <LegalBlock title="5. Возврат и обмен">
          <p>
            Условия возврата и обмена — на отдельной странице{" "}
            <Link href="/return" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              «Возврат и обмен»
            </Link>
            .
          </p>
        </LegalBlock>

        <LegalBlock title="6. Ответственность сторон">
          <p>
            Продавец отвечает за соответствие товара описанию на сайте и за его сохранность
            до момента передачи перевозчику. Покупатель отвечает за достоверность данных,
            указанных при оформлении заказа.
          </p>
        </LegalBlock>

        <LegalBlock title="7. Реквизиты продавца">
          <p>
            Полные реквизиты — на странице{" "}
            <Link href="/requisites" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              «Контакты и реквизиты»
            </Link>
            . По вопросам, связанным с настоящей офертой, пишите на{" "}
            <a href={CONTACT_EMAIL_HREF} className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalBlock>
      </div>
    </section>
  );
}
