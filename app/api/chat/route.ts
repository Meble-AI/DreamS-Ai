export const runtime = "nodejs";
export const maxDuration = 60;

import OpenAI from "openai";

import {
  addLogoToImage,
} from "@/lib/addLogo";

import {
  kitchenKnowledge,
} from "@/lib/kitchenKnowledge";

import {
  analyzeRoom,
} from "@/lib/ai/analyzeRoom";

import {
  designKitchen,
} from "@/lib/ai/designKitchen";

import type {
  KitchenDesign,
} from "@/lib/ai/designKitchen";

import {
  editKitchen,
} from "@/lib/ai/editKitchen";

import {
  validateKitchen,
} from "@/lib/ai/validateKitchen";

import {
  createProjectMemory,
  sanitizeProjectMemory,
} from "@/lib/ai/projectMemory";

import type {
  ProjectMemory,
} from "@/lib/ai/projectMemory";

import {
  renderKitchen,
} from "@/lib/ai/renderKitchen";

import {
  furniturePlanner,
} from "@/lib/ai/furniturePlanner";

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });

type HistoryItem = {
  user?: string;
  ai?: string;
};

type ChatRequestBody = {
  message?: string;
  history?: HistoryItem[];
  images?: string[];
  previousImages?: string[];
  projectMemory?: unknown;
  isCorrection?: boolean;
  correctionRequest?: string;
};

function compactText(
  value: string,
  limit = 8000
): string {

  if (!value) {
    return "";
  }

  return value.length > limit
    ? value.slice(-limit)
    : value;
}

function normalizeMessage(
  value: unknown
): string {

  return String(
    value || ""
  )
    .replace(/\s+/g, " ")
    .trim();
}

function buildConversation(
  history: HistoryItem[],
  message: string
): string {

  const limitedHistory =
    Array.isArray(history)
      ? history.slice(-5)
      : [];

  return [
    ...limitedHistory.map(
      (item) => `

KLIENT:
${compactText(
  String(item.user || ""),
  2500
)}

PROJEKTUJ AI:
${compactText(
  String(item.ai || ""),
  3500
)}
`
    ),

    `
KLIENT:
${message}
`,
  ].join("\n");
}

function detectCorrection(
  message: string,
  explicitCorrection: boolean,
  previousImage: string | null
): boolean {

  if (!previousImage) {
    return false;
  }

  if (explicitCorrection) {
    return true;
  }

  const lower =
    message.toLowerCase();

  return [
    "zmień",
    "popraw",
    "dodaj",
    "usuń",
    "powiększ",
    "pomniejsz",
    "przesuń",
    "zamień",
    "edytuj",
    "zostaw wszystko",
    "tylko",
  ].some(
    (phrase) =>
      lower.includes(phrase)
  );
}

function shouldGenerateProject(
  message: string,
  isCorrection: boolean,
  images: string[]
): boolean {

  if (isCorrection) {
    return true;
  }

  if (images.length > 0) {
    return true;
  }

  const lower =
    message.toLowerCase();

  return [
    "projekt",
    "wizualiz",
    "wygeneruj",
    "zaprojektuj",
    "stwórz kuchnię",
    "stworz kuchnie",
    "render",
    "pokaż kuchnię",
    "pokaz kuchnie",
  ].some(
    (phrase) =>
      lower.includes(phrase)
  );
}

function memoryToDesign(
  memory: Partial<ProjectMemory>
): KitchenDesign | null {

  if (
    !memory ||
    !memory.modules ||
    !memory.appliances ||
    !memory.materials ||
    !memory.ergonomics ||
    !memory.island
  ) {
    return null;
  }

  return {
    project_name:
      memory.project_name ||
      "Projekt kuchni",

    summary:
      memory.project_summary ||
      "",

    layout:
      memory.layout ||
      "do ustalenia",

    layout_reason:
      memory.layout_reason ||
      "",

    island:
      memory.island,

    modules:
      memory.modules,

    appliances:
      memory.appliances,

    materials:
      memory.materials,

    ergonomics:
      memory.ergonomics,

    technical_notes:
      memory.technical_notes ||
      [],

    client_questions:
      [],

    render_description:
      memory.render_description ||
      "",
  };
}

