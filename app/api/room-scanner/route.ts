export const maxDuration = 60;

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type RoomAnalysis = {
  room_summary: string;
  room_shape: string;
  estimated_dimensions: {
    width_cm: number | null;
    length_cm: number | null;
    height_cm: number | null;
    confidence: "niska" | "średnia" | "wysoka";
  };
  walls: Array<{
    id: string;
    description: string;
    usable_for_furniture: boolean;
    estimated_width_cm: number | null;
  }>;
  windows: Array<{
    wall_id: string;
    description: string;
    estimated_width_cm: number | null;
  }>;
  doors: Array<{
    wall_id: string;
    description: string;
    estimated_width_cm: number | null;
  }>;
  obstacles: string[];
  installations: {
    water: string;
    electricity: string;
    ventilation: string;
    gas: string;
  };
  recommended_layout: string;
  island_possible: boolean;
  island_notes: string;
  ergonomic_notes: string[];
  appliance_plan: {
    refrigerator: string;
    sink: string;
    hob: string;
    oven: string;
    dishwasher: string;
  };
  furniture_plan: Array<{
    module_name: string;
    wall_id: string;
    width_cm: number;
    height_cm: number | null;
    depth_cm: number | null;
    quantity: number;
    notes: string;
  }>;
  style: {
    name: string;
    fronts: string;
    worktop: string;
    handles: string;
    lighting: string;
  };
  warnings: string[];
};

const kitchenRules = `
KRYTYCZNE ZASADY PROJEKTU KUCHNI:

1. Nie wolno dublować elementów kuchni.
2. W projekcie może być maksymalnie jeden zlew, chyba że użytkownik wyraźnie poprosi o dwa.
3. W projekcie może być maksymalnie jedna lodówka.
4. W projekcie może być maksymalnie jedna płyta grzewcza.
5. Nie wolno dublować piekarnika, zmywarki ani innego AGD.
6. Kuchnia musi zawierać lodówkę.
7. Kuchnia powinna zawierać logiczny zestaw AGD:
   - lodówkę,
   - zlew,
   - płytę grzewczą,
   - piekarnik,
   - zmywarkę.
8. Jeżeli miejsce jest ograniczone, uprość zabudowę zamiast pomijać lodówkę.
9. Układ musi być realistyczny i możliwy do wykonania przez stolarza.
10. Zachowaj ergonomię i logiczny trójkąt roboczy: lodówka – zlew – płyta.
11. Nie blokuj okien, drzwi, przejść ani otwierania frontów.
12. Nie ustawiaj płyty grzewczej bezpośrednio przy wysokiej zabudowie, jeżeli można tego uniknąć.
13. Zmywarka powinna znajdować się blisko zlewu.
14. Piekarnik powinien być w logicznym miejscu: pod płytą albo w słupku.
15. Nie podawaj wymiarów jako pewnych, jeżeli nie da się ich wiarygodnie odczytać ze zdjęć.
16. Przed zwróceniem projektu sprawdź:
   - dokładnie jeden zlew,
   - dokładnie jedna lodówka,
   - dokładnie jedna płyta,
   - brak zdublowanego AGD.
`;

function sanitizeHistory(
  history: unknown
): HistoryMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item): item is HistoryMessage =>
        Boolean(
          item &&
            typeof item === "object" &&
            ("role" in item) &&
            ("content" in item) &&
            (
              (item as HistoryMessage).role === "user" ||
              (item as HistoryMessage).role === "assistant"
            ) &&
            typeof (item as HistoryMessage).content === "string"
        )
    )
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }));
}

function safeJsonParse(
  value: string
): RoomAnalysis | null {
  try {
    return JSON.parse(value) as RoomAnalysis;
  } catch {
    return null;
  }
}

