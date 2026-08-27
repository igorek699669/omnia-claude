import type { Metadata } from "next";

export { AuthPage as default } from "@/pages/auth";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};
