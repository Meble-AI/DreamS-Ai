export const runtime = "nodejs";
export const maxDuration = 300;

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

const PRODUCTION_APP_URL =
  "https://dreamsai.pl";

function cleanSecret(
  value:
    string |
    undefined
): string {

  return String(
    value ||
    ""
  )
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

async function proxyChatToProduction(
  req:
    Request
): Promise<Response> {

  const sourceUrl =
    new URL(
      req.url
    );

  const targetUrl =
    new URL(
      "/api/chat",
      PRODUCTION_APP_URL
    );

  targetUrl.search =
    sourceUrl.search;

  const body =
    await req.text();

  const headers =
    new Headers();

  headers.set(
    "content-type",
    req.headers.get(
      "content-type"
    ) ||
    "application/json"
  );

  headers.set(
    "accept",
    req.headers.get(
      "accept"
    ) ||
    "application/json"
  );

  /*
   * Lokalny frontend nie dostaje żadnego sekretu OpenAI.
   * Żądanie wykonuje produkcyjna funkcja Vercel,
   * która ma już OPENAI_API_KEY.
   */
  const response =
    await fetch(
      targetUrl,
      {
        method:
          "POST",

        headers,

        body,

        cache:
          "no-store",
      }
    );

  const responseHeaders =
    new Headers();

  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    contentType
  ) {

    responseHeaders.set(
      "content-type",
      contentType
    );
  }

  responseHeaders.set(
    "cache-control",
    "no-store"
  );

  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers:
        responseHeaders,
    }
  );
}

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


function enforceBasicKitchenLogic(
  inputDesign: KitchenDesign
): KitchenDesign {

  const design =
    structuredClone(
      inputDesign
    ) as KitchenDesign;

  const appliances =
    (
      design.appliances ||
      {}
    ) as any;

  if (
    !appliances.refrigerator ||
    /brak|nie dotyczy|bez lodówki|bez lodowki/i.test(
      String(
        appliances.refrigerator
      )
    )
  ) {

    appliances.refrigerator =
      "Lodówka obowiązkowa w projekcie, najlepiej w wysokiej zabudowie 600 mm.";
  }

  design.appliances =
    appliances;

  const modules =
    Array.isArray(
      design.modules
    )
      ? [...design.modules]
      : [];

  const hasRefrigeratorModule =
    modules.some(
      (
        module: any
      ) => {

        const text =
          `${module?.name || ""} ${module?.function || ""} ${module?.notes || ""}`
            .toLowerCase();

        return (
          text.includes("lodów") ||
          text.includes("lodow") ||
          text.includes("refriger")
        );
      }
    );

  if (
    !hasRefrigeratorModule
  ) {

    modules.unshift(
      {
        id:
          "required-refrigerator",

        name:
          "Słupek lodówkowy 600 mm",

        category:
          "wysoka_zabudowa",

        width_mm:
          600,

        height_mm:
          2100,

        depth_mm:
          600,

        quantity:
          1,

        wall:
          null,

        function:
          "Zabudowa lodówki — element obowiązkowy",

        notes:
          "Umieść logicznie na początku lub końcu ciągu wysokiej zabudowy. Nie stawiaj bezpośrednio przy płycie grzewczej.",
      } as any
    );
  }

  const normalizedModules =
    modules.map(
      (
        module: any
      ) => {

        const text =
          `${module?.name || ""} ${module?.category || ""} ${module?.function || ""}`
            .toLowerCase();

        const isUpper =
          text.includes("górn") ||
          text.includes("gorn") ||
          text.includes("wisząc") ||
          text.includes("wiszac") ||
          text.includes("upper");

        if (
          !isUpper
        ) {

          return module;
        }

        const isHoodCabinet =
          text.includes(
            "okap"
          );

        return {
          ...module,

          depth_mm:
            isHoodCabinet
              ? Math.min(
                  Number(
                    module?.depth_mm ||
                    350
                  ),
                  400
                )
              : 350,

          notes:
            `${module?.notes || ""} Górna szafka: standardowa głębokość 350 mm; utrzymaj wspólną linię frontów z sąsiednimi górnymi szafkami.`.trim(),
        };
      }
    );

  design.modules =
    normalizedModules as any;

  design.technical_notes =
    [
      ...(
        Array.isArray(
          design.technical_notes
        )
          ? design.technical_notes
          : []
      ),

      "OBOWIĄZKOWE AGD: dokładnie jedna lodówka, jeden zlew, jedna płyta grzewcza, jeden piekarnik i jedna zmywarka.",

      "LODÓWKA: musi być czytelnie widoczna albo jednoznacznie zabudowana w słupku 600 mm; nie może zniknąć z wizualizacji.",

      "SZAFKI GÓRNE: standardowa głębokość 350 mm. Sąsiednie szafki powinny tworzyć jedną logiczną płaszczyznę frontów.",

      "NAROŻNIK GÓRNY: nie stosuj przypadkowego uskoku głębokości. Nie zestawiaj szafki 350 mm z wiszącą bryłą 560–600 mm. Zastosuj poprawną szafkę narożną o spójnej głębokości albo zakończ ciąg blendą przed narożnikiem.",

      "W narożniku zapewnij miejsce na pełne otwieranie frontów. Jeśli trzeba, zastosuj blendę/dystans.",
    ];

  return design;
}


