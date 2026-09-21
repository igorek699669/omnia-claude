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
 * Официальный сниппет разрезан надвое. Заглушка window.ym и init остаются как были —
 * сразу после гидратации: они копят вызовы, и цели до загрузки счётчика не теряются.
 * А сам tag.js с Вебвизором грузится после load, когда браузер простаивает: на телефоне он
 * занимал главный поток на 2+ секунды прямо во время первой отрисовки (PageSpeed, 21.09.2026).
 * Загрузившись, он разбирает накопленную очередь, так что просмотр и цели доезжают.
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
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,i){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
})(window, 'ym');

ym(${METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
      </Script>
      <Script
        id="yandex-metrika-tag"
        src={`https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}
