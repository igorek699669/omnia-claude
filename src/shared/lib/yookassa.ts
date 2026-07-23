export interface YookassaPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url: string };
  metadata?: Record<string, string>;
}

interface CreatePaymentParams {
  idempotenceKey: string;
  amount: number;
  description: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_SHOP_ID/YOOKASSA_SECRET_KEY не заданы в .env.local");
  }
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export async function createYookassaPayment(params: CreatePaymentParams): Promise<YookassaPayment> {
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": params.idempotenceKey,
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: { value: params.amount.toFixed(2), currency: "RUB" },
      confirmation: { type: "redirect", return_url: params.returnUrl },
      capture: true,
      description: params.description.slice(0, 128),
      metadata: params.metadata,
    }),
  });
  if (!res.ok) {
    throw new Error(`ЮKassa: не удалось создать платёж (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/**
 * Вебхуки ЮKassa не подписаны (нет HMAC) — единственный надёжный способ проверки
 * события — перезапросить платёж по id своим секретным ключом и доверять только этому ответу.
 */
export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`ЮKassa: не удалось проверить платёж (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
