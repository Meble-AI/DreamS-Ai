export const runtime = "nodejs";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(
  req: Request
) {
  try {
    console.log("START CHECKOUT");

    // =========================
    // SPRAWDZENIE TOKENU
    // =========================

    const authorization =
      req.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
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

    const accessToken =
      authorization.replace(
        "Bearer ",
        ""
      );

    if (!accessToken) {
      return Response.json(
        {
          error:
            "Brak ważnej sesji użytkownika.",
        },
        {
          status: 401,
        }
      );
    }

    // Supabase sprawdza, czy token jest prawidłowy
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(
      accessToken
    );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "SUPABASE AUTH ERROR:",
        userError
      );

      return Response.json(
        {
          error:
            "Sesja wygasła. Zaloguj się ponownie.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    if (!user.email) {
      return Response.json(
        {
          error:
            "Na koncie nie ma adresu e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // ODCZYT DANYCH PAKIETU
    // =========================

    const body =
      await req.json();

    const {
      priceId,
      planName,
    } = body;

    console.log(
      "VERIFIED USER ID:",
      user.id
    );

    console.log(
      "VERIFIED EMAIL:",
      user.email
    );

    console.log(
      "PRICE ID:",
      priceId
    );

    console.log(
      "PLAN:",
      planName
    );

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

    // =========================
    // DOZWOLONE PAKIETY
    // =========================

    const startPriceId =
      process.env
        .NEXT_PUBLIC_STRIPE_START_PRICE_ID;

    const proPriceId =
      process.env
        .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

    const premiumPriceId =
      process.env
        .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

    const allowedPrices =
      new Map<string, string>();

    if (startPriceId) {
      allowedPrices.set(
        startPriceId,
        "START"
      );
    }

    if (proPriceId) {
      allowedPrices.set(
        proPriceId,
        "PRO"
      );
    }

    if (premiumPriceId) {
      allowedPrices.set(
        premiumPriceId,
        "PREMIUM"
      );
    }

    const verifiedPlanName =
      allowedPrices.get(priceId);

    if (!verifiedPlanName) {
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

        customer_email:
          user.email,

        // Zweryfikowane ID użytkownika
        // pobrane bezpośrednio z Supabase
        client_reference_id:
          user.id,

        metadata: {
          userId: user.id,
          priceId,
          planName:
            verifiedPlanName,
        },

        payment_intent_data: {
          metadata: {
            userId: user.id,
            priceId,
            planName:
              verifiedPlanName,
          },
        },

        success_url:
          "https://dreamsai.pl/success?session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
          "https://dreamsai.pl/pricing",
      });

    console.log(
      "SESSION CREATED:",
      session.id
    );

    return Response.json({
      url: session.url,
    });
  } catch (err: unknown) {
    console.error(
      "========== STRIPE CHECKOUT ERROR =========="
    );

    console.error(err);

    const message =
      err instanceof Error
        ? err.message
        : "Stripe error";

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}