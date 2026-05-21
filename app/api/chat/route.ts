import OpenAI from "openai";
import { addLogoToImage } from "@/lib/addLogo";
import { kitchenKnowledge } from "@/lib/kitchenKnowledge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function calculateFurnitureEstimate(
  text: string
) {

  let netto = 25000;

  const lower =
    text.toLowerCase();

  if (lower.includes("premium")) {
    netto += 6000;
  }

  if (lower.includes("blum")) {
    netto += 4500;
  }

  if (lower.includes("cargo")) {
    netto += 2500;
  }

  if (lower.includes("led")) {
    netto += 1200;
  }

  if (lower.includes("spiek")) {
    netto += 9000;
  }

  if (lower.includes("wyspa")) {
    netto += 7000;
  }

  if (lower.includes("akryl")) {
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
      images = [],
      previousImages = [],
      projectMemory: incomingMemory = {},
    } = body;

    const image =
      images?.[0] || null;

    const previousImage =
      previousImages?.[0] || null;

    // ====================================
    // ROOM SCANNER
    // ====================================

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
              "gpt-4.1",

            response_format: {
              type: "json_object",
            },

            messages: [

              {
                role: "system",

                content: `

Jesteś elitarnym AI Room Scanner dla producenta mebli premium.

Przeanalizuj zdjęcie pomieszczenia i zwróć JSON.

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
- analizuj rzeczywisty układ
- wykrywaj ściany
- wykrywaj okna
- wykrywaj drzwi
- analizuj ergonomię
- wykrywaj miejsce na wyspę
- analizuj przejścia
- projektuj realistycznie

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

    // ====================================
    // HISTORY
    // ====================================

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

    // ====================================
    // EDIT MODE
    // ====================================

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

    // ====================================
    // MEMORY
    // ====================================

    const projectMemory = {

      ...incomingMemory,

      styl:

        lowerConversation.includes("minimal")
          ? "minimalistyczny"

        : lowerConversation.includes("loft")
          ? "loft"

        : lowerConversation.includes("glamour")
          ? "glamour"

        : lowerConversation.includes("nowoczes")
          ? "nowoczesny"

        : incomingMemory?.styl ||

          "premium",

      kolor_frontow:

        lowerConversation.includes("kaszmir")
          ? "kaszmir"

        : lowerConversation.includes("czarn")
          ? "czarny"

        : lowerConversation.includes("bia")
          ? "biały"

        : lowerConversation.includes("drewn")
          ? "drewno"

        : incomingMemory?.kolor_frontow ||

          "premium neutral",

      blat:

        lowerConversation.includes("spiek")
          ? "spiek"

        : lowerConversation.includes("drew")
          ? "drewniany"

        : incomingMemory?.blat ||

          "premium",

      uklad:

        roomData.layout ||

        incomingMemory?.uklad ||

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

        incomingMemory?.wyspa ||

        lowerConversation.includes(
          "wyspa"
        ),

      blum:

        incomingMemory?.blum ||

        lowerConversation.includes(
          "blum"
        ),

      led:

        incomingMemory?.led ||

        lowerConversation.includes(
          "led"
        ),

      witryny:

        incomingMemory?.witryny ||

        lowerConversation.includes(
          "witry"
        ),

      previousImage,

      room_scan:
        roomData,
    };

    // ====================================
    // GENERATE PROJECT
    // ====================================

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

    // ====================================
    // CONSULTATION
    // ====================================

    if (!generateProject) {

      const consultation =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role: "system",

              content: `

Jesteś elitarnym projektantem kuchni premium DreamS AI.

${kitchenKnowledge}

`,
            },

            {
              role: "user",

              content: `

ROOM SCAN:
${JSON.stringify(roomData, null, 2)}

ROOM ANALYSIS:
${roomAnalysis}

PAMIĘĆ:
${JSON.stringify(projectMemory, null, 2)}

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

          memory:
            projectMemory,
        });
    }

    // ====================================
    // PROJECT AI
    // ====================================

    const project =
      await openai.chat.completions.create({

        model:
          "gpt-4.1",

        messages: [

          {
            role: "system",

            content: `

Jesteś elitarnym projektantem wnętrz premium i archviz artist.

${kitchenKnowledge}

TWÓRZ:
- ultra realistic kitchens
- cinematic interior lighting
- luxury apartment atmosphere
- architectural visualization quality
- interior magazine quality
- premium realism
- realistic materials
- realistic wood textures
- realistic stone countertops
- realistic glass reflections
- realistic lighting
- luxury premium kitchen

`,
          },

          {
            role: "user",

            content: `

ROOM SCAN:
${JSON.stringify(roomData, null, 2)}

ROOM ANALYSIS:
${roomAnalysis}

PAMIĘĆ:
${JSON.stringify(projectMemory, null, 2)}

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

    // ====================================
    // GENERATE IMAGES
    // ====================================

    let generatedImages:
      string[] = [];

    let floorPlan:
      string | null = null;

    try {

      const styles =

        isEditingProject

          ? [
              "ultra realistic luxury edit"
            ]

          : [

              "luxury interior magazine",

              "ultra realistic premium kitchen",

              "cinematic architectural visualization",
            ];

      for (
        const style
        of styles
      ) {

        let imagePrompt = `

ULTRA REALISTIC PREMIUM KITCHEN.

STYLE:
${style}

ROOM SCAN:
${JSON.stringify(roomData, null, 2)}

ROOM ANALYSIS:
${roomAnalysis}

PAMIĘĆ:
${JSON.stringify(projectMemory, null, 2)}

ROZMOWA:
${conversation}

IMPORTANT:
- ultra photorealistic
- cinematic lighting
- realistic shadows
- realistic reflections
- premium luxury kitchen
- architectural visualization quality
- interior design magazine style
- luxury apartment atmosphere
- realistic proportions
- realistic ergonomics
- realistic materials
- realistic wood
- realistic stone countertop
- premium appliances
- luxury ambient light
- soft shadows
- realistic daylight
- high-end render
- octane render style
- corona render style
- extremely detailed
- luxury premium interior

`;

        if (
          isEditingProject &&
          previousImage
        ) {

          imagePrompt += `

TO JEST EDYCJA ISTNIEJĄCEGO PROJEKTU.

ZACHOWAJ:
- układ
- szafki
- wyspę
- proporcje
- ergonomię
- architekturę pomieszczenia

ZMIEŃ TYLKO:
${message}

REFERENCYJNY PROJEKT:
${previousImage}

`;
        }

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

      // ====================================
      // FLOORPLAN
      // ====================================

      if (!isEditingProject) {

        const floorPrompt = `

Professional architectural kitchen floorplan.

STYLE:
- premium CAD drawing
- realistic proportions
- professional kitchen planner
- realistic ergonomics
- modern architectural blueprint

ROOM SCAN:
${JSON.stringify(roomData, null, 2)}

ROOM ANALYSIS:
${roomAnalysis}

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

    // ====================================
    // ESTIMATE
    // ====================================

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
- poprawiać projekt
- zmieniać układ
- zmieniać materiały
- edytować wizualizację

`,

      generatedImage:
        generatedImages[0],

      generatedImages,

      floorPlan,

      roomData,

      memory:
        projectMemory,
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