import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrdersByCustomer, ORDER_STATUS_LABELS } from "@/entities/order";
import { formatPrice, formatDate } from "@/shared/lib";
import { Tag, SectionTitle } from "@/shared/ui";

export async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const orders = await getOrdersByCustomer(session.user.id);

  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 md:px-12">
      <Tag>Личный кабинет</Tag>
      <SectionTitle className="mt-5">Мои заказы</SectionTitle>

      {orders.length === 0 ? (
        <p className="mt-10 text-ink-600">У вас пока нет заказов.</p>
      ) : (
        <div className="mt-10 flex flex-col gap-5">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[28px] bg-white p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-medium">Заказ №{order.id}</h2>
                <span className="text-sm text-ink-600">{formatDate(order.createdAt)}</span>
              </div>
              <p className="mt-2 text-ink-600">
                {order.items.map((item) => `${item.productName} × ${item.qty}`).join(", ")}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ink-900/10 pt-5 text-[15px]">
                <span>
                  Статус:{" "}
                  <b className={order.status === "delivered" ? "text-ink-900" : "text-brand-dark"}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </b>
                </span>
                <span className="font-medium">{formatPrice(order.total)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
