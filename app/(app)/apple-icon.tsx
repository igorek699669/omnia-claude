import { ImageResponse } from "next/og";

/** Тот же знак под иконку на домашнем экране iOS — там свой обязательный размер. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
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
