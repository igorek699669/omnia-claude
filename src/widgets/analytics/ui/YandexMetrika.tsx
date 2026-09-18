"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { METRIKA_ID, ym } from "@/shared/lib";

/**
 * Счётчик Яндекс.Метрики. Подключается на каждой странице без условий: аналитика и запись
 * сеансов отнесены к необходимым файлам, и плашка внизу экрана только уведомляет об этом —
 * отказаться можно настройками браузера или блокировщиком, см. /cookie-policy.
 *
 * Официальный сниппет вставлен как есть, а не заменён на <Script src>: он создаёт заглушку
 * window.ym до загрузки tag.js, и цели сразу после инициализации не теряются.
 */
export function YandexMetrika() {
  const pathname = usePathname();

  useEffect(() => {
    // Переходы внутри приложения Метрика не видит — просмотр отправляем руками; первый
    // считает init, а до него ym() ничего не делает, так что дубля не будет. Зависимость
    // только от pathname: фильтры каталога живут в query, и хит на каждое их изменение
    // раздул бы просмотры. Полный адрес берём из location — параметры сохранятся.
    ym("hit", window.location.href);
  }, [pathname]);

  if (METRIKA_ID === null) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

ym(${METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
    </Script>
  );
}
