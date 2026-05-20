import OpenAI from "openai";
import { addLogoToImage } from "@/lib/addLogo";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function calculateFurnitureEstimate(
  text: string
) {

  let netto = 25000;

  const lower =
    text.toLowerCase();

  if (
    lower.includes("premium")
  ) {
    netto += 6000;
  }

  if (
    lower.includes("blum")
  ) {
    netto += 4500;
  }

  if (
    lower.includes("cargo")
  ) {
    netto += 2500;
  }

  if (
    lower.includes("led")
  ) {
    netto += 1200;
  }

  if (
    lower.includes("spiek")
  ) {
    netto += 9000;
  }

  if (
    lower.includes("wyspa")
  ) {
    netto += 7000;
  }

  if (
    lower.includes("akryl")
  ) {
    netto += 3500;
  }

  netto += 4500;

  const brutto =
    Math.round(
      netto * 1.08
    );

  return {

    netto,
    brutto,
  };
}

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      message,
      history = [],
      name,
      phone,
      city,
      email,
      image,
    } = body;

    // =========================
    // ROOM VISION ANALYSIS
    // =========================

    let roomAnalysis = "";

    if (image) {

      try {

        const vision =
          await openai.chat.completions.create({

            model:
              "gpt-4.1-mini",

            messages: [

              {
                role: "system",

                content: `

Jesteś profesjonalnym projektantem kuchni premium.

Przeanalizuj przesłany rzut lub zdjęcie pomieszczenia.

Określ:
- układ pomieszczenia,
- ściany,
- okna,
- drzwi,
- możliwości zabudowy,
- ergonomię,
- ograniczenia projektowe,
- najlepszy układ kuchni.

Odpowiadaj bardzo konkretnie.

`,
              },

              {
                role: "user",

                content: [

                  {
                    type: "text",

                    text: `
Przeanalizuj to pomieszczenie pod projekt kuchni premium.
`,
                  },

                  {
                    type: "image_url",

                    image_url: {
                      url: image,
                    },
                  },
                ],
              },
            ],
          });

        roomAnalysis =
          vision.choices[0]
            .message.content || "";

      } catch (visionError) {

        console.log(
          "VISION ERROR:",
          visionError
        );
      }
    }

    const conversation = [

      ...history.map(
        (item: any) => `
KLIENT:
${item.user}

DREAMS AI:
${item.ai}
`
      ),

      `
KLIENT:
${message}
`,
    ].join("\n");

    const lowerConversation =
      conversation.toLowerCase();

    // =========================
    // EDIT DETECTION
    // =========================

    const isEditingProject =

      lowerConversation.includes("zmień")

      ||

      lowerConversation.includes("popraw")

      ||

      lowerConversation.includes("dodaj")

      ||

      lowerConversation.includes("usuń")

      ||

      lowerConversation.includes("powiększ")

      ||

      lowerConversation.includes("pomniejsz")

      ||

      lowerConversation.includes("edytuj")

      ||

      lowerConversation.includes("zostaw resztę")

      ||

      lowerConversation.includes("tylko");

    // =========================
    // STRUCTURED MEMORY
    // =========================

    const projectMemory = {

      styl:

        lowerConversation.includes("minimal")
          ? "minimalistyczny"

        : lowerConversation.includes("loft")
          ? "loft"

        : lowerConversation.includes("glamour")
          ? "glamour"

        : lowerConversation.includes("nowoczes")
          ? "nowoczesny"

        : "premium",

      kolor_frontow:

        lowerConversation.includes("kaszmir")
          ? "kaszmir"

        : lowerConversation.includes("czarn")
          ? "czarny"

        : lowerConversation.includes("bia")
          ? "biały"

        : lowerConversation.includes("drewn")
          ? "drewno"

        : "premium neutral",

      blat:

        lowerConversation.includes("spiek")
          ? "spiek"

        : lowerConversation.includes("drew")
          ? "drewniany"

        : lowerConversation.includes("konglomerat")
          ? "konglomerat"

        : "premium",

      uklad:

        lowerConversation.includes("wyspa")
          ? "L + wyspa"

        : lowerConversation.includes("układ l")
          ? "L"

        : lowerConversation.includes("układ u")
          ? "U"

        : lowerConversation.includes("dwurzęd")
          ? "dwurzędowy"

        : "jednorzędowy",

      ergonomia: {

        trojkat_roboczy: true,

        logiczne_narozniki: true,

        spojne_glebokosci: true,

        ciaglosc_blatow: true,

        ergonomiczne_przejscia: true,
      },

      wysoka_zabudowa:

        lowerConversation.includes(
          "wysoka zabudowa"
        ),

      wyspa:
        lowerConversation.includes(
          "wyspa"
        ),

      witryny:
        lowerConversation.includes(
          "witry"
        ),

      led:
        lowerConversation.includes(
          "led"
        ),

      blum:
        lowerConversation.includes(
          "blum"
        ),

      realne_pomieszczenie:
        !!image,
    };

    // =========================
    // CONSULTATION STAGE
    // =========================

    const consultationProgress = {

      styl:
        !!projectMemory.styl,

      kolor:
        !!projectMemory.kolor_frontow,

      blat:
        !!projectMemory.blat,

      uklad:
        !!projectMemory.uklad,

      wyspa:
        projectMemory.wyspa,

      materialy:
        projectMemory.blum,

      oswietlenie:
        projectMemory.led,
    };

    const missingItems =
      Object.entries(
        consultationProgress
      )
        .filter(
          ([, value]) => !value
        )
        .map(
          ([key]) => key
        );

    // =========================
    // PROJECT TRIGGER
    // =========================

