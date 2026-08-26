"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { METRIKA_ID, ym, hasAnalyticsConsent, COOKIE_CONSENT_EVENT } from "@/shared/lib";

/**
 * Согласие живёт в localStorage — это внешнее по отношению к React хранилище, поэтому
 * читаем его через useSyncExternalStore, а не копируем в состояние эффектом. Заодно это
 * снимает расхождение разметки: на сервере снимок всегда false, счётчика там нет.
 *
 * Функция вынесена из компонента, чтобы ссылка была стабильной и подписка не пересоздавалась
 * на каждый рендер.
 */
function subscribeToConsent(onChange: () => void): () => void {
  // Своё событие — про выбор в этой вкладке (localStorage о нём не сообщает),
  // storage — про выбор в соседней.
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Счётчик Яндекс.Метрики.
 *
 * Подключается только после согласия на аналитические cookie — до этого на странице нет
 * ни скрипта, ни запроса к mc.yandex.ru. Ровно ради этого баннер и заводился: иначе
 * кнопка «Только нужные» ничего бы не значила.
 *
 * Официальный сниппет вставлен как есть (с его же защитой от повторной вставки), а не
 * заменён на <Script src>: он создаёт заглушку window.ym до загрузки tag.js и копит
 * вызовы, поэтому цели, отправленные сразу после инициализации, не теряются.
 */
export function YandexMetrika() {
  const allowed = useSyncExternalStore(subscribeToConsent, hasAnalyticsConsent, () => false);
  const pathname = usePathname();

  useEffect(() => {
    // Переходы внутри приложения страницу не перезагружают, и сама Метрика их не видит —
    // просмотр нужно отправлять руками. Первый просмотр считает init, а до его появления
    // ym() просто ничего не делает, так что дубля на первом рендере не будет.
    //
    // Зависимость только от pathname, без search: фильтры каталога живут в query, и хит на
    // каждое их изменение раздул бы просмотры до бессмысленных чисел. Полный адрес при этом
    // берём из location — параметры в статистике сохранятся.
    if (!allowed) return;
    ym("hit", window.location.href);
  }, [pathname, allowed]);

  if (METRIKA_ID === null || !allowed) return null;

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