function calculateFurnitureEstimate(
  design: KitchenDesign
) {

  let netto =
    21000;

  const text =
    JSON.stringify(
      design
    ).toLowerCase();

  const moduleQuantity =
    (
      design.modules || []
    ).reduce(
      (
        total,
        module
      ) =>
        total +
        Number(
          module.quantity || 1
        ),
      0
    );

  netto +=
    moduleQuantity * 650;

  if (
    text.includes("premium")
  ) {
    netto += 4500;
  }

  if (
    text.includes("blum")
  ) {
    netto += 4500;
  }

  if (
    text.includes("cargo")
  ) {
    netto += 2500;
  }

  if (
    text.includes("led")
  ) {
    netto += 1200;
  }

  if (
    text.includes("spiek")
  ) {
    netto += 9000;
  }

  if (
    design.island?.included
  ) {
    netto += 7000;
  }

  if (
    text.includes("akryl")
  ) {
    netto += 3500;
  }

  const brutto =
    Math.round(
      netto * 1.08
    );

  return {
    netto:
      Math.round(netto),

    brutto,
  };
}

function createLegacyMemoryAliases(
  memory: ProjectMemory
) {

  return {
    ...memory,

    styl:
      memory.materials?.style ||
      "",

    kolor_frontow:
      memory.materials?.fronts ||
      "",

    blat:
      memory.materials?.countertop ||
      "",

    uklad:
      memory.layout ||
      "",

    wyspa:
      Boolean(
        memory.island?.included
      ),

    led:
      Boolean(
        memory.materials?.lighting
          ?.length
      ),

    witryny:
      memory.modules?.some(
        (module) =>
          module.name
            ?.toLowerCase()
            .includes("witryn")
      ) || false,

    room_scan:
      memory.room,
  };
}

function createProjectReply(
  design: KitchenDesign,
  versionNumber: number,
  estimate: {
    netto: number;
    brutto: number;
  },
  isCorrection: boolean,
  correctionRequest: string
): string {

  const correctionIntro =
    isCorrection
      ? `
Wprowadzono poprawkę:
${correctionRequest}

Zachowano wszystkie elementy, których poprawka nie dotyczy.
`
      : `
Przygotowałem projekt kuchni na podstawie podanych informacji i analizy pomieszczenia.
`;

  const questions =
    design.client_questions
      ?.length
      ? `

DO POTWIERDZENIA:
${design.client_questions
  .map(
    (question) =>
      `- ${question}`
  )
  .join("\n")}
`
      : "";

  return `
${correctionIntro}

WERSJA PROJEKTU:
v${versionNumber}

UKŁAD:
${design.layout}

STYL:
${design.materials.style}

FRONTY:
${design.materials.fronts}

BLAT:
${design.materials.countertop}

WYSPA:
${design.island.included ? "TAK" : "NIE"}

OPIS:
${design.summary}

SZACUNKOWA WYCENA:
NETTO: ${estimate.netto} zł
BRUTTO: ${estimate.brutto} zł

AGD wyceniane osobno.
Wycena jest orientacyjna i wymaga pomiaru oraz dokładnej specyfikacji.
${questions}

Możesz teraz opisać kolejną poprawkę.
`.trim();
}

