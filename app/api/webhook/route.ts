export const runtime = "nodejs";

import Stripe from "stripe";
import {
  createClient,
} from "@supabase/supabase-js";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Brak STRIPE_SECRET_KEY."
  );
}

if (!webhookSecret) {
  throw new Error(
    "Brak STRIPE_WEBHOOK_SECRET."
  );
}

if (
  !supabaseUrl ||
  !supabaseServerKey
) {
  throw new Error(
    "Brak danych Supabase po stronie serwera."
  );
}

const stripe =
  new Stripe(
    stripeSecretKey
  );

const supabase =
  createClient(
    supabaseUrl,
    supabaseServerKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );

type PlanData = {
  name:
    "START" |
    "PRO" |
    "PREMIUM";

  credits:
    number;
};

function getPlanForPrice(
  priceId: string
): PlanData | null {

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
    startPriceId &&
    priceId === startPriceId
  ) {

    return {
      name:
        "START",

      credits:
        1,
    };
  }

  if (
    proPriceId &&
    priceId === proPriceId
  ) {

    return {
      name:
        "PRO",

      credits:
        2,
    };
  }

  if (
    premiumPriceId &&
    priceId === premiumPriceId
  ) {

    return {
      name:
        "PREMIUM",

      credits:
        3,
    };
  }

  return null;
}

async function getCheckoutPriceId(
  session:
    Stripe.Checkout.Session
) {

  const metadataPriceId =
    session.metadata?.priceId;

  if (metadataPriceId) {
    return metadataPriceId;
  }

  const lineItems =
    await stripe
      .checkout
      .sessions
      .listLineItems(
        session.id,
        {
          limit:
            1,
        }
      );

  const firstPrice =
    lineItems.data?.[0]
      ?.price;

  return (
    typeof firstPrice === "string"
      ? firstPrice
      : firstPrice?.id
  ) || null;
}

async function processPaidSession(
  session:
    Stripe.Checkout.Session
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
    session.payment_status !==
    "paid"
  ) {

    console.log(
      "PAYMENT NOT PAID - SKIPPING"
    );

    return;
  }

  const userId =
    session.client_reference_id ||
    session.metadata?.userId;

  const userEmail =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.userEmail ||
    null;

  const priceId =
    await getCheckoutPriceId(
      session
    );

  if (!userId) {

    throw new Error(
      "Brak userId w sesji Stripe."
    );
  }

  if (!priceId) {

    throw new Error(
      "Brak priceId w sesji Stripe."
    );
  }

  const plan =
    getPlanForPrice(
      priceId
    );

  if (!plan) {

    throw new Error(
      "Nieznany Stripe Price ID."
    );
  }

  const projectId =
    session.metadata?.projectId ||
    null;

  const versionNumberRaw =
    session.metadata
      ?.versionNumber;

  const versionNumber =
    versionNumberRaw
      ? Number(
          versionNumberRaw
        )
      : null;

  console.log(
    "USER ID:",
    userId
  );

  console.log(
    "USER EMAIL:",
    userEmail
  );

  console.log(
    "PRICE ID:",
    priceId
  );

  console.log(
    "PLAN:",
    plan.name
  );

  console.log(
    "CREDITS TO ADD:",
    plan.credits
  );

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "process_stripe_credit_purchase",
      {
        p_session_id:
          session.id,

        p_payment_intent_id:
          typeof session.payment_intent ===
          "string"
            ? session.payment_intent
            : session.payment_intent?.id ||
              null,

        p_user_id:
          userId,

        p_user_email:
          userEmail,

        p_price_id:
          priceId,

        p_plan_name:
          plan.name,

        p_credits:
          plan.credits,

        p_amount_total:
          session.amount_total ||
          0,

        p_currency:
          session.currency ||
          "pln",

        p_project_id:
          projectId || null,

        p_version_number:
          Number.isFinite(
            versionNumber
          )
            ? versionNumber
            : null,
      }
    );

  if (error) {

    console.error(
      "PURCHASE RPC ERROR:",
      error
    );

    throw new Error(
      error.message ||
      "Nie udało się rozliczyć płatności."
    );
  }

  console.log(
    "PURCHASE RESULT:",
    data
  );
}

export async function POST(
  req: Request
) {

  try {

    const signature =
      req.headers.get(
        "stripe-signature"
      );

    if (!signature) {

      return Response.json(
        {
          success:
            false,

          error:
            "Brak podpisu Stripe.",
        },
        {
          status:
            400,
        }
      );
    }

    const rawBody =
      await req.text();

    let event:
      Stripe.Event;

    try {

      event =
        stripe.webhooks
          .constructEvent(
            rawBody,
            signature,
            webhookSecret
          );

    } catch (
      error: unknown
    ) {

      const message =
        error instanceof Error
          ? error.message
          : "Nieprawidłowy podpis webhooka.";

      console.error(
        "INVALID WEBHOOK SIGNATURE:",
        message
      );

      return Response.json(
        {
          success:
            false,

          error:
            "Nieprawidłowy podpis webhooka.",
        },
        {
          status:
            400,
        }
      );
    }

    console.log(
      "STRIPE EVENT:",
      event.type
    );

    switch (
      event.type
    ) {

      case "checkout.session.completed":

      case "checkout.session.async_payment_succeeded": {

        const session =
          event.data
            .object as Stripe.Checkout.Session;

        await processPaidSession(
          session
        );

        break;
      }

      case "checkout.session.async_payment_failed": {

        const session =
          event.data
            .object as Stripe.Checkout.Session;

        console.warn(
          "ASYNC PAYMENT FAILED:",
          session.id
        );

        break;
      }

      default: {

        console.log(
          "IGNORED STRIPE EVENT:",
          event.type
        );
      }
    }

    return Response.json({
      success:
        true,

      received:
        true,
    });

  } catch (
    error: unknown
  ) {

    console.error(
      "========== WEBHOOK ERROR =========="
    );

    console.error(
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Błąd webhooka Stripe.";

    return Response.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          500,
      }
    );
  }
}