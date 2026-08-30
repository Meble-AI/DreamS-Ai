import Link from "next/link";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#07090d] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d8aa4c]">
          DreamS AI
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Pliki cookies
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-400">
          Poniżej wyjaśniamy, w jaki sposób dreamsai.pl może wykorzystywać pliki cookies i podobne technologie.
        </p>

        <div className="mt-12 space-y-6">
          <Section title="1. Czym są pliki cookies?">
            Cookies to niewielkie informacje zapisywane w przeglądarce użytkownika. Mogą być potrzebne między innymi do utrzymania sesji, zapamiętania ustawień oraz prawidłowego działania wybranych funkcji serwisu.
          </Section>

          <Section title="2. Cookies niezbędne">
            Cookies niezbędne mogą być używane bez dodatkowej zgody, gdy są konieczne do działania serwisu, bezpieczeństwa, logowania, obsługi konta lub zapamiętania ustawień prywatności.
          </Section>

          <Section title="3. Cookies opcjonalne">
            Cookies analityczne lub marketingowe, jeżeli zostaną wdrożone w serwisie, powinny być uruchamiane dopiero po wyrażeniu odpowiedniej zgody przez użytkownika. Odmowa zgody na cookies opcjonalne nie powinna blokować podstawowego korzystania z serwisu.
          </Section>

          <Section title="4. Wybór użytkownika">
            Przy pierwszej wizycie użytkownik może zaakceptować wszystkie dostępne kategorie cookies albo pozostać przy cookies niezbędnych. Informacja o dokonanym wyborze jest zapisywana w przeglądarce.
          </Section>

          <Section title="5. Ustawienia przeglądarki">
            Użytkownik może również usuwać lub blokować cookies z poziomu swojej przeglądarki. Zablokowanie cookies niezbędnych może spowodować, że logowanie lub niektóre funkcje DreamS AI nie będą działały prawidłowo.
          </Section>

          <Section title="6. Zmiany">
            Informacje o cookies mogą być aktualizowane wraz ze zmianami funkcjonalności serwisu lub wdrożeniem nowych narzędzi analitycznych i marketingowych.
          </Section>
        </div>

        <div className="mt-10 rounded-2xl border border-[#d8aa4c]/20 bg-[#d8aa4c]/5 p-5 text-sm leading-6 text-gray-300">
          Ta strona opisuje zasady techniczne dotyczące cookies. Szczegółowe informacje o przetwarzaniu danych osobowych znajdują się w{" "}
          <Link href="/privacy-policy" className="font-bold text-[#f0c56e] hover:underline">
            Polityce prywatności
          </Link>.
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c1016] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-4 leading-7 text-gray-400">{children}</p>
    </section>
  );
}
