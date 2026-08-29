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

/** Боевой адрес. Переопределяется только в E2E — иначе прогон создавал бы реальные платежи. */
function apiUrl(): string {
  return process.env.YOOKASSA_API_URL ?? "https://api.yookassa.ru/v3";
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
  const res = await fetch(`${apiUrl()}/payments`, {
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
 * Вебхуки ЮKassa не подписаны — единственная надёжная проверка события: перезапросить платёж
 * по id своим секретным ключом и верить только этому ответу.
 */
export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  const res = await fetch(`${apiUrl()}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`ЮKassa: не удалось проверить платёж (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