async function createConsultationReply({
  conversation,
  roomAnalysis,
  roomData,
  memory,
}: {
  conversation: string;
  roomAnalysis: string;
  roomData: unknown;
  memory: unknown;
}) {

  const response =
    await openai.chat.completions.create({

      model:
        "gpt-4.1",

      messages: [
        {
          role:
            "system",

          content: `
Jesteś projektantem kuchni Projektuj AI.

Rozmawiaj z klientem konkretnie i po polsku.
Zadawaj najwyżej 1–3 najważniejsze pytania naraz.
Nie generuj jeszcze wizualizacji, dopóki klient nie poprosi o projekt lub nie prześle zdjęcia.

Korzystaj z bazy wiedzy:

${kitchenKnowledge}
`,
        },

        {
          role:
            "user",

          content: `
ANALIZA POMIESZCZENIA:
${roomAnalysis || "Brak zdjęcia."}

DANE POMIESZCZENIA:
${JSON.stringify(
  roomData,
  null,
  2
)}

PAMIĘĆ PROJEKTU:
${JSON.stringify(
  memory,
  null,
  2
)}

ROZMOWA:
${conversation}
`,
        },
      ],
    });

  return (
    response
      .choices?.[0]
      ?.message?.content ||
    "Opisz proszę pomieszczenie i oczekiwany styl kuchni."
  );
}

