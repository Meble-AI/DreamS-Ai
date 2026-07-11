import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(
  req: Request
) {
  try {
    console.log("START CHECKOUT");

    const body = await req.json();

    console.log("BODY:", body);

    const {
      priceId,
      email,
      userId,
      planName,
    } = body;

    console.log("PRICE ID:", priceId);
    console.log("USER ID:", userId);
    console.log("EMAIL:", email);
    console.log("PLAN:", planName);

    // =========================
    // WALIDACJA DANYCH
    // =========================

    if (!priceId) {
      return Response.json(
        {
          error: "Brak priceId",
        },
        {
          status: 400,
        }
      );
    }

    if (!userId) {
      return Response.json(
        {
          error:
            "Musisz być zalogowany, aby kupić kredyty.",
        },
        {
          status: 401,
        }
      );
    }

    if (!email) {
      return Response.json(
        {
          error:
            "Brak adresu e-mail użytkownika.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // DOZWOLONE PRICE ID
    // =========================

    const allowedPriceIds = [
      process.env
        .NEXT_PUBLIC_STRIPE_START_PRICE_ID,

      process.env
        .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,

      process.env
        .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    ].filter(Boolean);

    if (
      !allowedPriceIds.includes(
        priceId
      )
    ) {
      return Response.json(
        {
          error:
            "Nieprawidłowy pakiet Stripe.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // TWORZENIE SESJI STRIPE
    // =========================

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: [
          "card",
          "blik",
        ],

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        customer_email: email,

        // Id użytkownika Supabase
        client_reference_id: userId,

        // Dane odczytywane później
        // przez webhook Stripe
        metadata: {
          userId,
          priceId,
          planName:
            planName || "UNKNOWN",
        },

        payment_intent_data: {
          metadata: {
            userId,
            priceId,
            planName:
              planName || "UNKNOWN",
          },
        },

        success_url:
          "https://dreamsai.pl/success?session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
          "https://dreamsai.pl/pricing",
      });

    console.log("SESSION CREATED:");
    console.log(session.id);
    console.log(session.url);

    return Response.json({
      url: session.url,
    });
  } catch (err: any) {
    console.log("");
    console.log(
      "========== STRIPE ERROR =========="
    );
    console.log(err);
    console.log(
      "MESSAGE:",
      err?.message
    );
    console.log(
      "TYPE:",
      err?.type
    );
    console.log(
      "CODE:",
      err?.code
    );
    console.log(
      "RAW:",
      err?.raw
    );
    console.log(
      "=================================="
    );
    console.log("");

    return Response.json(
      {
        error:
          err?.message ||
          "Stripe error",
      },
      {
        status: 500,
      }
    );
  }
}