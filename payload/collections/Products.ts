import { APIError, type CollectionConfig } from "payload";
import { sendRestockEmail } from "../lib/mailer";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "scaleNotes", "price", "stockQty", "inStock", "hidden", "adminOnly"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    /**
     * Проданный инструмент не удаляется. В заказе от позиции остаётся только ссылка на
     * товар — ни названия, ни снимка позиции там нет, поэтому удаление стёрло бы историю:
     * что именно было продано, восстановить будет неоткуда.
     *
     * Postgres и так его не отдаёт: Payload делает внешние ключи orders_items.product_id и
     * stock_subscriptions.product_id с правилом ON DELETE SET NULL, а сами колонки — NOT NULL
     * (поле помечено required). Удаление падает на not-null constraint, ответ уходит пустой
     * 500-кой, и админка показывает безымянное «Something went wrong». Хук заменяет её
     * объяснением и подсказывает, что делать вместо удаления.
     */
    beforeDelete: [
      async ({ req, id }) => {
        const orders = await req.payload.find({
          collection: "orders",
          where: { "items.product": { equals: id } },
          limit: 5,
          depth: 0,
          req,
        });

        if (orders.totalDocs > 0) {
          const shown = orders.docs.map((order) => `#${order.id}`).join(", ");
          const rest = orders.totalDocs - orders.docs.length;
          const numbers = rest > 0 ? `${shown} и ещё ${rest}` : shown;
          throw new APIError(
            `Товар есть в заказах (${numbers}) — удалить его нельзя, иначе в истории заказов ` +
              `не останется, что было продано. Поставьте галочку «Скрыт из каталога»: товар ` +
              `пропадёт с витрины, из поиска, карты сайта и оформить его будет нельзя, ` +
              `а заказы останутся целыми.`,
            400,
          );
        }

        // Подписки «уведомить о наличии» без товара бессмысленны — удаляем вместе с ним.
        // Иначе тот же внешний ключ роняет удаление уже на них.
        await req.payload.delete({
          collection: "stock-subscriptions",
          where: { product: { equals: id } },
          req,
        });
      },
    ],
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
      max: 22,
      admin: {
        description:
          "Для инструментов с нижними нотами («+N» в исходном названии строя) — сумма верхних и нижних нот.",
      },
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
      name: "adminOnly",
      type: "checkbox",
      label: "Виден на сайте только вошедшему в админ-панель",
      defaultValue: false,
      admin: {
        description:
          "Товар остаётся на сайте, но показывается только тому, у кого открыта сессия админ-панели: ему он виден на главной, в каталоге, поиске и по своей ссылке как обычный. Остальным его нет нигде, и по прямой ссылке страница отдаёт 404. Так карточку смотрят на живом сайте до публикации. В карту сайта такой товар не попадает. Купить его можно — для прогона покупки на проде есть «Тестовый режим» ниже.",
      },
    },
    {
      name: "hidden",
      type: "checkbox",
      label: "Скрыт из каталога (снят с продажи)",
      defaultValue: false,
      admin: {
        description:
          "Снят с продажи: товар пропадает с главной, из каталога, поиска, карты сайта, его страница отдаёт 404 и оформить заказ с ним нельзя. Так убирают товар, который уже кто-то заказал, — удалить его нельзя, иначе в истории заказов не останется, что было продано.",
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
    {
      name: "audioSample",
      type: "text",
      admin: {
        description: "Путь к аудиозаписи строя в public/, например /audio/D_Kurd_12.m4a",
      },
    },
    {
      // Товар-пустышка, чтобы пройти покупку на проде целиком, не заплатив за неё. Флаги
      // живут у товара, а не в настройках сайта: остальной каталог при этом продаётся как
      // обычно. Оба действуют на весь заказ, если помечен хотя бы один его товар: платёж и
      // посылка у заказа одни на всех, разложить их по позициям нельзя.
      type: "collapsible",
      label: "Тестовый режим",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "testPayment",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Оплата заказа с этим товаром уходит в тестовый магазин ЮKassa (YOOKASSA_TEST_SHOP_ID/YOOKASSA_TEST_SECRET_KEY) — деньги не списываются. Без этих переменных заказ с товаром не оформится.",
          },
        },
        {
          name: "freeDelivery",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Доставка заказа с этим товаром бесплатна для покупателя: тариф считается, ПВЗ выбирается и отправление регистрируется как обычно, но в счёт ЮKassa уходит только стоимость товаров. Счёт от СДЭК при этом всё равно придёт мастерской.",
          },
        },
      ],
    },
  ],
};
