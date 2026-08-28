/**
 * Заглушки внешних сервисов для E2E.
 *
 * Это настоящий HTTP-сервер: приложение ходит в него по сети ровно теми же запросами,
 * что и в боевые SMS.ru, ЮKassa и СДЭК — подменены только базовые адреса (переменные
 * SMS_RU_API_URL / YOOKASSA_API_URL / CDEK_API_URL). Ни один запрос в тестах не мокается
 * внутри процесса приложения, поэтому проверяется в том числе разбор ответов и обработка
 * отказов.
 *
 * Почему не боевые песочницы: подтверждение номера в SMS.ru требует живого входящего
 * звонка (в пайплайне звонить некому) и стоит денег за попытку, а ЮKassa не даст нажать
 * «оплатить» без человека. Песочница СДЭК доступна, но её падения красили бы пайплайн в
 * красный по чужой вине.
 *
 * Плюс SMTP-приёмник: письма продавцу и покупателю уходят настоящим nodemailer'ом, здесь
 * они принимаются и складываются, чтобы тест мог проверить факт и содержимое отправки.
 */
import http from "node:http";
import net from "node:net";
import { CITIES, PVZ, tariffsFor, insuranceFee } from "./cdek-fixtures.mjs";

const PORT = Number(process.env.MOCKS_PORT ?? 4010);
const SMTP_PORT = Number(process.env.MOCKS_SMTP_PORT ?? 4025);
const SELF_URL = process.env.MOCKS_URL ?? `http://127.0.0.1:${PORT}`;
const APP_URL = process.env.MOCKS_APP_URL ?? "http://127.0.0.1:3100";

/** Всё состояние заглушек — сбрасывается между тестами через POST /__control/reset. */
const state = {
  /** checkId -> { phone, confirmed } */
  callChecks: new Map(),
  /** paymentId -> платёж ЮKassa */
  payments: new Map(),
  /** Idempotence-Key -> paymentId: повторный запрос обязан вернуть тот же платёж. */
  idempotence: new Map(),
  /** Зарегистрированные в СДЭК отправления: uuid -> заявка. */
  shipments: new Map(),
  /** Принятые письма. */
  emails: [],
  /** Журнал обращений — по нему тесты проверяют состав запроса и что его вообще не было. */
  requests: [],
  /** Управляемые отказы: имя -> true. */
  failures: new Set(),
  /** Слать ли вебхук об оплате. Выключается, чтобы проверить досверку из профиля. */
  webhookEnabled: true,
};

let counter = 0;
const nextId = (prefix) => `${prefix}-${++counter}-${Date.now().toString(36)}`;

function reset() {
  state.callChecks.clear();
  state.payments.clear();
  state.idempotence.clear();
  state.shipments.clear();
  state.emails.length = 0;
  state.requests.length = 0;
  state.failures.clear();
  state.webhookEnabled = true;
}

