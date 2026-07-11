"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const plans = [
  {
    name: "START",
    oldPrice: "39,99 zł",
    price: "19,99 zł",
    credits: 1,
    description: "1 projekt kuchni premium z AI",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_START_PRICE_ID || "",
  },
  {
    name: "PRO",
    oldPrice: "59,99 zł",
    price: "29,99 zł",
    credits: 2,
    description: "2 projekty + więcej możliwości",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  },
  {
    name: "PREMIUM",
    oldPrice: "99,99 zł",
    price: "49,99 zł",
    credits: 3,
    description: "3 projekty premium + pełna swoboda",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "",
  },
];

export default function PricingPage() {
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] =
    useState<string | null>(null);

  async function checkout(
    priceId: string,
    planName: string
  ) {
    try {
      if (!priceId) {
        alert("Brak Stripe Price ID");
        return;
      }

      setLoadingPlan(planName);

      // Pobieramy aktualną sesję Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Brak sesji = brak możliwości zakupu
      if (
        sessionError ||
        !session ||
        !session.access_token ||
        !session.user
      ) {
        alert(
          "Aby kupić projekty, musisz najpierw utworzyć konto lub się zalogować."
        );

        router.push("/login?redirect=/pricing");
        return;
      }

      // Wysyłamy do serwera token logowania.
      // Nie wysyłamy userId ani emaila.
      const res = await fetch("/api/checkout", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({
          priceId,
          planName,
        }),
      });

      let data: {
        url?: string;
        error?: string;
      };

      try {
        data = await res.json();
      } catch {
        alert(
          "Serwer zwrócił nieprawidłową odpowiedź. Spróbuj ponownie."
        );
        return;
      }

      if (res.status === 401) {
        await supabase.auth.signOut();

        alert(
          "Twoja sesja wygasła. Zaloguj się ponownie."
        );

        router.push("/login?redirect=/pricing");
        return;
      }

      if (!res.ok) {
        alert(
          data.error ||
            "Nie udało się rozpocząć płatności."
        );
        return;
      }

      if (!data.url) {
        alert(
          "Stripe nie zwrócił adresu płatności."
        );
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);

      alert(
        "Wystąpił błąd podczas uruchamiania płatności."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-black
        text-white
        p-10
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
        "
      >
        <div
          className="
            text-center
            mb-20
          "
        >
          <h1
            className="
              text-7xl
              font-bold
              mb-8
              text-center
            "
          >
            Pakiety DreamS AI
          </h1>

          <p
            className="
              text-2xl
              text-gray-400
            "
          >
            Wybierz liczbę projektów AI
            dla swojej kuchni
          </p>
        </div>

        <div
          className="
            grid
            lg:grid-cols-3
            gap-8
          "
        >
          {plans.map((plan) => {
            const isLoading =
              loadingPlan === plan.name;

            return (
              <div
                key={plan.name}
                className="
                  bg-white/5
                  border
                  border-white/10
                  rounded-[40px]
                  p-10
                  backdrop-blur-2xl
                "
              >
                <div
                  className="
                    text-5xl
                    font-bold
                    mb-6
                    text-center
                  "
                >
                  {plan.name}
                </div>

                <div
                  className="
                    text-center
                    mb-6
                  "
                >
                  <div
                    className="
                      text-2xl
                      text-gray-500
                      line-through
                      mb-2
                    "
                  >
                    {plan.oldPrice}
                  </div>

                  <div
                    className="
                      text-6xl
                      font-bold
                      text-green-400
                    "
                  >
                    {plan.price}
                  </div>

                  <div
                    className="
                      mt-3
                      inline-block
                      bg-red-600
                      px-4
                      py-2
                      rounded-full
                      text-lg
                      font-bold
                    "
                  >
                    🔥 RABAT 50%
                  </div>
                </div>

                <div
                  className="
                    mt-8
                    mb-8
                    text-center
                  "
                >
                  <div
                    className="
                      inline-block
                      bg-red-600
                      text-white
                      px-8
                      py-4
                      rounded-full
                      font-bold
                      text-xl
                    "
                  >
                    🔥 PROMOCJA -50% TYLKO TERAZ 🔥
                  </div>
                </div>

                <div
                  className="
                    text-xl
                    text-gray-400
                    mb-10
                    text-center
                  "
                >
                  {plan.description}
                </div>

                <div
                  className="
                    text-2xl
                    mb-10
                    text-center
                  "
                >
                  {plan.credits} projekt(y)
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
                  className="
                    w-full
                    bg-green-600
                    hover:bg-green-500
                    disabled:bg-gray-600
                    disabled:cursor-not-allowed
                    transition
                    p-5
                    rounded-3xl
                    text-2xl
                    font-bold
                  "
                >
                  {isLoading
                    ? "Sprawdzanie konta..."
                    : "Kup teraz"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}