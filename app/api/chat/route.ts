import OpenAI from "openai";
import { addLogoToImage } from "@/lib/addLogo";
import { kitchenKnowledge }
from "@/lib/kitchenKnowledge";

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
      image,
    } = body;

    // =========================
    // ROOM SCANNER AI
    // =========================

    let roomAnalysis = "";

    let roomData = {

      walls: [],
      windows: 0,
      doors: 0,
      layout: "",
      estimated_size: "",
      has_island_space: false,
      kitchen_type: "",
      ergonomic_notes: [],
    };

    if (image) {

      try {

        const vision =
          await openai.chat.completions.create({

            model:
              "gpt-4.1-mini",

            response_format: {
              type: "json_object",
            },

            messages: [

              {
                role: "system",

                content: `

Jesteś AI Room Scanner dla producenta mebli premium.

Przeanalizuj przesłane pomieszczenie.

Zwróć JSON:

{
  "room_analysis": "",
  "layout": "",
  "estimated_size": "",
  "walls": [],
  "windows": 0,
  "doors": 0,
  "has_island_space": true,
  "kitchen_type": "",
  "ergonomic_notes": []
}

BARDZO WAŻNE:
- analizuj rzeczywisty układ,
- wykrywaj ściany,
- wykrywaj okna,
- wykrywaj drzwi,
- wykrywaj możliwości zabudowy,
- analizuj ergonomię,
- analizuj przejścia,
- analizuj miejsce na wyspę,
- analizuj potencjalny układ kuchni.

`,
              },

              {
                role: "user",

                content: [

                  {
                    type: "text",

                    text: `
Przeskanuj pomieszczenie pod projekt kuchni premium.
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

        const parsed =
          JSON.parse(

            vision
              .choices[0]
              .message.content || "{}"
          );

        roomAnalysis =
          parsed.room_analysis || "";

        roomData = {

          walls:
            parsed.walls || [],

          windows:
            parsed.windows || 0,

          doors:
            parsed.doors || 0,

          layout:
            parsed.layout || "",

          estimated_size:
            parsed.estimated_size || "",

          has_island_space:
            parsed.has_island_space || false,

          kitchen_type:
            parsed.kitchen_type || "",

          ergonomic_notes:
            parsed.ergonomic_notes || [],
        };

      } catch (visionError) {

        console.log(
          "ROOM SCANNER ERROR:",
          visionError
        );
      }
    }

    // =========================
    // HISTORY
    // =========================

    const limitedHistory =
      history.slice(-8);

    const conversation = [

      ...limitedHistory.map(
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
    // EDIT MODE
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

lowerConversation.includes("zmień")

||

lowerConversation.includes("dodaj")

||

lowerConversation.includes("usuń")

||

lowerConversation.includes("powiększ")

||

lowerConversation.includes("pomniejsz")

      ||

      lowerConversation.includes("zostaw resztę")

      ||

      lowerConversation.includes("tylko");

    // =========================
    // MEMORY
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

        : "premium",

      uklad:

        roomData.layout ||

        (

          lowerConversation.includes("wyspa")
            ? "L + wyspa"

          : lowerConversation.includes("układ l")
            ? "L"

          : lowerConversation.includes("układ u")
            ? "U"

          : "premium"
        ),

      wyspa:

        roomData.has_island_space ||

        lowerConversation.includes(
          "wyspa"
        ),

      blum:
        lowerConversation.includes(
          "blum"
        ),

      led:
        lowerConversation.includes(
          "led"
        ),

      witryny:
        lowerConversation.includes(
          "witry"
        ),

      room_scan:
        roomData,
    };

    // =========================
    // PROJECT MODE
    // =========================

    const generateProject =

      lowerConversation.includes(
        "projekt"
      )

      ||

      lowerConversation.includes(
        "wizualizacja"
      )

      ||

      lowerConversation.includes(
        "popraw"
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

ZNASZ SŁOWNIK PRODUCENTA:

${kitchenKnowledge}

BARDZO WAŻNE:
- analizuj room scanner,
- analizuj układ pomieszczenia,
- analizuj ergonomię,
- nie pytaj drugi raz o to samo,
- prowadź klienta jak profesjonalne studio projektowe.

`,
            },

            {
              role: "user",

              content: `

ROOM SCAN:

${JSON.stringify(
  roomData,
  null,
  2
)}

ROOM ANALYSIS:

${roomAnalysis}

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

ROZMOWA:

${conversation}

`,
            },
          ],
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

        roomData,
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

ZNASZ SŁOWNIK PRODUCENTA:

${kitchenKnowledge}

BARDZO WAŻNE:
- analizuj room scanner,
- respektuj rzeczywisty układ,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- projektuj realistycznie,
- zachowaj ergonomię,
- zachowaj poprawne przejścia,
- zachowaj poprawne proporcje,
- projektuj jak profesjonalny stolarz premium.
Jeśli projekt już istnieje:
- NIE twórz nowej kuchni,
- NIE resetuj projektu,
- traktuj rozmowę jako edycję,
- zachowaj wcześniejsze ustalenia,
- zachowaj wcześniejszy układ,
- poprawiaj istniejący projekt.

Jeśli klient chce poprawki:
- zmieniaj tylko wskazane elementy,
- zachowaj resztę projektu,
- nie generuj nowej kuchni.

`,
          },

          {
            role: "user",

            content: `

ROOM SCAN:

${JSON.stringify(
  roomData,
  null,
  2
)}

ROOM ANALYSIS:

${roomAnalysis}

PAMIĘĆ:

${JSON.stringify(
  projectMemory,
  null,
  2
)}

TRYB EDYCJI:
${isEditingProject ? "TAK" : "NIE"}

ROZMOWA:

${conversation}

`,
          },
        ],
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

      const styles =

        isEditingProject

          ? [
              "updated premium"
            ]

          : [

              "minimalist luxury",

              "modern premium",

              "warm contemporary",
            ];

      for (
        const style
        of styles
      ) {

        const imagePrompt = `

ULTRA REALISTIC PREMIUM KITCHEN.

STYLE:
${style}

ROOM SCAN:
${JSON.stringify(
  roomData,
  null,
  2
)}

ROOM ANALYSIS:
${roomAnalysis}

PAMIĘĆ:
${JSON.stringify(
  projectMemory,
  null,
  2
)}

BARDZO WAŻNE:

- respektuj rzeczywisty układ pomieszczenia,
- respektuj ściany,
- respektuj okna,
- respektuj drzwi,
- respektuj przejścia,
- respektuj miejsce na wyspę,
- realistyczna ergonomia,
- realistyczna zabudowa,
- realistyczne odległości,
- realistyczne głębokości szafek,
- profesjonalna kuchnia premium,
- możliwa do wykonania przez stolarza,
- ultra realistic,
- photorealistic,
- cinematic lighting,
- architectural visualization.

Jeśli klient chce poprawki:
- zmień tylko wskazane elementy,
- zachowaj resztę projektu.
AKTUALNY PROJEKT:

Jeśli wcześniej została wygenerowana kuchnia:
- traktuj ją jako istniejący projekt,
- zachowaj układ kuchni,
- zachowaj rozmieszczenie szafek,
- zachowaj większość projektu,
- zmień WYŁĄCZNIE elementy wskazane przez klienta,
- NIE generuj nowej kuchni,
- NIE zmieniaj całego układu,
- edytuj istniejący projekt jak profesjonalny projektant wnętrz.

PRZYKŁAD:
Jeśli klient pisze:
- "zmień blat"
to zmieniasz tylko blat.

Jeśli klient pisze:
- "dodaj witryny"
to dodajesz tylko witryny.

Jeśli klient pisze:
- "powiększ wyspę"
to zmieniasz tylko wyspę.
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

      // =========================
      // FLOORPLAN
      // =========================

      if (!isEditingProject) {

        const floorPrompt = `

Professional kitchen CAD floorplan.

ROOM SCAN:
${JSON.stringify(
  roomData,
  null,
  2
)}

ROOM ANALYSIS:
${roomAnalysis}

IMPORTANT:
- respect room dimensions,
- respect walls,
- respect windows,
- respect doors,
- realistic kitchen ergonomics,
- realistic passages,
- premium kitchen layout.

`;

        const floor =
          await openai.images.generate({

            model:
              "gpt-image-1",

            prompt:
              floorPrompt,

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

    return Response.json({

      success: true,

      reply: `

${aiReply}

---

# ROOM SCANNER AI

Wykryty układ:
${roomData.layout}

Szacowany rozmiar:
${roomData.estimated_size}

Okna:
${roomData.windows}

Drzwi:
${roomData.doors}

Możliwość wyspy:
${roomData.has_island_space ? "TAK" : "NIE"}

---

# SZACUNKOWA WYCENA

NETTO:
${estimate.netto} zł

BRUTTO:
${estimate.brutto} zł

AGD wyceniane osobno.

Możesz dalej:
- poprawiać projekt,
- zmieniać układ,
- zmieniać materiały,
- edytować wizualizację.

`,

      generatedImage:
        generatedImages[0],

      generatedImages,

      floorPlan,

      roomData,
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