function calculateFurnitureEstimate(
  design: KitchenDesign
) {

  const text =
    JSON.stringify(
      design
    ).toLowerCase();

  const modules =
    design.modules || [];

  const moduleQuantity =
    modules.reduce(
      (
        total,
        module
      ) =>
        total +
        Math.max(
          1,
          Number(
            module.quantity || 1
          )
        ),
      0
    );

  /*
    Wycena orientacyjna mebli na wymiar.
    Baza jest celowo niższa niż w poprzedniej wersji.
    Nie doliczamy już wysokich, stałych kwot za samo
    wystąpienie słów takich jak "Blum", "premium" itd.
  */

  let netto =
    6500;

  // Podstawowa produkcja mebli.
  netto +=
    moduleQuantity * 720;

  // Zabudowa wysoka / słupki są droższe od zwykłych modułów.
  const tallModules =
    modules.reduce(
      (
        total,
        module
      ) => {

        const moduleText =
          JSON.stringify(
            module
          ).toLowerCase();

        const isTall =
          moduleText.includes(
            "słupek"
          ) ||
          moduleText.includes(
            "slupek"
          ) ||
          moduleText.includes(
            "wysok"
          ) ||
          moduleText.includes(
            "lodów"
          ) ||
          moduleText.includes(
            "lodow"
          );

        return total +
          (
            isTall
              ? Math.max(
                  1,
                  Number(
                    module.quantity || 1
                  )
                )
              : 0
          );
      },
      0
    );

  netto +=
    tallModules * 550;

  // Wyspa – koszt samej zabudowy, bez zawyżonej stałej 7000 zł.
  if (
    design.island?.included
  ) {
    netto +=
      2800;
  }

  // Dodatki – umiarkowane dopłaty orientacyjne.
  if (
    text.includes(
      "cargo"
    )
  ) {
    netto +=
      900;
  }

  if (
    text.includes(
      "led"
    )
  ) {
    netto +=
      600;
  }

  if (
    text.includes(
      "akryl"
    )
  ) {
    netto +=
      1400;
  }

  if (
    text.includes(
      "lakier"
    )
  ) {
    netto +=
      1800;
  }

  if (
    text.includes(
      "fornir"
    )
  ) {
    netto +=
      2200;
  }

  if (
    text.includes(
      "spiek"
    )
  ) {
    netto +=
      3500;
  }

  if (
    text.includes(
      "kamień"
    ) ||
    text.includes(
      "kamien"
    ) ||
    text.includes(
      "kwarc"
    )
  ) {
    netto +=
      3000;
  }

  /*
    Blum nie dostaje już +4500 zł tylko za nazwę.
    Przy meblach na wymiar okucia są częścią standardowej
    kalkulacji modułów. Dopłata zostaje tylko przy wyraźnie
    droższych rozwiązaniach.
  */
  if (
    text.includes(
      "servo"
    ) ||
    text.includes(
      "tip-on"
    ) ||
    text.includes(
      "tip on"
    )
  ) {
    netto +=
      1200;
  }

  /*
    Minimalna kwota zabezpiecza bardzo małe projekty.
    Zaokrąglamy do pełnych 100 zł, żeby wycena wyglądała
    jak realna wycena orientacyjna, a nie wynik kalkulatora.
  */
  netto =
    Math.max(
      netto,
      7500
    );

  netto =
    Math.round(
      netto / 100
    ) * 100;

  const brutto =
    Math.round(
      (
        netto * 1.08
      ) / 100
    ) * 100;

  return {
    netto,
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

UCHWYTY / SYSTEM OTWIERANIA:
${design.materials.handles || "do ustalenia"}

WYSŁONA NAD BLATEM:
${design.materials.backsplash || "do ustalenia"}

OŚWIETLENIE:
${
  Array.isArray(
    design.materials.lighting
  )
    ? design.materials.lighting.join(", ")
    : design.materials.lighting || "do ustalenia"
}

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
  openai,
  conversation,
  roomAnalysis,
  roomData,
  memory,
}: {
  openai: OpenAI;
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
  openai: OpenAI,
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

    const openAiApiKey =
      cleanSecret(
        process.env
          .OPENAI_API_KEY
      );

    /*
     * LOCALHOST:
     * brak lokalnego OPENAI_API_KEY -> wysyłamy żądanie
     * do działającej funkcji /api/chat na dreamsai.pl.
     *
     * VERCEL:
     * produkcja zawsze korzysta ze swojego sekretu.
     * Jeśli zniknie on z Vercel, NIE robimy pętli proxy.
     */
    if (
      !openAiApiKey
    ) {

      if (
        process.env.VERCEL ===
        "1"
      ) {

        return Response.json(
          {
            success:
              false,

            error:
              "Brak OPENAI_API_KEY w środowisku produkcyjnym Vercel.",
          },
          {
            status:
              500,
          }
        );
      }

      return await proxyChatToProduction(
        req
      );
    }

    const openai =
      new OpenAI({
        apiKey:
          openAiApiKey,
      });

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
              image: unknown
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
              image: unknown
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
          openai,
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

    /*
     * 4. PODSTAWOWA LOGIKA MEBLARSKA
     */
    design =
      enforceBasicKitchenLogic(
        design
      );

    // 5. WALIDACJA

    const validation =
      await validateKitchen({
        design,

        openai,

        /*
         * Przy poprawce obrazu użytkownik wskazuje konkretną zmianę.
         * Walidacja nie może cofać tej zmiany do poprzednich wartości.
         */
        useAiReview:
          isCorrection
            ? false
            : false,
      });

    const correctedDesign =
      isCorrection
        ? design
        : validation.correctedDesign;

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

        /*
         * Oryginalne zdjęcia klienta trafiają również
         * bezpośrednio do renderera.
         */
        roomImages:
          images,

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
      null;

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

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Błąd AI";

    const isTimeout =
      /timeout|timed out|deadline|504/i.test(
        errorMessage
      );

    return Response.json(
      {
        success:
          false,

        error:
          isTimeout
            ? "Generowanie trwało zbyt długo. Spróbuj ponownie z jednym zdjęciem i krótszym opisem."
            : errorMessage,
      },
      {
        status:
          isTimeout
            ? 504
            : 500,
      }
    );
  }
}