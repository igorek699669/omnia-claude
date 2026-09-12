"use client";

import { useRef, useState } from "react";

const VIDEO_SRC = "/video/omnia-workshop.mp4";
const POSTER_SRC = "/video/workshop-poster.jpg";
const DURATION_LABEL = "1:45";

/**
 * Ролик о производстве: вертикальный, со звуком, запускается только осознанным нажатием.
 *
 * Своя кнопка поверх обложки нужна из-за размера цели: нативный треугольник в панели
 * управления на телефоне меньше пальца. Сами controls при этом остаются — перемотка,
 * громкость и полный экран должны работать, даже если наша кнопка почему-то не отрисовалась.
 */
export function WorkshopVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[25px] bg-[#15140f] shadow-[0_18px_45px_rgba(36,28,20,0.16)] lg:rounded-[30px]">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="none"
        poster={POSTER_SRC}
        width={720}
        height={1280}
        aria-label="Так звучит сталь. 11 этапов изготовления хендпана Omnia"
        onPlay={() => setStarted(true)}
        onEnded={() => setStarted(false)}
        className="aspect-[9/16] h-auto w-full object-contain"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
        Ваш браузер не поддерживает видео.{" "}
        <a href={VIDEO_SRC}>Открыть ролик</a>
      </video>

      {/* Пока ролик не запущен — крупная кнопка и длительность поверх обложки. */}
      {!started && (
        <>
          <button
            type="button"
            onClick={() => videoRef.current?.play()}
            aria-label="Смотреть видео о производстве хендпана"
            className="absolute left-1/2 top-[58%] grid size-18 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-[0_10px_30px_rgba(255,89,0,0.45)] outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden className="ml-1">
              <path d="M0 0v30l26-15z" fill="currentColor" />
            </svg>
          </button>
          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
            {DURATION_LABEL}
          </span>
        </>
      )}
    </div>
  );
}
