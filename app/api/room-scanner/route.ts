export const maxDuration = 60;

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { images } = body;

    if (!images || !images.length) {
      return Response.json(
        {
          error: "Brak zdjęć",
        },
        {
          status: 400,
        }
      );
    }

    const kitchenRules = `
BARDZO WAŻNE ZASADY PROJEKTU KUCHNI:

1. Nie wolno dublować elementów kuchni.
2. W projekcie może być maksymalnie jeden zlew, chyba że użytkownik wyraźnie poprosi o dwa.
3. Nie generuj dwóch zlewów.
4. Nie generuj dwóch lodówek.
5. Nie generuj dwóch płyt grzewczych.
6. Nie generuj zdublowanego AGD.
7. Kuchnia musi zawierać lodówkę.
8. Lodówka nie może zostać pominięta.
9. Lodówka ma być widoczna jako pełnowymiarowa lodówka w zabudowie albo wolnostojąca, zgodnie z układem kuchni.
10. Kuchnia ma zawierać logiczny zestaw AGD:
- lodówka,
- zlew,
- płyta grzewcza,
- piekarnik,
- zmywarka.
11. Jeżeli miejsce jest ograniczone, lepiej uprościć zabudowę niż pominąć lodówkę.
12. Układ ma być realistyczny i możliwy do wykonania przez stolarza.
13. Nie dodawaj przypadkowych dodatkowych urządzeń.
14. Zachowaj ergonomię: lodówka, zlew i płyta powinny tworzyć logiczny trójkąt roboczy.
15. Przed wygenerowaniem opisu sprawdź zgodność: dokładnie jeden zlew, jedna lodówka, jedna płyta grzewcza.
`;

    // =========================
    // AI ROOM ANALYSIS
    // =========================

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4.1",

      messages: [
        {
          role: "system",

          content: `
Jesteś ekspertem projektowania wnętrz premium oraz projektantem kuchni na wymiar.

Przeanalizuj pomieszczenie ze zdjęć.

${kitchenRules}

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
- rozmieszczenie lodówki,
- rozmieszczenie zlewu,
- rozmieszczenie płyty grzewczej,
- rozmieszczenie piekarnika,
- rozmieszczenie zmywarki,
- styl,
- materiały,
- kolorystykę,
- realne proporcje,
- premium wygląd.

Opis ma być profesjonalny, ale musi być technicznie spójny.
Nie wolno opisać dwóch zlewów.
Nie wolno pominąć lodówki.
          `,
        },

        {
          role: "user",

          content: [
            {
              type: "text",

              text: `
Przeanalizuj pomieszczenie i zaprojektuj realistyczną kuchnię premium.

Pamiętaj:
- dokładnie jeden zlew,
- lodówka obowiązkowo,
- brak zdublowanego AGD,
- realistyczny układ kuchni możliwy do wykonania.
              `,
            },

            ...images.map((image: string) => ({
              type: "image_url",

              image_url: {
                url: image,
              },
            })),
          ],
        },
      ],
    });

    const analysis =
      analysisResponse.choices?.[0]?.message?.content || "";

    // =========================
    // GENERATE KITCHEN IMAGE
    // =========================

    const imagePrompt = `
Fotorealistyczna nowoczesna kuchnia premium na wymiar.

OPIS PROJEKTU:
${analysis}

KRYTYCZNE WYMAGANIA DO WIZUALIZACJI:
- Wygeneruj dokładnie jeden zlew.
- Nie generuj drugiego zlewu.
- Lodówka musi być widoczna w projekcie.
- Lodówka ma być pełnowymiarowa, najlepiej w zabudowie wysokiej.
- Wygeneruj dokładnie jedną płytę grzewczą.
- Nie dubluj AGD.
- Nie dodawaj przypadkowych urządzeń.
- Kuchnia ma zawierać: lodówkę, zlew, płytę grzewczą, piekarnik i zmywarkę.
- Układ ma być realistyczny, ergonomiczny i możliwy do wykonania.
- Proporcje szafek, blatów i AGD mają być naturalne.

Styl:
Ultra realistic.
Luxury kitchen.
Interior design magazine quality.
Real proportions.
Architectural visualization.
Premium custom kitchen.
Clean modern design.
`;

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      size: "1536x1024",
      prompt: imagePrompt,
    });

    const image = imageResponse.data?.[0]?.b64_json;

    return Response.json({
      success: true,
      analysis,
      image,
    });
  } catch (err: any) {
    console.log(err);

    return Response.json(
      {
        error: err?.message || "AI Room Scanner error",
      },
      {
        status: 500,
      }
    );
  }
}