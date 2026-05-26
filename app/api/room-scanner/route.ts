import OpenAI from "openai";

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,
  });

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      images,
    } = body;

    if (
      !images ||
      !images.length
    ) {

      return Response.json(

        {
          error:
            "Brak zdjęć",
        },

        {
          status: 400,
        }
      );
    }

    // =========================
    // AI ROOM ANALYSIS
    // =========================

    const analysisResponse =
      await openai.chat.completions.create({

        model: "gpt-4.1",

        messages: [

          {
            role: "system",

            content: `
Jesteś ekspertem projektowania wnętrz premium.

Przeanalizuj pomieszczenie ze zdjęć.

Wykryj:
- układ pomieszczenia,
- ściany,
- okna,
- drzwi,
- ergonomię,
- miejsce na wyspę,
- możliwy układ kuchni.

Następnie opisz:
- najlepszy układ kuchni,
- styl,
- materiały,
- kolorystykę,
- realne proporcje,
- premium wygląd.

Opis ma być profesjonalny.
            `,
          },

          {
            role: "user",

            content: [

              {
                type: "text",

                text: `
Przeanalizuj pomieszczenie
i zaprojektuj realistyczną
kuchnię premium.
                `,
              },

              ...images.map(
                (
                  image: string
                ) => ({

                  type: "image_url",

                  image_url: {
                    url: image,
                  },
                })
              ),
            ],
          },
        ],
      });

    const analysis =
      analysisResponse
        .choices?.[0]
        ?.message
        ?.content || "";

    // =========================
    // GENERATE KITCHEN IMAGE
    // =========================

    const imageResponse =
      await openai.images.generate({

        model: "gpt-image-1",

        size: "1536x1024",

        prompt: `
Fotorealistyczna nowoczesna kuchnia premium.

${analysis}

Ultra realistic.
Luxury kitchen.
Interior design magazine quality.
Real proportions.
Architectural visualization.
        `,
      });

    const image =
      imageResponse
        .data?.[0]
        ?.b64_json;

    return Response.json({

      success: true,

      analysis,

      image,
    });

  } catch (err: any) {

    console.log(err);

    return Response.json(

      {
        error:
          err?.message ||
          "AI Room Scanner error",
      },

      {
        status: 500,
      }
    );
  }
}