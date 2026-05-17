import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion: "2026-04-22.dahlia",
  }
);

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const email =
      body.email;

    const plan =
      body.plan;

    let priceId = "";

    if (plan === "basic") {

      priceId =
        process.env
          .STRIPE_BASIC_PRICE_ID!;

    } else if (
      plan === "premium"
    ) {

      priceId =
        process.env
          .STRIPE_PREMIUM_PRICE_ID!;

    } else {

      priceId =
        process.env
          .STRIPE_PRO_PRICE_ID!;
    }

    const session =
      await stripe.checkout.sessions.create({

        customer_email:
          email,

        payment_method_types: [
          "card",
        ],

        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        success_url:
          "http://localhost:3000",

        cancel_url:
          "http://localhost:3000",
      });

    return Response.json({

      url:
        session.url,
    });

  } catch (err: any) {

    console.log(err);

    return Response.json({

      error:
        err.message,
    });
  }
}