function createFallbackAnalysis(): RoomAnalysis {
  return {
    room_summary:
      "Nie udało się utworzyć pełnej analizy strukturalnej pomieszczenia.",
    room_shape: "nieokreślony",
    estimated_dimensions: {
      width_cm: null,
      length_cm: null,
      height_cm: null,
      confidence: "niska",
    },
    walls: [],
    windows: [],
    doors: [],
    obstacles: [],
    installations: {
      water: "nieustalone",
      electricity: "nieustalone",
      ventilation: "nieustalone",
      gas: "nieustalone",
    },
    recommended_layout: "do dalszej konsultacji",
    island_possible: false,
    island_notes:
      "Brak wystarczających danych do bezpiecznej oceny miejsca na wyspę.",
    ergonomic_notes: [],
    appliance_plan: {
      refrigerator: "do ustalenia",
      sink: "do ustalenia",
      hob: "do ustalenia",
      oven: "do ustalenia",
      dishwasher: "do ustalenia",
    },
    furniture_plan: [],
    style: {
      name: "nowoczesny premium",
      fronts: "do ustalenia",
      worktop: "do ustalenia",
      handles: "do ustalenia",
      lighting: "do ustalenia",
    },
    warnings: [
      "Do wykonania projektu technicznego potrzebne są dokładne pomiary.",
    ],
  };
}

