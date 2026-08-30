export const runtime = "nodejs";

import Stripe from "stripe";
import {
  createClient,
} from "@supabase/supabase-js";

function cleanEnvironmentValue(
  value: string | undefined
): string {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

function normalizeSupabaseUrl(
  value: string | undefined
): string {

  const rawValue =
    cleanEnvironmentValue(
      value
    );

  if (!rawValue) {

    return "";
  }

  try {

    const parsedUrl =
      new URL(
        rawValue
      );

    return parsedUrl.origin;

  } catch {

    return rawValue
      .replace(
        /\/(rest|auth|storage)\/v1.*$/i,
        ""
      )
      .replace(
        /\/+$/,
        ""
      );
  }
}

function getServerClients() {

  const stripeSecretKey =
    cleanEnvironmentValue(
      process.env.STRIPE_SECRET_KEY
    );

  const supabaseUrl =
    normalizeSupabaseUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

  const supabaseAnonKey =
    cleanEnvironmentValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  if (!stripeSecretKey) {
    throw new Error(
      "Brak STRIPE_SECRET_KEY w zmiennych środowiskowych."
    );
  }

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    stripe:
      new Stripe(
        stripeSecretKey
      ),

    supabaseUrl,
    supabaseAnonKey,
  };
}

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
          3,
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
          6,
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
          9,
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

    const {
      stripe,
      supabaseUrl,
      supabaseAnonKey,
    } =
      getServerClients();

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

    const supabase =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,

            detectSessionInUrl:
              false,
          },

          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        }
      );

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
        {
          message:
            userError?.message,

          status:
            userError?.status,

          supabaseHost:
            (() => {
              try {
                return new URL(
                  supabaseUrl
                ).hostname;
              } catch {
                return "invalid";
              }
            })(),
        }
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
