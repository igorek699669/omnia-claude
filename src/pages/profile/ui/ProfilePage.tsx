import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getOrdersByCustomer, ORDER_STATUS_LABELS, isAwaitingPayment } from "@/entities/order";
import type { Order, OrderItem } from "@/entities/order";
import { reconcileCustomerOrders } from "@/features/checkout/server";
import { formatPrice, formatDeliveryCost, formatDate, cdekTrackingUrl } from "@/shared/lib";
import { Tag, SectionTitle, HandpanArt } from "@/shared/ui";
import { OrdersLiveRefresh } from "./components/OrdersLiveRefresh";

export async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  await reconcileCustomerOrders(session.user.id);

  const orders = await getOrdersByCustomer(session.user.id);

  const awaitingPayment = orders.some((order) => isAwaitingPayment(order));

  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <OrdersLiveRefresh awaitingPayment={awaitingPayment} />
      <Tag>Личный кабинет</Tag>
      <SectionTitle as="h1" className="mt-5">Мои заказы</SectionTitle>

      {orders.length === 0 ? (
        <p className="mt-10 text-ink-600">У вас пока нет заказов.</p>
      ) : (
        <div className="mt-10 flex flex-col gap-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: Order }) {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <article className="rounded-[28px] bg-white p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-medium">Заказ №{order.id}</h2>
        <span className="text-sm text-ink-600">{formatDate(order.createdAt)}</span>
      </div>

      <ul className="mt-5 flex flex-col gap-4 border-t border-ink-900/10 pt-5">
        {order.items.map((item, index) => (
          <OrderItemRow key={`${item.productSlug ?? item.productName}-${index}`} item={item} />
        ))}
      </ul>

      {order.delivery && (
        <div className="mt-5 border-t border-ink-900/10 pt-5 text-[15px]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
            <span className="text-ink-600">Доставка</span>
            <span className="font-medium">{formatDeliveryCost(order.delivery.cost)}</span>
          </div>
          <p className="mt-1">
            {order.delivery.label}
            {order.delivery.address && <span className="text-ink-600"> · {order.delivery.address}</span>}
          </p>
        </div>
      )}

      <TrackNumber order={order} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-ink-900/10 pt-5 text-[15px]">
        <span>
          Статус:{" "}
          <b className={order.status === "delivered" ? "text-ink-900" : "text-brand-dark"}>
            {ORDER_STATUS_LABELS[order.status]}
          </b>
        </span>
        <span className="text-ink-600">
          Товары: {formatPrice(itemsTotal)}
          <b className="ml-4 font-display text-lg font-semibold text-ink-900">Итого: {formatPrice(order.total)}</b>
        </span>
      </div>
    </article>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  // Строй, ноты и Гц берутся из связанного товара — у заказа со снятым с продажи
  // инструментом их не будет, тогда строка параметров просто не рисуется.
  const specs = [
    item.scaleNotes,
    item.notesCount ? `${item.notesCount} нот` : null,
    item.tuningHz ? `${item.tuningHz} Гц` : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-4">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-paper-200">
        <HandpanArt className="h-3/4 w-3/4" />
      </div>

      <div className="min-w-0 flex-1">
        {item.productSlug ? (
          <Link
            href={`/product/${item.productSlug}`}
            className="font-display text-lg font-medium transition-colors hover:text-brand-dark"
          >
            {item.productName}
          </Link>
        ) : (
          <span className="font-display text-lg font-medium">{item.productName}</span>
        )}
        {specs.length > 0 && <p className="mt-0.5 text-sm text-ink-600">{specs.join(" · ")}</p>}
        <p className="mt-0.5 text-sm text-ink-600">
          {formatPrice(item.price)} × {item.qty}
        </p>
      </div>

      <span className="shrink-0 font-display text-lg font-semibold">{formatPrice(item.price * item.qty)}</span>
    </li>
  );
}

function TrackNumber({ order }: { order: Order }) {
  const awaitingNumber = order.status === "paid" || order.status === "shipped";
  if (!order.cdekNumber && !awaitingNumber) return null;

  return (
    <div className="mt-5 border-t border-ink-900/10 pt-5 text-[15px]">
      <span className="text-ink-600">Трек-номер СДЭК: </span>
      {order.cdekNumber ? (
        <a
          href={cdekTrackingUrl(order.cdekNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold tracking-wide underline underline-offset-2 transition-colors hover:text-brand-dark"
        >
          {order.cdekNumber}
        </a>
      ) : (
        <span className="text-ink-600">формируется, появится в течение дня</span>
      )}
    </div>
  );
}