// ── вспомогательное ────────────────────────────────────────────────────────────────────

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parseBody(raw, contentType = "") {
  if (!raw) return {};
  if (contentType.includes("json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/**
 * Вебхук об оплате уходит из заглушки в приложение — так же, как настоящая ЮKassa стучится
 * на наш адрес. Тело намеренно голое (event + object.id): приложение обязано ему не
 * доверять и перезапросить платёж своим ключом.
 */
async function fireYookassaWebhook(payment) {
  if (!state.webhookEnabled) return { skipped: true };
  const res = await fetch(`${APP_URL}/api/webhooks/yookassa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "notification",
      event: payment.status === "succeeded" ? "payment.succeeded" : "payment.canceled",
      object: { id: payment.id, status: payment.status },
    }),
  });
  return { status: res.status, body: await res.text() };
}

// ── SMS.ru: подтверждение номера входящим звонком ───────────────────────────────────────

const CHECK_PENDING = 400;
const CHECK_CONFIRMED = 401;

function smsRu(path, params, res) {
  if (state.failures.has("sms-ru")) {
    // SMS.ru отвечает 200 даже на отказ — реальный результат только в теле.
    return json(res, 200, {
      status: "ERROR",
      status_code: 208,
      status_text: "Заглушка: отказ по требованию теста",
    });
  }

  if (path === "/callcheck/add") {
    const phone = String(params.phone ?? "");
    if (!/^7\d{10}$/.test(phone)) {
      return json(res, 200, { status: "ERROR", status_code: 202, status_text: "Неправильно указан номер" });
    }
    const checkId = nextId("check");
    state.callChecks.set(checkId, { phone, confirmed: false });
    return json(res, 200, {
      status: "OK",
      status_code: 100,
      check_id: checkId,
      call_phone: "+78007779999",
      call_phone_pretty: "8-800-777-9999",
    });
  }

  if (path === "/callcheck/status") {
    const check = state.callChecks.get(String(params.check_id));
    if (!check) return json(res, 200, { status: "ERROR", status_code: 210, status_text: "Проверка не найдена" });
    return json(res, 200, {
      status: "OK",
      status_code: 100,
      check_status: check.confirmed ? CHECK_CONFIRMED : CHECK_PENDING,
      check_status_text: check.confirmed ? "Подтверждён" : "Ожидает звонка",
    });
  }

  return json(res, 404, { status: "ERROR", status_text: "unknown method" });
}

// ── ЮKassa ──────────────────────────────────────────────────────────────────────────────

function assertYookassaAuth(req) {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Basic ")) return false;
  const [shopId, secret] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
  return Boolean(shopId && secret);
}

/**
 * Страница оплаты вместо настоящей формы ЮKassa. Покупатель попадает сюда редиректом с
 * чекаута — как и в бою, — а кнопки повторяют два исхода: успешная оплата и отказ.
 */
function paymentPage(payment) {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Оплата заказа</title></head>
<body style="font-family:system-ui;padding:40px">
  <h1>Тестовая касса</h1>
  <p>Заказ: <b data-testid="payment-description">${payment.description}</b></p>
  <p>К оплате: <b data-testid="payment-amount">${payment.amount.value} ${payment.amount.currency}</b></p>
  <button data-testid="pay" onclick="finish('pay')">Оплатить</button>
  <button data-testid="cancel" onclick="finish('cancel')">Отменить</button>
  <script>
    async function finish(action) {
      await fetch('/__control/yookassa/' + (action === 'pay' ? 'pay' : 'cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: ${JSON.stringify(payment.id)} }),
      });
      window.location.href = ${JSON.stringify(payment.confirmation.return_url)};
    }
  </script>
</body></html>`;
}

async function yookassa(req, res, path, raw) {
  if (!assertYookassaAuth(req)) {
    return json(res, 401, { type: "error", code: "invalid_credentials" });
  }

  if (req.method === "POST" && path === "/payments") {
    if (state.failures.has("yookassa-create")) {
      return json(res, 500, { type: "error", code: "internal_server_error" });
    }
    const key = req.headers["idempotence-key"];
    if (!key) return json(res, 400, { type: "error", code: "invalid_request", parameter: "Idempotence-Key" });

    // Идемпотентность как у настоящей кассы: тот же ключ — тот же платёж, второй раз
    // деньги не запрашиваются.
    const existingId = state.idempotence.get(String(key));
    if (existingId) return json(res, 200, state.payments.get(existingId));

    const body = JSON.parse(raw);
    const id = nextId("pay");
    const payment = {
      id,
      status: "pending",
      paid: false,
      amount: body.amount,
      description: body.description,
      metadata: body.metadata,
      confirmation: {
        type: "redirect",
        return_url: body.confirmation.return_url,
        confirmation_url: `${SELF_URL}/yookassa/checkout/${id}`,
      },
      created_at: new Date().toISOString(),
    };
    state.payments.set(id, payment);
    state.idempotence.set(String(key), id);
    state.requests.push({ kind: "yookassa-create", amount: body.amount, metadata: body.metadata });
    return json(res, 200, payment);
  }

  if (req.method === "GET" && path.startsWith("/payments/")) {
    if (state.failures.has("yookassa-get")) {
      return json(res, 500, { type: "error", code: "internal_server_error" });
    }
    const payment = state.payments.get(path.slice("/payments/".length));
    if (!payment) return json(res, 404, { type: "error", code: "not_found" });
    return json(res, 200, payment);
  }

  return json(res, 404, { type: "error", code: "not_found" });
}

// ── СДЭК ────────────────────────────────────────────────────────────────────────────────

async function cdek(req, res, path, url, raw) {
  if (path === "/oauth/token") {
    const params = new URLSearchParams(raw);
    if (!params.get("client_id") || !params.get("client_secret")) {
      return json(res, 400, { error: "invalid_client" });
    }
    return json(res, 200, { access_token: "cdek-test-token", token_type: "bearer", expires_in: 3600 });
  }

  // Всё остальное — только с токеном: приложение обязано сначала авторизоваться.
  if (req.headers.authorization !== "Bearer cdek-test-token") {
    return json(res, 401, { message: "Unauthorized" });
  }

  if (path === "/location/suggest/cities") {
    if (state.failures.has("cdek-cities")) return json(res, 503, { message: "Service unavailable" });
    const name = (url.searchParams.get("name") ?? "").toLowerCase().replace(/ё/g, "е");
    const matches = CITIES.filter((c) => c.city.toLowerCase().replace(/ё/g, "е").startsWith(name));
    return json(
      res,
      200,
      matches.map((c) => ({
        code: c.code,
        full_name: c.region ? `${c.city}, ${c.region}, Россия` : `${c.city}, Россия`,
      })),
    );
  }

  if (path === "/deliverypoints") {
    if (state.failures.has("cdek-pvz")) return json(res, 503, { message: "Service unavailable" });
    const byCode = url.searchParams.get("code");
    const points = byCode
      ? PVZ.filter((p) => p.code === byCode)
      : PVZ.filter((p) => String(p.cityCode) === url.searchParams.get("city_code"));
    return json(
      res,
      200,
      points.map((p) => ({
        code: p.code,
        type: "PVZ",
        location: {
          city_code: p.cityCode,
          city: p.city,
          address: p.address.replace(`${p.city}, `, ""),
          address_full: p.address,
          latitude: p.lat,
          longitude: p.lon,
        },
        work_time: "Пн-Пт 10:00-20:00",
      })),
    );
  }

  if (path === "/calculator/tarifflist") {
    if (state.failures.has("cdek-tariff")) return json(res, 503, { message: "Service unavailable" });
    const body = JSON.parse(raw);
    const cityCode = body.to_location?.code;
    const packagesCount = Array.isArray(body.packages) ? body.packages.length : 1;
    state.requests.push({ kind: "cdek-tariff", cityCode, packagesCount, packages: body.packages });
    return json(res, 200, { tariff_codes: tariffsFor(Number(cityCode), packagesCount) });
  }

  // Расчёт по конкретному тарифу — здесь СДЭК добавляет к доставке услуги, и ради
  // страховки объявленной стоимости приложение и делает этот второй запрос.
  if (path === "/calculator/tariff") {
    if (state.failures.has("cdek-tariff")) return json(res, 503, { message: "Service unavailable" });
    const body = JSON.parse(raw);
    const cityCode = Number(body.to_location?.code);
    const packagesCount = Array.isArray(body.packages) ? body.packages.length : 1;
    const tariff = tariffsFor(cityCode, packagesCount).find((t) => t.tariff_code === body.tariff_code);
    if (!tariff) return json(res, 400, { errors: [{ code: "tariff_code", message: "Тариф недоступен" }] });

    const insurance = (body.services ?? [])
      .filter((s) => s.code === "INSURANCE")
      .reduce((sum, s) => sum + insuranceFee(Number(s.parameter)), 0);

    state.requests.push({
      kind: "cdek-tariff-priced",
      cityCode,
      packagesCount,
      packages: body.packages,
      tariffCode: body.tariff_code,
      services: body.services,
    });
    return json(res, 200, {
      tariff_code: tariff.tariff_code,
      delivery_sum: tariff.delivery_sum,
      total_sum: tariff.delivery_sum + insurance,
      period_min: tariff.period_min,
      period_max: tariff.period_max,
      services: (body.services ?? []).map((s) => ({ code: s.code, sum: insuranceFee(Number(s.parameter)) })),
    });
  }

  if (path === "/orders" && req.method === "POST") {
    if (state.failures.has("cdek-orders")) return json(res, 503, { message: "Service unavailable" });
    const body = JSON.parse(raw);

    // Номер заказа у СДЭК уникален — на этом держится защита от повторной регистрации.
    const duplicate = [...state.shipments.values()].some((s) => s.number === body.number);
    if (duplicate) {
      return json(res, 202, {
        requests: [
          {
            state: "INVALID",
            errors: [{ code: "v2_entity_exists", message: "Заказ с таким number уже существует" }],
          },
        ],
      });
    }

    const uuid = nextId("cdek");
    state.shipments.set(uuid, { uuid, number: body.number, body, cdekNumber: `10${counter}0000000` });
    state.requests.push({ kind: "cdek-order", number: body.number, body });
    return json(res, 202, { entity: { uuid }, requests: [{ request_uuid: nextId("req"), state: "ACCEPTED" }] });
  }

  if (path.startsWith("/orders/") && req.method === "GET") {
    const shipment = state.shipments.get(path.slice("/orders/".length));
    if (!shipment) return json(res, 404, { message: "Not found" });
    return json(res, 200, {
      entity: {
        uuid: shipment.uuid,
        number: shipment.number,
        // Номер накладной присваивается асинхронно; заглушка отдаёт его сразу, если тест
        // не попросил изобразить обратное.
        cdek_number: state.failures.has("cdek-number") ? undefined : shipment.cdekNumber,
      },
    });
  }

  return json(res, 404, { message: "Not found" });
}

// ── управляющий API для тестов ──────────────────────────────────────────────────────────

async function control(req, res, path, raw) {
  const body = parseBody(raw, req.headers["content-type"] ?? "");

  switch (path) {
    case "/health":
      return json(res, 200, { ok: true });

    case "/reset":
      reset();
      return json(res, 200, { ok: true });

    case "/callcheck/confirm": {
      // «Покупатель дозвонился». Ищем последнюю заведённую проверку этого номера.
      const digits = String(body.phone ?? "").replace(/\D/g, "");
      const entry = [...state.callChecks.entries()].reverse().find(([, c]) => c.phone === digits);
      if (!entry) return json(res, 404, { error: "проверка для этого номера не заводилась", phone: digits });
      entry[1].confirmed = true;
      return json(res, 200, { ok: true, checkId: entry[0] });
    }

    case "/callcheck/list":
      return json(
        res,
        200,
        [...state.callChecks.entries()].map(([id, c]) => ({ id, ...c })),
      );

    case "/yookassa/pay": {
      const payment = state.payments.get(String(body.paymentId));
      if (!payment) return json(res, 404, { error: "платёж не найден" });
      payment.status = "succeeded";
      payment.paid = true;
      // Вебхук отправляем до ответа, чтобы порядок в тестах был определённым: настоящая
      // касса шлёт его асинхронно, и гонка «редирект против вебхука» шатала бы прогон.
      const webhook = await fireYookassaWebhook(payment);
      return json(res, 200, { ok: true, payment, webhook });
    }

    case "/yookassa/cancel": {
      const payment = state.payments.get(String(body.paymentId));
      if (!payment) return json(res, 404, { error: "платёж не найден" });
      payment.status = "canceled";
      const webhook = await fireYookassaWebhook(payment);
      return json(res, 200, { ok: true, payment, webhook });
    }

    case "/yookassa/payments":
      return json(res, 200, [...state.payments.values()]);

    case "/yookassa/webhook":
      // Позволяет выключить вебхук и проверить досверку заказов из личного кабинета.
      state.webhookEnabled = body.enabled !== false && body.enabled !== "false";
      return json(res, 200, { ok: true, webhookEnabled: state.webhookEnabled });

    case "/cdek/shipments":
      return json(res, 200, [...state.shipments.values()]);

    case "/emails":
      return json(res, 200, state.emails);

    case "/requests":
      return json(res, 200, state.requests);

    case "/fail": {
      // { target: "cdek-orders", enabled: true } — изобразить отказ конкретного сервиса.
      const target = String(body.target ?? "");
      if (body.enabled === false || body.enabled === "false") state.failures.delete(target);
      else state.failures.add(target);
      return json(res, 200, { ok: true, failures: [...state.failures] });
    }

    default:
      return json(res, 404, { error: "unknown control endpoint", path });
  }
}

// ── маршрутизация ───────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, SELF_URL);
  const raw = await readBody(req);

  try {
    if (url.pathname.startsWith("/__control")) {
      return await control(req, res, url.pathname.slice("/__control".length), raw);
    }
    if (url.pathname.startsWith("/sms/")) {
      return smsRu(url.pathname.slice("/sms".length), parseBody(raw, req.headers["content-type"] ?? ""), res);
    }
    if (url.pathname.startsWith("/yookassa/checkout/")) {
      const payment = state.payments.get(url.pathname.slice("/yookassa/checkout/".length));
      if (!payment) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Платёж не найден");
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(paymentPage(payment));
    }
    if (url.pathname.startsWith("/yookassa/v3")) {
      return await yookassa(req, res, url.pathname.slice("/yookassa/v3".length), raw);
    }
    if (url.pathname.startsWith("/cdek/v2")) {
      return await cdek(req, res, url.pathname.slice("/cdek/v2".length), url, raw);
    }
    return json(res, 404, { error: "not found", path: url.pathname });
  } catch (err) {
    console.error("[mocks] ошибка обработки", url.pathname, err);
    return json(res, 500, { error: String(err) });
  }
});

// ── SMTP-приёмник ───────────────────────────────────────────────────────────────────────

/**
 * Разговор по SMTP ровно в том объёме, который проходит nodemailer без AUTH и STARTTLS.
 * Полноценный сервер не нужен: важно, что письмо действительно ушло по сети и его можно
 * прочитать — то есть что продавец узнает об оплаченном заказе.
 */
const smtp = net.createServer((socket) => {
  let buffer = "";
  let collecting = false;
  let message = { from: "", to: [], data: "" };

  const say = (line) => socket.write(`${line}\r\n`);
  say("220 omnia-e2e ESMTP");

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");

    for (;;) {
      if (collecting) {
        const end = buffer.indexOf("\r\n.\r\n");
        if (end === -1) return;
        message.data += buffer.slice(0, end);
        buffer = buffer.slice(end + 5);
        collecting = false;
        state.emails.push(parseEmail(message));
        message = { from: "", to: [], data: "" };
        say("250 2.0.0 Ok: queued");
        continue;
      }

      const eol = buffer.indexOf("\r\n");
      if (eol === -1) return;
      const line = buffer.slice(0, eol);
      buffer = buffer.slice(eol + 2);
      const upper = line.toUpperCase();

      if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
        say("250-omnia-e2e");
        say("250 8BITMIME");
      } else if (upper.startsWith("MAIL FROM")) {
        message.from = line.slice(line.indexOf(":") + 1).trim();
        say("250 2.1.0 Ok");
      } else if (upper.startsWith("RCPT TO")) {
        message.to.push(line.slice(line.indexOf(":") + 1).trim());
        say("250 2.1.5 Ok");
      } else if (upper.startsWith("DATA")) {
        collecting = true;
        say("354 End data with <CR><LF>.<CR><LF>");
      } else if (upper.startsWith("QUIT")) {
        say("221 2.0.0 Bye");
        socket.end();
        return;
      } else {
        say("250 2.0.0 Ok");
      }
    }
  });

  socket.on("error", () => socket.destroy());
});

