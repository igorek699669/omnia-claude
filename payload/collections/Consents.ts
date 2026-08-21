import type { CollectionConfig } from "payload";

/**
 * Лог согласий с чекаута (ФЗ №152-ФЗ, ст. 9): по каждому заказу фиксируем, какие из трёх
 * независимых чекбоксов были отмечены, версию текста, который видел покупатель, IP и
 * user-agent — это то, чем оператор доказывает наличие законного основания на обработку.
 * Создаётся только из src/features/checkout (Local API, overrideAccess игнорирует access.create),
 * см. аналогичный комментарий в Orders.ts. Записи не редактируются и не удаляются — это лог.
 */
export const Consents: CollectionConfig = {
  slug: "consents",
  admin: {
    useAsTitle: "orderId",
    defaultColumns: ["orderId", "personalData", "offer", "marketing", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "orderId",
      type: "text",
      required: true,
    },
    {
      name: "personalData",
      type: "checkbox",
      required: true,
      admin: { description: "Согласие на обработку персональных данных для оформления и доставки заказа" },
    },
    {
      name: "offer",
      type: "checkbox",
      required: true,
      admin: { description: "Ознакомлен с офертой и условиями возврата" },
    },
    {
      name: "marketing",
      type: "checkbox",
      required: true,
      admin: { description: "Согласие на рекламную рассылку — необязательное" },
    },
    {
      name: "textVersion",
      type: "text",
      required: true,
      admin: { description: "Версия текста чекбоксов, которую видел покупатель (CONSENT_TEXT_VERSION)" },
    },
    {
      name: "ip",
      type: "text",
    },
    {
      name: "userAgent",
      type: "text",
    },
  ],
};
