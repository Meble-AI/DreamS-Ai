import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";
import CookieBanner from "@/components/CookieBanner";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://dreamsai.pl"),
  title: {
    default: "DreamS AI — zobacz swoją kuchnię zanim ją zamówisz",
    template: "%s | DreamS AI",
  },
  description:
    "DreamS AI pomaga stworzyć koncepcję kuchni na podstawie zdjęcia, rzutu i wymiarów pomieszczenia. Otrzymaj realistyczną wizualizację, wprowadzaj poprawki i pobierz projekt.",
  openGraph: {
    title: "DreamS AI — zobacz swoją kuchnię zanim ją zamówisz",
    description:
      "Dodaj zdjęcie lub rzut pomieszczenia i zobacz koncepcję swojej przyszłej kuchni przygotowaną z pomocą AI.",
    url: "https://dreamsai.pl",
    siteName: "DreamS AI",
    locale: "pl_PL",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-[#07090d] text-white antialiased">
        <Providers>
          <PublicNavbar />
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
