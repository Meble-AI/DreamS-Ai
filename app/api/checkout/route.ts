import Stripe from "stripe";

const stripe =
  new Stripe(

    process.env.STRIPE_SECRET_KEY!,

    {
      apiVersion:
  "2025-04-30.basil" as any,
    }
  );

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      priceId,
    } = body;

    if (!priceId) {

      return Response.json(

        {
          error:
            "Brak priceId",
        },

        {
          status: 400,
        }
      );
    }

    const session =
      await stripe.checkout.sessions.create({

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

        mode: "payment",

        success_url:
          "https://dream-s-ai.vercel.app/success",

        cancel_url:
          "https://dream-s-ai.vercel.app/pricing",
      });

    return Response.json({

      url:
        session.url,
    });

  } catch (err) {

    console.log(err);

    return Response.json(

      {
        error:
          "Stripe error",
      },

      {
        status: 500,
      }
    );
  }
}