/** Перевод строки протокола SMTP. */
const SMTP_EOL = "\r\n";

/** Разбираем письмо до того минимума, который проверяют тесты: кому, тема, текст. */
function parseEmail(message) {
  const [head, ...rest] = message.data.split("\r\n\r\n");
  const headers = {};
  // Длинный заголовок MIME сворачивает на несколько строк: продолжение начинается с пробела
  // и двоеточия не содержит. Без разворачивания тема обрезалась бы на первом фрагменте —
  // «Заказ №12 переда» вместо «Заказ №12 передан в доставку — трек ...».
  const unfolded = head.replace(/\r\n[ \t]+/g, " ");
  for (const line of unfolded.split("\r\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) headers[line.slice(0, colon).toLowerCase()] = line.slice(colon + 1).trim();
  }
  return {
    from: message.from,
    to: message.to,
    subject: decodeHeader(headers.subject ?? ""),
    // Тело приходит частями multipart в quoted-printable/base64 — тестам хватает
    // распакованного текста целиком, без разбора границ.
    body: decodeBody(rest.join("\r\n\r\n")),
    raw: message.data,
  };
}

/** Заголовки уходят в MIME-кодировке (=?UTF-8?B?...?=) — иначе кириллицу не сравнить. */
function decodeHeader(value) {
  // Пробел между двумя соседними кодированными словами — след сворачивания строки, а не
  // часть текста (RFC 2047). Не убрать его — и слово, разрезанное переносом, склеится
  // с дыркой: «переда н в доставку».
  return value
    .replace(/\?=\s+=\?/g, "?==?")
    .replace(/=\?[Uu][Tt][Ff]-8\?([BbQq])\?([^?]*)\?=/g, (_, kind, text) =>
      kind.toLowerCase() === "b"
        ? Buffer.from(text, "base64").toString("utf8")
        : Buffer.from(
            text.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (__, hex) => String.fromCharCode(parseInt(hex, 16))),
            "binary",
          ).toString("utf8"),
    );
}

