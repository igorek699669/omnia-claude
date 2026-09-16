import { ImageResponse } from "next/og";

/**
 * Значок сайта — слева от заголовка в выдаче и на вкладке браузера. Рисуется кодом: в макете
 * знака нет, а логотип это буквы, и шрифтом их повторить надёжнее, чем подбирать растр.
 *
 * Рядом лежит ещё и app/favicon.ico (16/32/48, тот же знак кольцом) — он нужен роботу
 * Яндекса: тот ищет иконку по адресу /favicon.ico, а этот роут отдаёт png по пути с хешем,
 * и Вебмастер писал «Файл favicon не найден». Оба линка Next ставит в <head> сам.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FF5900",
          color: "#FFFFFF",
          fontSize: 340,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        O
      </div>
    ),
    size,
  );
}
