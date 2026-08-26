/**
 * Адрес клиента из заголовков запроса — за обратным прокси (у нас Caddy, см. Caddyfile).
 *
 * Берём ПОСЛЕДНИЙ элемент X-Forwarded-For, а не первый. Caddy дописывает в конец адрес,
 * с которого к нему реально пришло соединение, а всё, что левее, прислал сам клиент — и
 * подделать может как угодно. С первым элементом любой лимит по IP обходился бы одной
 * строкой в заголовке, а в логе согласий оказался бы адрес, выбранный отправителем.
 *
 * Заголовок вообще не гарантирован (локальная разработка без прокси) — тогда null.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return headers.get("x-real-ip");
}
