import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";

export const metadata: Metadata = {

  title: "DreamS AI",

  description:
    "DreamS AI — projektowanie mebli premium z pomocą sztucznej inteligencji",

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

      <body>

        <Providers>

          {children}

        </Providers>

      </body>

    </html>
  );
}