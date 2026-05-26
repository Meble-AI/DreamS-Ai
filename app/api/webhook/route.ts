import Stripe from "stripe";

import {
  createClient
} from "@supabase/supabase-js";

const stripe =
  new Stripe(
    process.env.STRIPE_SECRET_KEY!
  );

export async function POST(
  req: Request
) {

  try {

    const supabase =
      createClient(

        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,

        process.env
          .SUPABASE_KEY!
      );

    const body =
      await req.text();

    const signature =
      req.headers.get(
        "stripe-signature"
      )!;

    const event =
      stripe.webhooks.constructEvent(

        body,

        signature,

        process.env
          .STRIPE_WEBHOOK_SECRET!
      );

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

        if (!customerEmail) {

          return Response.json({
            received: true,
          });
        }

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

        if (!profile) {

          return Response.json({
            received: true,
          });
        }

        await supabase

          .from("profiles")

          .update({

            credits:
              (profile.credits || 0)
              + 1,
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

  } catch (err) {

    console.log(err);

    return Response.json(

      {
        error: "Webhook error",
      },

      {
        status: 500,
      }
    );
  }
}