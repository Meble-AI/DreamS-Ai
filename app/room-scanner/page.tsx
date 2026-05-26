import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const images =
      body.images || [];

    if (!images.length) {

      return NextResponse.json(
        {
          error:
            "Brak zdjęć",
        },
        {
          status: 400,
        }
      );
    }

    const response =
      await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`,
          },

          body: JSON.stringify({

            model:
              "gpt-4.1-mini",

            messages: [

              {
                role: "system",

                content:
                  `
                  Jesteś ekspertem od projektowania wnętrz premium.
                  Analizujesz zdjęcia pomieszczeń.
                  `,
              },

              {
                role: "user",

                content: [

                  {
                    type: "text",

                    text:
                      "Przeanalizuj pomieszczenie.",
                  },

                  ...images.map(
                    (
                      image: string
                    ) => ({

                      type:
                        "image_url",

                      image_url: {
                        url: image,
                      },
                    })
                  ),
                ],
              },
            ],

            max_tokens: 1000,
          }),
        }
      );

    const data =
      await response.json();

    const analysis =
      data?.choices?.[0]
        ?.message?.content ||
      "Brak analizy.";

    return NextResponse.json({
      analysis,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Błąd AI Room Scanner",
      },
      {
        status: 500,
      }
    );
  }
}