import { ImageResponse } from "next/og";

/**
 * Значок сайта — слева от заголовка в выдаче и на вкладке браузера. Рисуется кодом: в макете
 * знака нет, а логотип это буквы, и шрифтом их повторить надёжнее, чем подбирать растр.
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
