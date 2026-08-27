import type { Metadata } from "next";

export { ProfilePage as default } from "@/pages/profile";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};