async function generateFloorPlan(
  design: KitchenDesign
): Promise<string | null> {

  try {

    const prompt = `
Profesjonalny rzut 2D kuchni z góry.

PROJEKT:
${JSON.stringify(
  design,
  null,
  2
)}

ZASADY:
- czytelny rzut architektoniczny
- realistyczne proporcje
- układ szafek zgodny z projektem
- dokładnie jedna lodówka
- dokładnie jeden zlew
- dokładnie jedna płyta
- dokładnie jeden piekarnik
- dokładnie jedna zmywarka
- bez dekoracji
- jasne tło
- estetyka profesjonalnego programu do projektowania
`;

    const result =
      await openai.images.generate({
        model:
          "gpt-image-1",

        prompt,

        size:
          "1536x1024",
      });

    const rawImage =
      result.data?.[0]
        ?.b64_json;

    if (!rawImage) {
      return null;
    }

    return await addLogoToImage(
      rawImage
    );

  } catch (
    error
  ) {

    console.error(
      "FLOOR PLAN ERROR:",
      error
    );

    return null;
  }
}

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const message =
      normalizeMessage(
        body.message
      );

    if (!message) {

      return Response.json(
        {
          success:
            false,

          error:
            "Wpisz wiadomość.",
        },
        {
          status:
            400,
        }
      );
    }

    const history =
      Array.isArray(
        body.history
      )
        ? body.history
        : [];

    const images =
      Array.isArray(
        body.images
      )
        ? body.images.filter(
            (
              image
            ): image is string =>
              typeof image ===
                "string" &&
              image.startsWith(
                "data:image/"
              )
          )
        : [];

    const previousImages =
      Array.isArray(
        body.previousImages
      )
        ? body.previousImages.filter(
            (
              image
            ): image is string =>
              typeof image ===
                "string" &&
              image.length > 0
          )
        : [];

    const previousImage =
      previousImages.at(-1) ||
      null;

    const incomingMemory =
      sanitizeProjectMemory(
        body.projectMemory
      );

    const correctionRequest =
      normalizeMessage(
        body.correctionRequest ||
        message
      );

    const isCorrection =
      detectCorrection(
        message,
        body.isCorrection === true,
        previousImage
      );

    const conversation =
      buildConversation(
        history,
        message
      );

    // 1. ANALIZA POMIESZCZENIA

    const room =
      images.length > 0
        ? await analyzeRoom({
            openai,
            images,
          })
        : {
            roomAnalysis:
              incomingMemory
                ?.room
                ?.analysis ||
              "",

            roomData: {
              walls:
                incomingMemory
                  ?.room
                  ?.walls ||
                [],

              windows:
                incomingMemory
                  ?.room
                  ?.windows ||
                0,

              doors:
                incomingMemory
                  ?.room
                  ?.doors ||
                0,

              layout:
                incomingMemory
                  ?.room
                  ?.layout ||
                "",

              estimated_size:
                incomingMemory
                  ?.room
                  ?.estimated_size ||
                "",

              has_island_space:
                incomingMemory
                  ?.room
                  ?.has_island_space ||
                false,

              kitchen_type:
                incomingMemory
                  ?.room
                  ?.kitchen_type ||
                "",

              ergonomic_notes:
                incomingMemory
                  ?.room
                  ?.ergonomic_notes ||
                [],
            },
          };

    const generateProject =
      shouldGenerateProject(
        message,
        isCorrection,
        images
      );

    // 2. KONSULTACJA

    if (!generateProject) {

      const reply =
        await createConsultationReply({
          conversation,
          roomAnalysis:
            room.roomAnalysis,
          roomData:
            room.roomData,
          memory:
            incomingMemory,
        });

      return Response.json({
        success:
          true,

        reply,

        generatedImage:
          null,

        generatedImages:
          [],

        floorPlan:
          null,

        roomData:
          room.roomData,

        memory:
          incomingMemory,
      });
    }

    // 3. PROJEKT LUB POPRAWKA

    let design:
      KitchenDesign;

    const previousDesign =
      memoryToDesign(
        incomingMemory
      );

    if (
      isCorrection &&
      previousDesign
    ) {

      const edited =
        await editKitchen({
          openai,

          previousDesign,

          memory:
            incomingMemory,

          correctionRequest,
        });

      design =
        edited.updatedDesign;

    } else {

      design =
        await designKitchen({
          openai,

          room,

          message,

          conversation,

          memory:
            incomingMemory as Record<
              string,
              unknown
            >,

          isCorrection:
            false,

          correctionRequest:
            "",
        });
    }

    // 4. WALIDACJA

    const validation =
      await validateKitchen({
        design,

        openai,

        useAiReview:
          true,
      });

    const correctedDesign =
      validation.correctedDesign;

    // 5. PLAN ROZMIESZCZENIA MEBLI

    const furniturePlan =
      furniturePlanner({
        design:
          correctedDesign,

        room,
      });

    // 6. PAMIĘĆ PROJEKTU

    const memory =
      createProjectMemory({
        design:
          correctedDesign,

        roomAnalysis:
          room.roomAnalysis,

        roomData:
          room.roomData,

        previousMemory:
          incomingMemory,

        correctionRequest,

        isCorrection,
      });

    const responseMemory =
      createLegacyMemoryAliases(
        memory
      );

    // 6. RENDER

    const render =
      await renderKitchen({
        openai,

        design:
          correctedDesign,

        validation,

        memory,

        previousImage,

        isCorrection,

        correctionRequest,

        imageCount:
          isCorrection
            ? 1
            : 3,

        addLogo:
          true,
      });

    if (
      !render.generatedImage
    ) {

      return Response.json(
        {
          success:
            false,

          error:
            "Nie udało się wygenerować wizualizacji. Spróbuj ponownie.",
        },
        {
          status:
            500,
        }
      );
    }

    // 7. RZUT 2D

    const floorPlan =
      isCorrection
        ? null
        : await generateFloorPlan(
            correctedDesign
          );

    // 8. WYCENA I ODPOWIEDŹ

    const estimate =
      calculateFurnitureEstimate(
        correctedDesign
      );

    const reply =
      createProjectReply(
        correctedDesign,
        memory.version_number,
        estimate,
        isCorrection,
        correctionRequest
      );

    return Response.json({
      success:
        true,

      reply,

      generatedImage:
        render.generatedImage,

      generatedImages:
        render.generatedImages,

      floorPlan,

      roomData:
        room.roomData,

      design:
        correctedDesign,

      validation,

      furniturePlan,

      estimate,

      versionNumber:
        memory.version_number,

      changeHistory:
        memory.change_history,

      memory:
        responseMemory,
    });

  } catch (
    error: unknown
  ) {

    console.error(
      "CHAT API ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Błąd AI";

    return Response.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          500,
      }
    );
  }
}