const generateProject =

  lowerConversation.includes(
    "stwórz projekt"
  )

  ||

  lowerConversation.includes(
    "wygeneruj projekt"
  )

  ||

  lowerConversation.includes(
    "generuj wizualizację"
  )

  ||

  lowerConversation.includes(
    "pokaż projekt"
  )

  ||

  lowerConversation.includes(
    "zrób wizualizację"
  )

  ||

  lowerConversation.includes(
    "wizualizacja"
  )

  ||

  lowerConversation.includes(
    "projekt gotowy"
  )

  ||

  lowerConversation.includes(
    "zmień"
  )

  ||

  lowerConversation.includes(
    "popraw"
  )

  ||

  lowerConversation.includes(
    "dodaj"
  )

  ||

  lowerConversation.includes(
    "usuń"
  )

  ||

  lowerConversation.includes(
    "edytuj"
  )

  ||

  lowerConversation.includes(
    "przesuń"
  )

  ||

  lowerConversation.includes(
    "powiększ"
  )

  ||

  lowerConversation.includes(
    "pomniejsz"
  )

  ||

  lowerConversation.includes(
    "inny kolor"
  )

  ||

  lowerConversation.includes(
    "zmień blat"
  )

  ||

  lowerConversation.includes(
    "zmień fronty"
  )

  ||

  isEditingProject;

    // =========================
    // CONSULTATION
    // =========================

    if (!generateProject) {

      const consultation =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages: [

            {
              role: "system",

              content: `

Jesteś elitarnym projektantem kuchni premium DreamS AI.

Prowadź klienta jak profesjonalny projektant wnętrz.

BARDZO WAŻNE:

- analizuj pamięć projektu,
- analizuj całą rozmowę,
- analizuj rzut pomieszczenia,
- nie pytaj drugi raz o to samo,
- zadawaj maksymalnie 2 pytania,
- prowadź klienta krok po kroku,
- zachowuj się profesjonalnie,
- pomagaj klientowi podejmować decyzje,
- pamiętaj wcześniejsze ustalenia.

Jeśli czegoś brakuje:
- pytaj tylko o brakujące informacje.

`,
            },

            {
              role: "user",

              content: `

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

ANALIZA POMIESZCZENIA:

${roomAnalysis}

BRAKUJĄCE INFORMACJE:

${missingItems.join(", ")}

ROZMOWA:

${conversation}

`,
            },
          ],

          temperature: 0.8,
        });

      return Response.json({

        success: true,

        reply:
          consultation
            .choices[0]
            .message.content,

        generatedImage:
          null,

        generatedImages:
          [],

        floorPlan:
          null,
      });
    }

    // =========================
    // PROJECT AI
    // =========================

    const project =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role: "system",

            content: `

Jesteś elitarnym projektantem kuchni premium.

BARDZO WAŻNE:

- projektuj realistycznie,
- analizuj rzut pomieszczenia,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- zachowaj ergonomię,
- zachowaj poprawny trójkąt roboczy,
- zachowaj logiczne przejścia,
- zachowaj poprawne proporcje,
- projektuj jak producent mebli na wymiar,
- analizuj pamięć projektu,
- NIE zmieniaj całej kuchni bez potrzeby.

Jeśli klient chce poprawki:
- zmień WYŁĄCZNIE wskazane elementy,
- zachowaj resztę projektu,
- zachowaj układ kuchni,
- zachowaj wcześniejsze ustalenia,
- zachowaj styl,
- zachowaj ergonomię,
- nie projektuj nowej kuchni,
- poprawiaj istniejący projekt jak prawdziwy projektant wnętrz.

BARDZO WAŻNE:
Jeśli klient pisze po wygenerowaniu projektu:
- traktuj to jako edycję istniejącej kuchni,
- nie zaczynaj projektu od nowa,
- nanieś poprawki na aktualną wizualizację.

`,
          },

          {
            role: "user",

            content: `

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

ANALIZA POMIESZCZENIA:

${roomAnalysis}

TRYB EDYCJI:
${isEditingProject ? "TAK" : "NIE"}

ROZMOWA:

${conversation}

`,
          },
        ],

        temperature: 0.7,
      });

    const aiReply =
      project.choices[0]
        .message.content ||

      "Brak odpowiedzi AI";

    // =========================
    // IMAGE GENERATION
    // =========================

    let generatedImages:
      string[] = [];

    let floorPlan:
      string | null = null;

    try {

      const styles = [

        "minimalist luxury",

        "modern premium",

        "warm contemporary",
      ];

      for (
        const style
        of styles
      ) {

        const imagePrompt = `
        BARDZO WAŻNE:

- zachowaj istniejący projekt,
- zmieniaj tylko wskazane elementy,
- respektuj rzeczywisty układ pomieszczenia,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- projekt musi pasować do rzeczywistego rzutu,
- zachowaj układ,
- zachowaj ergonomię,
- zachowaj realizm,
- zachowaj poprawne proporcje,
- zachowaj realistyczne odległości,
- zachowaj realistyczną ergonomię,
- zachowaj logiczną zabudowę,
- nie generuj losowego układu,

- jeśli klient chce poprawki:
  - edytuj istniejący projekt,
  - nie generuj nowej kuchni,
  - zachowaj poprzedni układ,
  - zmień tylko wskazane elementy,

- realistyczna stolarka premium,
- ultra realistic,
- cinematic lighting,
- photorealistic.

Fotorealistyczna kuchnia premium.

Styl:
${style}

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

ROOM ANALYSIS:

${roomAnalysis}

TRYB EDYCJI:
${isEditingProject ? "TAK" : "NIE"}

BARDZO WAŻNE:

- zachowaj istniejący projekt,
- zmieniaj tylko wskazane elementy,
- respektuj rzeczywisty układ pomieszczenia,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- projekt musi pasować do rzeczywistego rzutu,
- zachowaj układ,
- zachowaj ergonomię,
- zachowaj realizm,
- zachowaj poprawne proporcje,
- zachowaj realistyczne odległości,
- zachowaj realistyczną ergonomię,
- zachowaj logiczną zabudowę,
- nie generuj losowego układu,
- realistyczna stolarka premium,
- ultra realistic,
- cinematic lighting,
- photorealistic.

${image ? `
KLIENT DODAŁ RZUT LUB ZDJĘCIE.

Projektuj pod rzeczywiste pomieszczenie.
` : ""}

ROZMOWA:

${conversation}

`;

        const imageResult =
          await openai.images.generate({

            model:
              "gpt-image-1",

            prompt:
              imagePrompt,

            size:
              "1024x1536",
          });

        const rawImage =
          imageResult.data?.[0]
            ?.b64_json;

        if (rawImage) {

          const finalImage =
            await addLogoToImage(
              rawImage
            );

          generatedImages.push(
            finalImage
          );
        }
      }

      // FLOORPLAN

      const floorPlanPrompt = `

Professional kitchen floorplan.

Top view.

Kitchen CAD layout.

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

ROOM ANALYSIS:

${roomAnalysis}

TRYB EDYCJI:
${isEditingProject ? "TAK" : "NIE"}

BARDZO WAŻNE:

- zachowaj ergonomię,
- zachowaj poprawny trójkąt roboczy,
- respektuj rzeczywisty układ pomieszczenia,
- respektuj okna i drzwi,
- realistyczne przejścia,
- realistyczna zabudowa,
- realistyczna wyspa,
- poprawne AGD,
- profesjonalny układ kuchni.

ROZMOWA:

${conversation}

`;

      const floor =
        await openai.images.generate({

          model:
            "gpt-image-1",

          prompt:
            floorPlanPrompt,

          size:
            "1536x1024",
        });

      const rawFloor =
        floor.data?.[0]
          ?.b64_json;

      if (rawFloor) {

        floorPlan =
          await addLogoToImage(
            rawFloor
          );
      }

    } catch (imageError) {

      console.log(
        "IMAGE ERROR:",
        imageError
      );
    }

    const estimate =
      calculateFurnitureEstimate(
        aiReply
      );

    const finalReply = `

${aiReply}

---

# SZACUNKOWA WYCENA

NETTO:
${estimate.netto} zł

BRUTTO:
${estimate.brutto} zł

AGD wyceniane osobno.

Możesz dalej:
- poprawiać projekt,
- zmieniać materiały,
- zmieniać układ,
- edytować wizualizację.

`;

    return Response.json({

      success: true,

      reply:
        finalReply,

      generatedImage:
        generatedImages[0],

      generatedImages,

      floorPlan,
    });

  } catch (err: any) {

    console.log(
      "CHAT API ERROR:",
      err
    );

    return Response.json({

      success: false,

      error:
        err?.message ||
        "Błąd AI",
    });
  }
}