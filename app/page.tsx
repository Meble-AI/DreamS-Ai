"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#07090d] text-white">
      {/* HERO */}
      <section className="relative min-h-[calc(100vh-88px)] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 hidden h-full w-full object-cover opacity-35 md:block"
        >
          <source
            src="/kitchen.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 md:hidden">
          <img
            src="/mobile-kitchen.jpg"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,13,0.98)_0%,rgba(7,9,13,0.88)_42%,rgba(7,9,13,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(216,170,76,0.16),transparent_38%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d8aa4c]/25 bg-[#d8aa4c]/10 px-5 py-3 backdrop-blur-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f0c56e] shadow-[0_0_18px_rgba(240,197,110,0.8)]" />
              <span className="text-sm font-semibold text-[#f0c56e]">
                Inteligentne projektowanie wnętrz
              </span>
            </div>

            <h1 className="mt-8 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Zaprojektuj swoje
              <span className="block bg-gradient-to-r from-white via-[#f5ddb0] to-[#d8aa4c] bg-clip-text text-transparent">
                wymarzone wnętrze
              </span>
              w kilka minut
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300 sm:text-xl">
              Dodaj zdjęcie pomieszczenia lub rzut. Projektuj AI przeanalizuje
              układ, przygotuje realistyczną wizualizację i pozwoli Ci
              wprowadzać poprawki tak, jak podczas rozmowy z projektantem.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-8 py-5 text-lg font-bold text-black transition hover:scale-[1.02] hover:brightness-110"
              >
                Rozpocznij projekt
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-8 py-5 text-lg font-bold text-white backdrop-blur-xl transition hover:bg-white/[0.1]"
              >
                Zobacz pakiety
              </Link>
            </div>

            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Fotorealistyczne wizualizacje",
                "Analiza pomieszczenia AI",
                "Poprawki do projektu",
                "Szacunkowa wycena",
                "Historia wersji",
                "Pobieranie projektu",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl"
                >
                  <span className="h-2 w-2 rounded-full bg-[#d8aa4c]" />
                  <span className="text-sm font-medium text-gray-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-white/10 bg-[#090c11] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d8aa4c]">
              Jak to działa
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Od pomysłu do wizualizacji w trzech krokach
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-400">
              Bez skomplikowanych programów, bez długiego oczekiwania i bez
              konieczności zaczynania projektu od zera.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Dodaj pomieszczenie",
                text: "Prześlij zdjęcie, rzut lub opisz układ, wymiary i styl wnętrza.",
              },
              {
                number: "02",
                title: "Otrzymaj projekt",
                text: "AI analizuje przestrzeń i przygotowuje realistyczną wizualizację.",
              },
              {
                number: "03",
                title: "Wprowadź poprawki",
                text: "Napisz, co zmienić, a system utworzy kolejną wersję projektu.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-7"
              >
                <div className="text-sm font-bold text-[#d8aa4c]">
                  {step.number}
                </div>

                <h3 className="mt-8 text-2xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-gray-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROOM SCANNER */}
      <section
        id="scanner"
        className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d8aa4c]">
              AI Skaner pomieszczeń
            </div>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Dodaj zdjęcie.
              <span className="block text-gray-400">
                Resztą zajmie się AI.
              </span>
            </h2>

            <p className="mt-7 text-lg leading-8 text-gray-400">
              Projektuj AI analizuje ściany, okna, drzwi, przejścia i możliwości
              zabudowy. Na tej podstawie przygotowuje projekt dopasowany do
              rzeczywistego pomieszczenia.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Wykrywanie układu i architektury",
                "Analiza miejsca na wyspę",
                "Kontrola ergonomii i przejść",
                "Zachowanie rzeczywistych proporcji",
                "Projekt możliwy do dalszej realizacji",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8aa4c]/30 bg-[#d8aa4c]/10 text-[#f0c56e]">
                    ✓
                  </div>

                  <span className="text-lg text-gray-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/login?redirect=room-scanner"
              className="mt-10 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-8 py-5 text-lg font-bold text-black transition hover:brightness-110"
            >
              Uruchom skaner pomieszczeń
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-[#d8aa4c]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-3 shadow-2xl">
              <img
                src="/scanner-preview.jpg"
                alt="Podgląd skanera pomieszczeń Projektuj AI"
                className="w-full rounded-[24px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-[#090c11] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d8aa4c]">
              Dlaczego Projektuj AI
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Zobacz projekt przed podjęciem decyzji
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-400">
              Sprawdź styl, układ i materiały jeszcze przed zamówieniem mebli
              lub rozpoczęciem remontu.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Oszczędzasz czas",
                text: "Pierwszą wizualizację otrzymujesz bez wielodniowego oczekiwania.",
              },
              {
                title: "Porównujesz warianty",
                text: "Możesz tworzyć kolejne wersje i sprawdzać różne materiały.",
              },
              {
                title: "Widzisz efekt wcześniej",
                text: "Łatwiej podjąć decyzję, gdy widzisz realistyczny projekt.",
              },
              {
                title: "Masz wszystko w jednym miejscu",
                text: "Projekt, poprawki, historia wersji i pobieranie plików.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-[#0c1016] p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d8aa4c]/10 text-xl text-[#f0c56e]">
                  ✦
                </div>

                <h3 className="mt-6 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-[#d8aa4c]/20 bg-[radial-gradient(circle_at_top_right,rgba(216,170,76,0.22),transparent_35%),linear-gradient(135deg,#11161d,#090c11)] px-6 py-16 text-center sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d8aa4c]">
              Zacznij już teraz
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Zobacz swoje wnętrze, zanim je urządzisz
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              Utwórz konto, dodaj zdjęcie pomieszczenia i przygotuj pierwszy
              projekt z pomocą sztucznej inteligencji.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-8 py-5 text-lg font-bold text-black transition hover:brightness-110"
              >
                Załóż konto
              </Link>

              <Link
                href="/pricing"
                className="rounded-2xl border border-white/15 bg-white/[0.05] px-8 py-5 text-lg font-bold transition hover:bg-white/[0.09]"
              >
                Sprawdź pakiety
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#05070a] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          <div>
            <Image
              src="/logo.png"
              alt="Projektuj AI"
              width={210}
              height={70}
              className="h-auto w-[190px]"
            />

            <p className="mt-5 max-w-sm leading-7 text-gray-500">
              Inteligentne projektowanie wnętrz i mebli z pomocą sztucznej
              inteligencji.
            </p>
          </div>

          <div>
            <div className="font-bold">
              Nawigacja
            </div>

            <div className="mt-5 flex flex-col gap-3 text-gray-400">
              <Link
                href="/pricing"
                className="transition hover:text-[#f0c56e]"
              >
                Pakiety
              </Link>

              <Link
                href="/login"
                className="transition hover:text-[#f0c56e]"
              >
                Logowanie
              </Link>

              <Link
                href="/register"
                className="transition hover:text-[#f0c56e]"
              >
                Rejestracja
              </Link>

              <Link
                href="/reset-password"
                className="transition hover:text-[#f0c56e]"
              >
                Reset hasła
              </Link>
            </div>
          </div>

          <div>
            <div className="font-bold">
              Informacje
            </div>

            <div className="mt-5 flex flex-col gap-3 text-gray-400">
              <Link
                href="/privacy-policy"
                className="transition hover:text-[#f0c56e]"
              >
                Polityka prywatności
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-[#f0c56e]"
              >
                Regulamin
              </Link>

              <Link
                href="/cookies"
                className="transition hover:text-[#f0c56e]"
              >
                Pliki cookies
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Projektuj AI. Wszelkie prawa zastrzeżone.
        </div>
      </footer>
    </main>
  );
}