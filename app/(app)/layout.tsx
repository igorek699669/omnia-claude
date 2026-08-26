import type { Metadata } from "next";
import { Jost, Golos_Text } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { ContactWidget } from "@/widgets/contact-widget";
import { CookieBanner } from "@/widgets/cookie-banner";
import { QueryProvider, siteUrl, DEFAULT_OG_IMAGE } from "@/shared/lib";
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
  // Без базы относительные пути в openGraph и canonical остаются относительными, а
  // соцсети и поисковики их не резолвят — картинка и канонический адрес просто теряются.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Omnia — ханги ручной работы из нержавеющей стали",
    // Страницы задают только своё имя: «Каталог» превращается в «Каталог — Omnia».
    template: "%s — Omnia",
  },
  description:
    "Мастерская хангов: ручная настройка, подбор звука под вашу практику, доставка по всей России.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Omnia",
    // У товаров вместо неё подставляется их собственный кадр — см. generateProductMetadata.
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${jost.variable} ${golos.variable}`}>
      <body className="overflow-x-hidden">
        <QueryProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ContactWidget />
          <CookieBanner />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--color-ink-900)",
                color: "var(--color-paper-50)",
                borderRadius: "9999px",
                padding: "12px 20px",
                fontSize: "15px",
              },
              success: { iconTheme: { primary: "var(--color-brand)", secondary: "var(--color-paper-50)" } },
              error: { iconTheme: { primary: "var(--color-brand)", secondary: "var(--color-paper-50)" } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
