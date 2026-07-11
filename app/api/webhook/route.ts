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

// =========================
// LICZBA KREDYTÓW DLA PAKIETU
// =========================

function getCreditsForPrice(
  priceId: string
): number {
  const startPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_START_PRICE_ID;

  const proPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  const premiumPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

  if (
    priceId === startPriceId
  ) {
    return 1;
  }

  if (
    priceId === proPriceId
  ) {
    return 2;
  }

  if (
    priceId === premiumPriceId
  ) {
    return 3;
  }

  return 0;
}

// =========================
// PRZYZNANIE KREDYTÓW
// =========================

async function addCredits(
  session: Stripe.Checkout.Session
) {
  console.log(
    "PROCESSING SESSION:",
    session.id
  );

  console.log(
    "PAYMENT STATUS:",
    session.payment_status
  );

  if (
    session.payment_status !== "paid"
  ) {
    console.log(
      "PAYMENT NOT PAID - SKIPPING"
    );

    return;
  }

  const userId =
    session.client_reference_id ||
    session.metadata?.userId;

  const priceId =
    session.metadata?.priceId;

  console.log("USER ID:", userId);
  console.log("PRICE ID:", priceId);

  if (!userId) {
    throw new Error(
      "Brak userId w sesji Stripe"
    );
  }

  if (!priceId) {
    throw new Error(
      "Brak priceId w sesji Stripe"
    );
  }

  const creditsToAdd =
    getCreditsForPrice(priceId);

  console.log(
    "CREDITS TO ADD:",
    creditsToAdd
  );

  if (creditsToAdd <= 0) {
    throw new Error(
      "Nieznany Stripe Price ID"
    );
  }

  // Pobieramy aktualny profil użytkownika

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, credits")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error(
      "PROFILE READ ERROR:",
      profileError
    );

    throw new Error(
      "Nie udało się pobrać profilu użytkownika"
    );
  }

  if (!profile) {
    throw new Error(
      "Nie znaleziono profilu użytkownika"
    );
  }

  const currentCredits =
    Number(profile.credits || 0);

  const newCredits =
    currentCredits +
    creditsToAdd;

  console.log(
    "CURRENT CREDITS:",
    currentCredits
  );

  console.log(
    "NEW CREDITS:",
    newCredits
  );

  // Aktualizujemy kredyty użytkownika

  const {
    error: updateError,
  } = await supabase
    .from("profiles")
    .update({
      credits: newCredits,
    })
    .eq("id", userId);

  if (updateError) {
    console.error(
      "PROFILE UPDATE ERROR:",
      updateError
    );

    throw new Error(
      "Nie udało się przyznać kredytów"
    );
  }

  console.log(
    "CREDITS ADDED SUCCESSFULLY"
  );
}

// =========================
// WEBHOOK STRIPE
// =========================

export async function POST(
  req: Request
) {
  try {
    const webhookSecret =
      process.env
        .STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return Response.json(
        {
          error:
            "Brak STRIPE_WEBHOOK_SECRET",
        },
        {
          status: 500,
        }
      );
    }

    const signature =
      req.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      return Response.json(
        {
          error:
            "Brak podpisu Stripe",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.text();

    let event: Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
    } catch (err: any) {
      console.error(
        "INVALID WEBHOOK SIGNATURE:",
        err?.message
      );

      return Response.json(
        {
          error:
            "Nieprawidłowy podpis webhooka",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "STRIPE EVENT:",
      event.type
    );

    // Zwykła płatność zakończona
    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data
          .object as Stripe.Checkout.Session;

      await addCredits(session);
    }

    // Płatność potwierdzona z opóźnieniem
    if (
      event.type ===
      "checkout.session.async_payment_succeeded"
    ) {
      const session =
        event.data
          .object as Stripe.Checkout.Session;

      await addCredits(session);
    }

    return Response.json({
      received: true,
    });
  } catch (err: any) {
    console.error("");
    console.error(
      "========== WEBHOOK ERROR =========="
    );
    console.error(err);
    console.error(
      "MESSAGE:",
      err?.message
    );
    console.error(
      "=================================="
    );
    console.error("");

    return Response.json(
      {
        error:
          err?.message ||
          "Webhook error",
      },
      {
        status: 500,
      }
    );
  }
}