/**
 * Тело письма приходит частями multipart: одни куски в base64, другие в quoted-printable.
 * Каждый кусок раскодируем в байты и только потом собираем строку — иначе кириллица
 * превращается в мусор (перекодировка «байты → строка → байты» её ломает).
 */
function decodeBody(body) {
  const parts = [];
  let base64 = "";
  let bytes = [];

  const flushBase64 = () => {
    if (!base64) return;
    parts.push(Buffer.from(base64, "base64").toString("utf8"));
    base64 = "";
  };
  const flushBytes = () => {
    if (!bytes.length) return;
    parts.push(Buffer.from(bytes).toString("utf8"));
    bytes = [];
  };

  for (const line of body.split(SMTP_EOL)) {
    if (/^[A-Za-z0-9+/=]{60,}$/.test(line)) {
      flushBytes();
      base64 += line;
      continue;
    }
    flushBase64();

    // «=» в конце строки — мягкий перенос quoted-printable, =XX — байт.
    const soft = line.endsWith("=");
    const content = soft ? line.slice(0, -1) : line;
    for (let i = 0; i < content.length; i += 1) {
      const hex = content.slice(i + 1, i + 3);
      if (content[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
      } else {
        bytes.push(content.charCodeAt(i) & 0xff);
      }
    }
    if (!soft) bytes.push(0x0a);
  }

  flushBase64();
  flushBytes();
  return parts.join("");
}

server.listen(PORT, "127.0.0.1", () => console.log(`[mocks] HTTP на ${SELF_URL}`));
smtp.listen(SMTP_PORT, "127.0.0.1", () => console.log(`[mocks] SMTP на 127.0.0.1:${SMTP_PORT}`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close();
    smtp.close();
    process.exit(0);
  });
}
