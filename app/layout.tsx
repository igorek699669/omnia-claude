import type { Metadata } from "next";
import { Jost, Golos_Text } from "next/font/google";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import "./globals.css";

const jost = Jost({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-golos",
});

export const metadata: Metadata = {
  title: "Omnia — ханги ручной работы из нержавеющей стали",
  description:
    "Мастерская хангов: ручная настройка, подбор звука под вашу практику, доставка по всей России.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${jost.variable} ${golos.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
