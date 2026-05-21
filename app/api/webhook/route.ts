import Stripe from "stripe";

import { createClient }
from "@supabase/supabase-js";

const stripe =
  new Stripe(

    process.env.STRIPE_SECRET_KEY!,

    {
      apiVersion:
        "2025-04-30.basil" as any,
    }
  );

const supabase =
  createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(
  req: Request
) {

  const body =
    await req.text();

  const signature =
    req.headers.get(
      "stripe-signature"
    )!;

  let event: Stripe.Event;

  try {

    event =
      stripe.webhooks.constructEvent(

        body,

        signature,

        process.env
          .STRIPE_WEBHOOK_SECRET!
      );

  } catch (err) {

    console.log(err);

    return new Response(

      "Webhook Error",

      {
        status: 400,
      }
    );
  }

  // ====================================
  // CHECKOUT SUCCESS
  // ====================================

  if (
    event.type ===
    "checkout.session.completed"
  ) {

    try {

      const session =
        event.data.object as any;

      const customerEmail =
        session.customer_details
          ?.email;

      const priceId =
        session.line_items?.data?.[0]
          ?.price?.id;

      if (!customerEmail)
        return Response.json({
          received: true,
        });

      // ====================================
      // FIND PROFILE
      // ====================================

      const {
        data: profile,
      } =
        await supabase

          .from("profiles")

          .select("*")

          .eq(
            "email",
            customerEmail
          )

          .single();

      if (!profile)
        return Response.json({
          received: true,
        });

      let credits = 0;
      let plan = "FREE";

      // ====================================
      // PLAN MAPPING
      // ====================================

      if (
        priceId ===
        process.env
          .NEXT_PUBLIC_STRIPE_START_PRICE_ID
      ) {

        credits = 1;
        plan = "START";
      }

      if (
        priceId ===
        process.env
          .NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
      ) {

        credits = 2;
        plan = "PRO";
      }

      if (
        priceId ===
        process.env
          .NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
      ) {

        credits = 3;
        plan = "PREMIUM";
      }

      // ====================================
      // UPDATE PROFILE
      // ====================================

      await supabase

        .from("profiles")

        .update({

          credits:
            (profile.credits || 0)
            + credits,

          plan,
        })

        .eq(
          "id",
          profile.id
        );

    } catch (err) {

      console.log(
        "WEBHOOK ERROR:",
        err
      );
    }
  }

  return Response.json({
    received: true,
  });
}