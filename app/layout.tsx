import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";
import CookieBanner from "@/components/CookieBanner";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: {
    default: "Projektuj AI",
    template: "%s | Projektuj AI",
  },

  description:
    "Projektuj AI — projektowanie wnętrz i mebli z pomocą sztucznej inteligencji.",

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
      <body
        className="
          min-h-screen
          bg-[#07090d]
          text-white
          antialiased
        "
      >
        <Providers>
          <PublicNavbar />

          {children}

          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}