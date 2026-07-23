import type { CollectionConfig } from "payload";

/**
 * Подключено к чекауту через src/features/checkout (ЮKassa, шаг 3 Roadmap).
 * customerId — id пользователя Better Auth (текст, не relationship: авторизации не смешиваются),
 * заполняется только если у покупателя уже была сессия на момент оформления — вход в чекауте
 * не требуется (guest checkout), контакты дублируются прямо в заказе.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["customerName", "total", "status", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    // Заказы создаёт только src/features/checkout через Local API (там overrideAccess
    // игнорирует это правило) — вручную завести заказ из админки/REST нельзя.
    create: () => false,
    update: ({ req: { user } }) => Boolean(user),
    // Финансовые записи не удаляются — отменённый заказ помечается статусом "cancelled".
    delete: () => false,
  },
  fields: [
    {
      name: "customerId",
      type: "text",
    },
    {
      name: "customerName",
      type: "text",
      required: true,
    },
    {
      name: "customerEmail",
      type: "text",
      required: true,
    },
    {
      name: "customerPhone",
      type: "text",
      required: true,
    },
    {
      name: "delivery",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "cost",
          type: "number",
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "qty",
          type: "number",
          required: true,
          min: 1,
        },
        {
          name: "price",
          type: "number",
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Ожидает оплаты", value: "pending" },
        { label: "Оплачен", value: "paid" },
        { label: "Отправлен", value: "shipped" },
        { label: "Доставлен", value: "delivered" },
        { label: "Отменён", value: "cancelled" },
      ],
    },
    {
      name: "paymentId",
      type: "text",
      unique: true,
      admin: {
        description: "id платежа ЮKassa — используется вебхуком для поиска заказа и идемпотентности",
      },
    },
  ],
};
