import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";

import Link from "next/link";
import Image from "next/image";

import CookieBanner
from "@/components/CookieBanner";

export const metadata: Metadata = {

  title: "DreamS AI",

  description:
    "DreamS AI — projektowanie mebli premium z pomocą sztucznej inteligencji",

  icons: {
    icon: "/favicon.ico",
  },
};

function Navbar() {

  return (

    <nav
      className="
        fixed
        top-0
        left-0
        w-full
        z-50
        border-b
        border-white/10
        bg-black/80
        backdrop-blur-xl
      "
    >

      <div
        className="
          max-w-7xl
          mx-auto
          flex
          items-center
          justify-between
          px-6
          md:px-8
          py-4
        "
      >

        {/* LOGO */}

        <Link
          href="/"

          className="
            flex
            items-center
          "
        >

          <Image
            src="/logo 1.png"
            alt="DreamS AI"
            width={260}
            height={80}
            priority

            className="
              h-auto
              w-auto
            "
          />

        </Link>

        {/* MENU */}

        <div
          className="
            flex
            items-center
            gap-6
          "
        >

          <Link
            href="/pricing"

            className="
              text-white
              hover:text-green-400
              transition
            "
          >
            Cennik
          </Link>

          <Link
            href="/login"

            className="
              text-white
              hover:text-green-400
              transition
            "
          >
            Zaloguj
          </Link>

          <Link
            href="/register"

            className="
              bg-green-600
              hover:bg-green-500
              transition
              px-6
              py-3
              rounded-2xl
              text-white
              font-semibold
            "
          >
            Załóż konto
          </Link>

        </div>

      </div>

    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html lang="pl">

      <body
        className="
          bg-black
          text-white
          antialiased
          min-h-screen
        "
      >

        <Providers>

          <Navbar />

          <main
            className="
              pt-24
              md:pt-28
            "
          >

            {children}

          </main>

          <CookieBanner />

        </Providers>

      </body>

    </html>
  );
}