import type { Metadata } from "next";
import { Jost, Golos_Text } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { QueryProvider } from "@/shared/lib/query-provider";
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
      <body className="overflow-x-hidden">
        <QueryProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster
            position="bottom-center"
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
