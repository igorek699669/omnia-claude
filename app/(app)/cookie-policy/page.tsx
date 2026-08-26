import type { Metadata } from "next";

export { CookiePolicyPage as default } from "@/pages/cookie-policy";

export const metadata: Metadata = {
  title: "Политика cookie",
  description: "Какие cookie использует сайт Omnia и как отказаться от необязательных.",
  alternates: { canonical: "/cookie-policy" },
};
