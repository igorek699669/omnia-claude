import type { CollectionConfig } from "payload";

/**
 * Скелет по шагу 1 Roadmap — к чекауту не подключён (ЮKassa — шаг 3).
 * customerId — id пользователя Better Auth (текст, не relationship: авторизации не смешиваются).
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["customerId", "total", "status", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "customerId",
      type: "text",
      required: true,
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
  ],
};
