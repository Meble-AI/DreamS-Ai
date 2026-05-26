import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(
  req: Request
) {

  try {

    console.log("START CHECKOUT");

    const body =
      await req.json();

    console.log("BODY:", body);

    const {
      priceId,
      email,
    } = body;

    console.log("PRICE ID:", priceId);

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
          email || undefined,

        success_url:
          "https://dreamsai.pl/success",

        cancel_url:
          "https://dreamsai.pl/pricing",
      });

    console.log("SESSION CREATED:");
    console.log(session.url);

    return Response.json({
      url: session.url,
    });

  } catch (err: any) {

    console.log("");
    console.log("========== STRIPE ERROR ==========");
    console.log(err);
    console.log("MESSAGE:", err?.message);
    console.log("TYPE:", err?.type);
    console.log("CODE:", err?.code);
    console.log("RAW:", err?.raw);
    console.log("==================================");
    console.log("");

    return Response.json(
      {
        error:
          err?.message || "Stripe error",
      },
      {
        status: 500,
      }
    );
  }
}