import type { CollectionConfig } from "payload";
import { sendRestockEmail } from "../lib/mailer";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "scale", "price", "stockQty", "inStock"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    // inStock — производное поле: считается из stockQty, а не выставляется руками,
    // чтобы админ не забывал синхронизировать чекбокс с остатком.
    beforeChange: [
      ({ data }) => {
        if (data && typeof data.stockQty === "number") {
          data.inStock = data.stockQty > 0;
        }
        return data;
      },
    ],
    // Рассылка подписчикам "уведомить о наличии" ровно в момент, когда остаток
    // становится положительным (было 0/меньше — стало больше 0).
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        const wasOut = (previousDoc?.stockQty ?? 0) <= 0;
        const isNowIn = (doc.stockQty ?? 0) > 0;
        if (!previousDoc || !wasOut || !isNowIn) return doc;

        const pending = await req.payload.find({
          collection: "stock-subscriptions",
          where: {
            product: { equals: doc.id },
            notifiedAt: { exists: false },
          },
          limit: 500,
        });

        for (const sub of pending.docs) {
          try {
            await sendRestockEmail({ to: sub.email, productName: doc.name, productSlug: doc.slug });
            await req.payload.update({
              collection: "stock-subscriptions",
              id: sub.id,
              data: { notifiedAt: new Date().toISOString() },
            });
          } catch (err) {
            console.error(`[stock-subscriptions] не удалось отправить письмо ${sub.email}:`, err);
          }
        }

        return doc;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "soundCharacter",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "scale",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "scaleNotes",
      type: "text",
      required: true,
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "oldPrice",
      type: "number",
      min: 0,
    },
    {
      name: "notesCount",
      type: "number",
      required: true,
      min: 8,
      max: 14,
    },
    {
      name: "weightGrams",
      type: "number",
      required: true,
    },
    {
      name: "diameterCm",
      type: "number",
      required: true,
    },
    {
      name: "material",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "tuningHz",
      type: "select",
      required: true,
      defaultValue: "440",
      options: [
        { label: "440 Hz", value: "440" },
        { label: "432 Hz", value: "432" },
      ],
    },
    {
      name: "stockQty",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      admin: {
        description: "Сколько инструментов физически есть в наличии. Списывается автоматически при оплате заказа.",
      },
    },
    {
      name: "inStock",
      type: "checkbox",
      defaultValue: true,
      admin: {
        readOnly: true,
        description: "Считается автоматически из stockQty — редактируйте stockQty, а не этот чекбокс.",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "video",
      type: "upload",
      relationTo: "media",
    },
  ],
};
