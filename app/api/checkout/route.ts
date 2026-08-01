export const runtime = "nodejs";

import Stripe from "stripe";
import {
  createClient,
} from "@supabase/supabase-js";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Brak STRIPE_SECRET_KEY w zmiennych środowiskowych."
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
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

type CheckoutBody = {
  priceId?: string;
  planName?: string;
  projectId?: string | null;
  versionNumber?: number | null;
};

function getAllowedPrices() {

  const allowedPrices =
    new Map<
      string,
      {
        planName:
          "START" |
          "PRO" |
          "PREMIUM";

        credits:
          number;
      }
    >();

  const startPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_START_PRICE_ID;

  const proPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  const premiumPriceId =
    process.env
      .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

  if (startPriceId) {

    allowedPrices.set(
      startPriceId,
      {
        planName:
          "START",

        credits:
          1,
      }
    );
  }

  if (proPriceId) {

    allowedPrices.set(
      proPriceId,
      {
        planName:
          "PRO",

        credits:
          2,
      }
    );
  }

  if (premiumPriceId) {

    allowedPrices.set(
      premiumPriceId,
      {
        planName:
          "PREMIUM",

        credits:
          3,
      }
    );
  }

  return allowedPrices;
}

function cleanMetadataValue(
  value:
    string |
    number |
    null |
    undefined
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";
  }

  return String(
    value
  ).slice(
    0,
    500
  );
}

export async function POST(
  req: Request
) {

  try {

    console.log(
      "START CHECKOUT"
    );

    const authorization =
      req.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {

      return Response.json(
        {
          success:
            false,

          error:
            "Musisz być zalogowany, aby kupić kredyty.",
        },
        {
          status:
            401,
        }
      );
    }

    const accessToken =
      authorization
        .replace(
          "Bearer ",
          ""
        )
        .trim();

    if (!accessToken) {

      return Response.json(
        {
          success:
            false,

          error:
            "Brak ważnej sesji użytkownika.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabase
        .auth
        .getUser(
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
          success:
            false,

          error:
            "Sesja wygasła. Zaloguj się ponownie.",
        },
        {
          status:
            401,
        }
      );
    }

    const user =
      userData.user;

    if (!user.email) {

      return Response.json(
        {
          success:
            false,

          error:
            "Na koncie nie ma adresu e-mail.",
        },
        {
          status:
            400,
        }
      );
    }

    const body: CheckoutBody =
      await req.json();

    const priceId =
      body.priceId?.trim();

    const requestedPlanName =
      body.planName?.trim();

    const projectId =
      body.projectId?.trim() ||
      null;

    const versionNumber =
      Number.isFinite(
        Number(
          body.versionNumber
        )
      )
        ? Number(
            body.versionNumber
          )
        : null;

    if (!priceId) {

      return Response.json(
        {
          success:
            false,

          error:
            "Brak identyfikatora pakietu Stripe.",
        },
        {
          status:
            400,
        }
      );
    }

    const allowedPrices =
      getAllowedPrices();

    const verifiedPlan =
      allowedPrices.get(
        priceId
      );

    if (!verifiedPlan) {

      return Response.json(
        {
          success:
            false,

          error:
            "Nieprawidłowy pakiet Stripe.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      requestedPlanName &&
      requestedPlanName !==
        verifiedPlan.planName
    ) {

      console.warn(
        "PLAN NAME MISMATCH:",
        {
          requestedPlanName,
          verifiedPlanName:
            verifiedPlan.planName,
        }
      );
    }

    const requestUrl =
      new URL(
        req.url
      );

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL
        ?.replace(
          /\/$/,
          ""
        ) ||
      requestUrl.origin;

    const successUrl =
      `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${origin}/pricing?payment=cancelled`;

    const metadata = {

      userId:
        cleanMetadataValue(
          user.id
        ),

      userEmail:
        cleanMetadataValue(
          user.email
        ),

      priceId:
        cleanMetadataValue(
          priceId
        ),

      planName:
        cleanMetadataValue(
          verifiedPlan.planName
        ),

      credits:
        cleanMetadataValue(
          verifiedPlan.credits
        ),

      projectId:
        cleanMetadataValue(
          projectId
        ),

      versionNumber:
        cleanMetadataValue(
          versionNumber
        ),
    };

    const session =
      await stripe
        .checkout
        .sessions
        .create({

          mode:
            "payment",

          payment_method_types: [
            "card",
            "blik",
          ],

          line_items: [
            {
              price:
                priceId,

              quantity:
                1,
            },
          ],

          customer_email:
            user.email,

          client_reference_id:
            user.id,

          metadata,

          payment_intent_data: {
            metadata,
          },

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,
        });

    if (!session.url) {

      return Response.json(
        {
          success:
            false,

          error:
            "Stripe nie zwrócił adresu płatności.",
        },
        {
          status:
            500,
        }
      );
    }

    return Response.json({
      success:
        true,

      url:
        session.url,

      sessionId:
        session.id,

      planName:
        verifiedPlan.planName,

      credits:
        verifiedPlan.credits,
    });

  } catch (
    err: unknown
  ) {

    console.error(
      "========== STRIPE CHECKOUT ERROR =========="
    );

    console.error(
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : "Błąd Stripe";

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