function createReadableAnalysis(
  analysis: RoomAnalysis,
  designerReply: string
): string {
  const dimensions =
    analysis.estimated_dimensions.width_cm &&
    analysis.estimated_dimensions.length_cm
      ? `${analysis.estimated_dimensions.width_cm} × ${analysis.estimated_dimensions.length_cm} cm`
      : "nieustalone na podstawie samych zdjęć";

  const furnitureModules =
    analysis.furniture_plan.length > 0
      ? analysis.furniture_plan
          .map(
            (module) =>
              `- ${module.module_name}: ${module.quantity} szt., szer. ${module.width_cm} cm, ściana ${module.wall_id}${module.notes ? ` — ${module.notes}` : ""}`
          )
          .join("\n")
      : "- Brak wystarczających danych do wiarygodnego rozpisania modułów.";

  return `
# ANALIZA POMIESZCZENIA

${analysis.room_summary}

Kształt pomieszczenia:
${analysis.room_shape}

Szacowane wymiary:
${dimensions}

Pewność oszacowania:
${analysis.estimated_dimensions.confidence}

Rekomendowany układ:
${analysis.recommended_layout}

Możliwość zastosowania wyspy:
${analysis.island_possible ? "TAK" : "NIE"}

Uwagi dotyczące wyspy:
${analysis.island_notes}

# ROZMIESZCZENIE AGD

Lodówka:
${analysis.appliance_plan.refrigerator}

Zlew:
${analysis.appliance_plan.sink}

Płyta grzewcza:
${analysis.appliance_plan.hob}

Piekarnik:
${analysis.appliance_plan.oven}

Zmywarka:
${analysis.appliance_plan.dishwasher}

# PROPONOWANE MODUŁY

${furnitureModules}

# STYL I MATERIAŁY

Styl:
${analysis.style.name}

Fronty:
${analysis.style.fronts}

Blat:
${analysis.style.worktop}

Uchwyty:
${analysis.style.handles}

Oświetlenie:
${analysis.style.lighting}

# ODPOWIEDŹ PROJEKTANTA AI

${designerReply}

# WAŻNE

Analiza zdjęć nie zastępuje dokładnego pomiaru technicznego. Przed produkcją mebli należy zweryfikować wszystkie wymiary, instalacje i kąty ścian na miejscu.
`.trim();
}

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const {
      images = [],
      message = "",
      history = [],
    } = body;

    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Dodaj co najmniej jedno zdjęcie pomieszczenia.",
        },
        {
          status: 400,
        }
      );
    }

    const safeImages = images
      .filter(
        (image: unknown) =>
          typeof image === "string" &&
          image.startsWith("data:image/")
      )
      .slice(0, 4);

    if (safeImages.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "Przesłane pliki nie są prawidłowymi obrazami.",
        },
        {
          status: 400,
        }
      );
    }

    const safeHistory =
      sanitizeHistory(history);

    const userInstruction =
      typeof message === "string"
        ? message.slice(0, 4000).trim()
        : "";

    // =========================
    // 1. STRUKTURALNA ANALIZA POMIESZCZENIA
    // =========================

    const analysisResponse =
      await openai.chat.completions.create({
        model: "gpt-4.1",

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",

            content: `
Jesteś technicznym projektantem kuchni na wymiar i specjalistą od analizy pomieszczeń.

${kitchenRules}

Przeanalizuj wszystkie zdjęcia jako przedstawiające jedno pomieszczenie.

Zwróć wyłącznie poprawny JSON o strukturze:

{
  "room_summary": "",
  "room_shape": "",
  "estimated_dimensions": {
    "width_cm": null,
    "length_cm": null,
    "height_cm": null,
    "confidence": "niska"
  },
  "walls": [
    {
      "id": "A",
      "description": "",
      "usable_for_furniture": true,
      "estimated_width_cm": null
    }
  ],
  "windows": [
    {
      "wall_id": "A",
      "description": "",
      "estimated_width_cm": null
    }
  ],
  "doors": [
    {
      "wall_id": "B",
      "description": "",
      "estimated_width_cm": null
    }
  ],
  "obstacles": [],
  "installations": {
    "water": "",
    "electricity": "",
    "ventilation": "",
    "gas": ""
  },
  "recommended_layout": "",
  "island_possible": false,
  "island_notes": "",
  "ergonomic_notes": [],
  "appliance_plan": {
    "refrigerator": "",
    "sink": "",
    "hob": "",
    "oven": "",
    "dishwasher": ""
  },
  "furniture_plan": [
    {
      "module_name": "",
      "wall_id": "A",
      "width_cm": 60,
      "height_cm": 72,
      "depth_cm": 56,
      "quantity": 1,
      "notes": ""
    }
  ],
  "style": {
    "name": "",
    "fronts": "",
    "worktop": "",
    "handles": "",
    "lighting": ""
  },
  "warnings": []
}

ZASADY ANALIZY:
- Nie wymyślaj dokładnych wymiarów, jeżeli zdjęcie ich nie pokazuje.
- W takim przypadku wpisz null i confidence = "niska".
- Oznacz ściany literami A, B, C, D.
- Plan modułów ma być wstępną propozycją, nie projektem produkcyjnym.
- Używaj typowych szerokości modułów: 20, 30, 40, 45, 50, 60, 80, 90 cm.
- Zaplanuj dokładnie jedną lodówkę, jeden zlew i jedną płytę grzewczą.
- Nie umieszczaj mebli w świetle drzwi ani okien.
- Nie pomijaj istotnych przeszkód.
`,
          },

          {
            role: "user",

            content: [
              {
                type: "text",

                text: `
Przeanalizuj pomieszczenie i przygotuj realistyczny plan kuchni na wymiar.

Dodatkowa wiadomość użytkownika:
${userInstruction || "Brak dodatkowych uwag."}
`,
              },

              ...safeImages.map(
                (image: string) => ({
                  type: "image_url" as const,

                  image_url: {
                    url: image,
                  },
                })
              ),
            ],
          },
        ],
      });

    const parsedAnalysis =
      safeJsonParse(
        analysisResponse
          .choices?.[0]
          ?.message?.content || ""
      ) ||
      createFallbackAnalysis();

    // =========================
    // 2. ODPOWIEDŹ PROJEKTANTA
    // =========================

    const designerResponse =
      await openai.chat.completions.create({
        model: "gpt-4.1",

        messages: [
          {
            role: "system",

            content: `
Jesteś projektantem wnętrz Projektuj AI.

Na podstawie strukturalnej analizy pomieszczenia oraz rozmowy z klientem:
- przedstaw najważniejsze decyzje projektowe,
- odpowiedz na dodatkową uwagę użytkownika,
- wskaż ograniczenia i rzeczy wymagające pomiaru,
- nie obiecuj dokładności wymiarowej na podstawie samych zdjęć,
- zachowaj techniczną spójność projektu.

${kitchenRules}
`,
          },

          ...safeHistory,

          {
            role: "user",

            content: `
STRUKTURALNA ANALIZA:
${JSON.stringify(
  parsedAnalysis,
  null,
  2
)}

DODATKOWA WIADOMOŚĆ:
${userInstruction || "Przygotuj profesjonalne podsumowanie projektu."}
`,
          },
        ],
      });

    const designerReply =
      designerResponse
        .choices?.[0]
        ?.message?.content ||
      "Przygotowano analizę pomieszczenia.";

    // =========================
    // 3. GENEROWANIE WIZUALIZACJI
    // =========================

    const imagePrompt = `
Wygeneruj fotorealistyczną wizualizację nowoczesnej kuchni premium na wymiar.

ANALIZA POMIESZCZENIA:
${JSON.stringify(
  parsedAnalysis,
  null,
  2
)}

UWAGI UŻYTKOWNIKA:
${userInstruction || "Brak dodatkowych uwag."}

KRYTYCZNE WYMAGANIA:
- zachowaj architekturę pomieszczenia opisaną w analizie,
- wygeneruj dokładnie jeden zlew,
- wygeneruj dokładnie jedną lodówkę,
- wygeneruj dokładnie jedną płytę grzewczą,
- nie dubluj piekarnika, zmywarki ani innego AGD,
- lodówka musi być pełnowymiarowa i widoczna lub czytelnie ukryta w zabudowie,
- zmywarka ma znajdować się blisko zlewu,
- układ musi być ergonomiczny i możliwy do wykonania,
- nie blokuj drzwi, okien ani przejść,
- proporcje szafek i AGD muszą być naturalne,
- nie dodawaj przypadkowych mebli i dekoracji,
- zastosuj realistyczne materiały, światło, cienie i odbicia,
- rezultat ma wyglądać jak profesjonalna wizualizacja architektoniczna,
- bez napisów, opisów, wymiarów ani znaków wodnych.

STYL:
- ultra photorealistic,
- premium custom kitchen,
- interior design magazine quality,
- realistic daylight,
- realistic materials,
- clean modern design,
- architectural visualization.
`;

    const imageResponse =
      await openai.images.generate({
        model: "gpt-image-1",
        size: "1536x1024",
        prompt: imagePrompt,
      });

    const generatedImage =
      imageResponse.data?.[0]?.b64_json;

    if (!generatedImage) {
      return Response.json(
        {
          success: false,
          error:
            "Nie udało się wygenerować wizualizacji.",
        },
        {
          status: 500,
        }
      );
    }

    const readableAnalysis =
      createReadableAnalysis(
        parsedAnalysis,
        designerReply
      );

    const updatedHistory:
      HistoryMessage[] = [
        ...safeHistory,

        ...(userInstruction
          ? [
              {
                role: "user" as const,
                content:
                  userInstruction,
              },
            ]
          : []),

        {
          role: "assistant" as const,
          content:
            designerReply,
        },
      ].slice(-10);

    return Response.json({
      success: true,

      analysis:
        readableAnalysis,

      structuredAnalysis:
        parsedAnalysis,

      roomData: {
        walls:
          parsedAnalysis.walls,

        windows:
          parsedAnalysis.windows,

        doors:
          parsedAnalysis.doors,

        layout:
          parsedAnalysis.recommended_layout,

        estimated_size:
          parsedAnalysis.estimated_dimensions,

        has_island_space:
          parsedAnalysis.island_possible,

        ergonomic_notes:
          parsedAnalysis.ergonomic_notes,
      },

      furniturePlan:
        parsedAnalysis.furniture_plan,

      image:
        generatedImage,

      history:
        updatedHistory,
    });
  } catch (err: any) {
    console.error(
      "ROOM SCANNER API ERROR:",
      err
    );

    return Response.json(
      {
        success: false,

        error:
          err?.message ||
          "Błąd AI Skanera pomieszczeń.",
      },
      {
        status: 500,
      }
    );
  }
}