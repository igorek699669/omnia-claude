import type { CollectionConfig } from "payload";

/**
 * Подписки "уведомить о наличии". Создаются только через src/features/notify-me
 * (Local API, overrideAccess игнорирует access.create) — см. аналогичный комментарий в Orders.ts.
 * Рассылка писем и простановка notifiedAt — в afterChange-хуке Products при переходе stockQty 0 → >0.
 */
export const StockSubscriptions: CollectionConfig = {
  slug: "stock-subscriptions",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "product", "notifiedAt", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "notifiedAt",
      type: "date",
      admin: {
        readOnly: true,
        description: "Проставляется автоматически после отправки письма о поступлении.",
      },
    },
  ],
};
