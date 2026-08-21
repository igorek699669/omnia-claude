import { Tag, SectionTitle, LegalBlock } from "@/shared/ui";
import {
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  SELLER_LEGAL_NAME,
  SELLER_TAX_STATUS,
  SELLER_INN,
  SELLER_CLAIMS_ADDRESS,
  SELLER_WORK_HOURS,
  SELLER_RESPONSE_TIME,
} from "@/shared/lib";

export function RequisitesPage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Реквизиты</Tag>
      <SectionTitle className="mt-5">Контакты и реквизиты</SectionTitle>

      <div className="mt-10 flex flex-col gap-10 text-[17px] leading-relaxed">
        <LegalBlock title="Продавец">
          <p>{SELLER_LEGAL_NAME}</p>
          <p>Статус: {SELLER_TAX_STATUS}</p>
          <p>ИНН: {SELLER_INN}</p>
        </LegalBlock>

        <LegalBlock title="Связь">
          <p>
            Телефон:{" "}
            <a href={CONTACT_PHONE_HREF} className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              {CONTACT_PHONE}
            </a>
          </p>
          <p>
            E-mail:{" "}
            <a href={CONTACT_EMAIL_HREF} className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>Режим работы: {SELLER_WORK_HOURS}</p>
          <p>Срок ответа на обращения: {SELLER_RESPONSE_TIME}</p>
        </LegalBlock>

        <LegalBlock title="Претензии и возврат">
          <p>Адрес для направления претензий и возврата товара: {SELLER_CLAIMS_ADDRESS}</p>
        </LegalBlock>
      </div>
    </section>
  );
}
