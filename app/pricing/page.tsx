"use client";

const plans = [
  {
    name: "START",

    price: "39,99 zł",

    credits: 1,

    description:
      "1 projekt kuchni premium z AI",

    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_START_PRICE_ID || "",
  },

  {
    name: "PRO",

    price: "59,99 zł",

    credits: 2,

    description:
      "2 projekty + więcej możliwości",

    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  },

  {
    name: "PREMIUM",

    price: "99,99 zł",

    credits: 3,

    description:
      "3 projekty premium + pełna swoboda",

    priceId:
      process.env
        .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "",
  },
];

export default function PricingPage() {

  async function checkout(
    priceId: string
  ) {

    try {

      console.log("PRICE ID:", priceId);

      if (!priceId) {

        alert(
          "Brak Stripe Price ID"
        );

        return;
      }

      const res =
        await fetch(
          "/api/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              priceId,
            }),
          }
        );

      const data =
        await res.json();

      console.log("STRIPE RESPONSE:", data);

      if (!res.ok) {

        alert(
          data.error ||
          "Stripe error"
        );

        return;
      }

      if (!data.url) {

        alert(
          "Brak URL Stripe"
        );

        return;
      }

      window.location.href =
        data.url;

    } catch (err) {

      console.log(
        "CHECKOUT ERROR:",
        err
      );

      alert(
        "Błąd płatności"
      );
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
            Wybierz liczbę projektów
            AI dla swojej kuchni
          </p>

        </div>

        <div
          className="
            grid
            lg:grid-cols-3
            gap-8
          "
        >

          {plans.map((plan) => (

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
                  text-6xl
                  font-bold
                  mb-6
                  text-center
                "
              >
                {plan.price}
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
                {plan.credits}
                {" "}
                projekt(y)
              </div>

              <button

                onClick={() =>
                  checkout(
                    plan.priceId
                  )
                }

                className="
                  w-full
                  bg-green-600
                  hover:bg-green-500
                  transition
                  p-5
                  rounded-3xl
                  text-2xl
                  font-bold
                "
              >
                Kup teraz
              </button>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}