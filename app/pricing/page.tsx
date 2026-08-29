"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PENDING_CHECKOUT_KEY =
  "dreams_ai_pending_checkout";

type PendingCheckout = {
  priceId: string;
  planName: string;
};

const plans = [
  {
    name: "START",
    oldPrice: "39,99 zł",
    price: "19,99 zł",
    projects: 1,
    credits: 3,
    description:
      "1 projekt kuchni + 2 poprawki",
    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_START_PRICE_ID || "",
  },
  {
    name: "PRO",
    oldPrice: "59,99 zł",
    price: "29,99 zł",
    projects: 2,
    credits: 6,
    description:
      "2 projekty kuchni + po 2 poprawki do każdego",
    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  },
  {
    name: "PREMIUM",
    oldPrice: "99,99 zł",
    price: "49,99 zł",
    projects: 3,
    credits: 9,
    description:
      "3 projekty kuchni + po 2 poprawki do każdego",
    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "",
  },
];

export default function PricingPage() {
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] =
    useState<string | null>(null);

  const resumedCheckout =
    useRef(false);

  function savePendingCheckout(
    priceId: string,
    planName: string
  ) {
    const pendingCheckout: PendingCheckout = {
      priceId,
      planName,
    };

    localStorage.setItem(
      PENDING_CHECKOUT_KEY,
      JSON.stringify(pendingCheckout)
    );
  }

  const createStripeCheckout =
    useCallback(
      async (
        priceId: string,
        planName: string,
        accessToken: string,
        allowRefresh = true
      ): Promise<boolean> => {
        try {
          setLoadingPlan(planName);

          const res =
            await fetch(
              "/api/checkout",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${accessToken}`,
                },

                body:
                  JSON.stringify({
                    priceId,
                    planName,
                  }),
              }
            );

          let data: {
            url?: string;
            error?: string;
          } = {};

          try {
            data =
              await res.json();
          } catch {
            alert(
              "Serwer zwrócił nieprawidłową odpowiedź. Spróbuj ponownie."
            );

            return false;
          }

          /*
            Jeżeli token wygasł, najpierw odświeżamy
            sesję po cichu i ponawiamy płatność.
            Nie przekierowujemy od razu do logowania.
          */
          if (
            res.status === 401 &&
            allowRefresh
          ) {
            const {
              data:
                refreshData,
              error:
                refreshError,
            } =
              await supabase
                .auth
                .refreshSession();

            const refreshedToken =
              refreshData
                .session
                ?.access_token;

            if (
              !refreshError &&
              refreshedToken
            ) {
              return await createStripeCheckout(
                priceId,
                planName,
                refreshedToken,
                false
              );
            }
          }

          if (
            res.status === 401
          ) {
            savePendingCheckout(
              priceId,
              planName
            );

            alert(
              data.error ||
              "Sesja logowania wygasła. Zaloguj się ponownie, a wybrany pakiet zostanie zachowany."
            );

            router.push(
              `/login?redirect=${encodeURIComponent(
                "/pricing?resumeCheckout=1"
              )}`
            );

            return false;
          }

          if (!res.ok) {
            alert(
              data.error ||
              "Nie udało się rozpocząć płatności."
            );

            return false;
          }

          if (!data.url) {
            alert(
              "Stripe nie zwrócił adresu płatności."
            );

            return false;
          }

          localStorage.removeItem(
            PENDING_CHECKOUT_KEY
          );

          window.location.assign(
            data.url
          );

          return true;

        } catch (
          err
        ) {
          console.error(
            "CHECKOUT ERROR:",
            err
          );

          alert(
            "Wystąpił błąd podczas uruchamiania płatności."
          );

          return false;

        } finally {
          setLoadingPlan(
            null
          );
        }
      },
      [router]
    );

  async function checkout(
    priceId: string,
    planName: string
  ) {
    if (!priceId) {
      alert(
        "Brak Stripe Price ID. Sprawdź zmienne środowiskowe."
      );

      return;
    }

    try {
      setLoadingPlan(
        planName
      );

      /*
        Najpierw odświeżamy sesję. Dzięki temu
        do API trafia aktualny token, a nie token
        zapisany wcześniej w przeglądarce.
      */
      const {
        data:
          refreshData,
        error:
          refreshError,
      } =
        await supabase
          .auth
          .refreshSession();

      let session =
        refreshData.session;

      if (
        refreshError ||
        !session
      ) {
        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase
            .auth
            .getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          savePendingCheckout(
            priceId,
            planName
          );

          router.push(
            `/login?redirect=${encodeURIComponent(
              "/pricing?resumeCheckout=1"
            )}`
          );

          return;
        }

        session =
          sessionData.session;
      }

      if (
        !session.access_token ||
        !session.user
      ) {
        savePendingCheckout(
          priceId,
          planName
        );

        router.push(
          `/login?redirect=${encodeURIComponent(
            "/pricing?resumeCheckout=1"
          )}`
        );

        return;
      }

      await createStripeCheckout(
        priceId,
        planName,
        session.access_token
      );

    } catch (
      err
    ) {
      console.error(
        "SESSION CHECK ERROR:",
        err
      );

      alert(
        "Nie udało się sprawdzić konta użytkownika."
      );

    } finally {
      setLoadingPlan(
        null
      );
    }
  }

  useEffect(() => {
    async function resumePendingCheckout() {
      if (resumedCheckout.current) {
        return;
      }

      const params =
        new URLSearchParams(
          window.location.search
        );

      const shouldResume =
        params.get(
          "resumeCheckout"
        ) === "1";

      // Nie uruchamiamy płatności automatycznie
      // podczas zwykłego wejścia na cennik.
      if (!shouldResume) {
        return;
      }

      const savedCheckout =
        localStorage.getItem(
          PENDING_CHECKOUT_KEY
        );

      if (!savedCheckout) {
        window.history.replaceState(
          {},
          "",
          "/pricing"
        );

        return;
      }

      let pendingCheckout:
        | PendingCheckout
        | undefined;

      try {
        pendingCheckout =
          JSON.parse(
            savedCheckout
          );
      } catch {
        localStorage.removeItem(
          PENDING_CHECKOUT_KEY
        );

        window.history.replaceState(
          {},
          "",
          "/pricing"
        );

        return;
      }

      if (
        !pendingCheckout?.priceId ||
        !pendingCheckout?.planName
      ) {
        localStorage.removeItem(
          PENDING_CHECKOUT_KEY
        );

        window.history.replaceState(
          {},
          "",
          "/pricing"
        );

        return;
      }

      const {
        data:
          refreshData,
        error:
          refreshError,
      } =
        await supabase
          .auth
          .refreshSession();

      let session =
        refreshData.session;

      if (
        refreshError ||
        !session
      ) {
        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase
            .auth
            .getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          window.location.href =
            `/login?redirect=${encodeURIComponent(
              "/pricing?resumeCheckout=1"
            )}`;

          return;
        }

        session =
          sessionData.session;
      }

      if (
        !session.access_token ||
        !session.user
      ) {
        window.location.href =
          `/login?redirect=${encodeURIComponent(
            "/pricing?resumeCheckout=1"
          )}`;

        return;
      }

      resumedCheckout.current =
        true;

      // Usuwamy parametr z adresu, aby odświeżenie
      // strony nie uruchamiało checkoutu ponownie.
      window.history.replaceState(
        {},
        "",
        "/pricing"
      );

      await createStripeCheckout(
        pendingCheckout.priceId,
        pendingCheckout.planName,
        session.access_token
      );
    }

    resumePendingCheckout();
  }, [createStripeCheckout]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(216,170,76,0.14),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.08),transparent_24%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#d8aa4c]/25 bg-[#d8aa4c]/10 px-5 py-3 text-sm font-semibold text-[#f0c56e]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f0c56e] shadow-[0_0_16px_rgba(240,197,110,0.8)]" />
            Pakiety Projektuj AI
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Wybierz pakiet dopasowany
            <span className="block bg-gradient-to-r from-white via-[#f5ddb0] to-[#d8aa4c] bg-clip-text text-transparent">
              do liczby projektów
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-400">
            Każdy projekt obejmuje pierwszą wizualizację oraz 2 poprawki.
            Rozmowa z projektantem AI przed wygenerowaniem wizualizacji nie zużywa kredytu.
          </p>
        </div>

        <div className="mt-14 grid gap-7 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isLoading =
              loadingPlan === plan.name;

            const isRecommended =
              plan.name === "PRO";

            return (
              <div
                key={plan.name}
                className={`relative rounded-[30px] border p-7 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
                  isRecommended
                    ? "border-[#d8aa4c]/50 bg-gradient-to-b from-[#d8aa4c]/10 to-[#0c1016]"
                    : "border-white/10 bg-[#0c1016]/95"
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-lg">
                    Najczęściej wybierany
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Pakiet
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
                      {plan.name}
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8aa4c]/10 text-xl text-[#f0c56e]">
                    {index === 0 ? "✦" : index === 1 ? "◆" : "★"}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-lg text-gray-600 line-through">
                    {plan.oldPrice}
                  </div>

                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-5xl font-black text-white">
                      {plan.price}
                    </span>

                    <span className="pb-1 text-sm text-gray-500">
                      jednorazowo
                    </span>
                  </div>

                  <div className="mt-4 inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                    Promocja -50%
                  </div>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="text-sm text-gray-500">
                    Liczba projektów
                  </div>

                  <div className="mt-1 text-3xl font-black text-[#f0c56e]">
                    {plan.projects}
                  </div>
                </div>

                <p className="mt-6 min-h-[56px] leading-7 text-gray-400">
                  {plan.description}
                </p>

                <div className="mt-7 space-y-4">
                  {[
                    "Fotorealistyczna wizualizacja AI",
                    "2 poprawki do każdego projektu",
                    "Historia wersji projektu",
                    "Pobieranie wizualizacji",
                    "Szacunkowa wycena",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d8aa4c]/10 text-sm text-[#f0c56e]">
                        ✓
                      </div>

                      <span className="text-sm text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={loadingPlan !== null}
                  onClick={() =>
                    checkout(
                      plan.priceId,
                      plan.name
                    )
                  }
                  className={`mt-8 w-full rounded-2xl px-6 py-4 text-lg font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isRecommended
                      ? "bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] text-black hover:brightness-110"
                      : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {isLoading
                    ? "Sprawdzanie konta..."
                    : "Kup pakiet"}
                </button>
              </div>
            );
          })}
        </div>

        <section className="mt-20 rounded-[32px] border border-white/10 bg-[#0c1016] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d8aa4c]">
                Bezpieczny zakup
              </div>

              <h2 className="mt-4 text-3xl font-black">
                Płatność dopiero po zalogowaniu
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-gray-400">
                Po wybraniu pakietu sprawdzamy Twoje konto. Jeżeli nie jesteś
                zalogowany, zapisujemy wybrany pakiet i kierujemy Cię do
                logowania. Po zalogowaniu płatność uruchomi się automatycznie.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "1",
                  text: "Wybierasz pakiet",
                },
                {
                  title: "2",
                  text: "Logujesz się",
                },
                {
                  title: "3",
                  text: "Przechodzisz do płatności",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#d8aa4c]/10 font-black text-[#f0c56e]">
                    {step.title}
                  </div>

                  <div className="mt-4 text-sm font-semibold text-gray-300">
                    {step.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d8aa4c]">
              Najczęstsze pytania
            </div>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Wszystko, co warto wiedzieć przed zakupem
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
            {[
              {
                q: "Czy płatność jest jednorazowa?",
                a: "Tak. Każdy pakiet to jednorazowy zakup określonej liczby projektów. Każdy projekt obejmuje pierwszą wizualizację i 2 poprawki.",
              },
              {
                q: "Czy muszę mieć konto?",
                a: "Tak. Konto jest potrzebne do zapisania kredytów, projektów i historii poprawek.",
              },
              {
                q: "Czy mogę poprawiać projekt?",
                a: "Tak. Po wygenerowaniu wizualizacji możesz opisać, co należy zmienić.",
              },
              {
                q: "Czy mogę pobrać wizualizację?",
                a: "Tak. Gotowe obrazy możesz powiększyć i pobrać na komputer.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-white/10 bg-[#0c1016] p-6"
              >
                <h3 className="font-bold text-white">
                  {item.q}
                </h3>

                <p className="mt-3 leading-7 text-gray-400">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
