import OpenAI from "openai";

import {
  kitchenKnowledge,
} from "@/lib/kitchenKnowledge";

import type {
  RoomAnalysisData,
} from "@/lib/ai/analyzeRoom";

export type KitchenModule = {
  id: string;
  category:
    | "wysoka_zabudowa"
    | "dolna"
    | "wiszaca"
    | "narozna"
    | "wyspa"
    | "dekoracyjna"
    | "agd";

  name: string;
  width_mm: number | null;
  height_mm: number | null;
  depth_mm: number | null;
  quantity: number;
  wall: string | null;
  function: string;
  notes: string;
};

export type KitchenAppliancePlan = {
  refrigerator: string;
  sink: string;
  hob: string;
  oven: string;
  dishwasher: string;
  hood: string;
};

export type KitchenMaterials = {
  style: string;
  fronts: string;
  countertop: string;
  handles: string;
  carcass: string;
  backsplash: string;
  plinth: string;
  lighting: string[];
};

export type KitchenErgonomics = {
  work_triangle: string;
  preparation_zone: string;
  washing_zone: string;
  cooking_zone: string;
  storage_zone: string;
  passages: string[];
  collisions: string[];
};

export type KitchenDesign = {
  project_name: string;
  summary: string;
  layout: string;
  layout_reason: string;
  island: {
    included: boolean;
    type: string;
    dimensions_mm: {
      width: number | null;
      depth: number | null;
      height: number | null;
    };
    function: string[];
    notes: string;
  };
  modules: KitchenModule[];
  appliances: KitchenAppliancePlan;
  materials: KitchenMaterials;
  ergonomics: KitchenErgonomics;
  technical_notes: string[];
  client_questions: string[];
  render_description: string;
};

type DesignKitchenOptions = {
  openai: OpenAI;
  room: RoomAnalysisData;
  message: string;
  conversation?: string;
  memory?: Record<string, unknown>;
  isCorrection?: boolean;
  correctionRequest?: string;
};

const fallbackDesign: KitchenDesign = {
  project_name:
    "Projekt kuchni",
  summary:
    "Nie udało się przygotować pełnego projektu. Potrzebne są dodatkowe dane dotyczące pomieszczenia.",
  layout:
    "do ustalenia",
  layout_reason:
    "Brak wystarczających danych.",
  island: {
    included:
      false,
    type:
      "brak",
    dimensions_mm: {
      width:
        null,
      depth:
        null,
      height:
        null,
    },
    function:
      [],
    notes:
      "Brak wystarczających danych do oceny.",
  },
  modules:
    [],
  appliances: {
    refrigerator:
      "do ustalenia",
    sink:
      "do ustalenia",
    hob:
      "do ustalenia",
    oven:
      "do ustalenia",
    dishwasher:
      "do ustalenia",
    hood:
      "do ustalenia",
  },
  materials: {
    style:
      "nowoczesny",
    fronts:
      "do ustalenia",
    countertop:
      "do ustalenia",
    handles:
      "do ustalenia",
    carcass:
      "do ustalenia",
    backsplash:
      "do ustalenia",
    plinth:
      "do ustalenia",
    lighting:
      [],
  },
  ergonomics: {
    work_triangle:
      "do ustalenia",
    preparation_zone:
      "do ustalenia",
    washing_zone:
      "do ustalenia",
    cooking_zone:
      "do ustalenia",
    storage_zone:
      "do ustalenia",
    passages:
      [],
    collisions:
      [],
  },
  technical_notes: [
    "Przed produkcją wymagany jest pomiar techniczny.",
  ],
  client_questions: [
    "Podaj dokładne wymiary pomieszczenia.",
  ],
  render_description:
    "Fotorealistyczna kuchnia premium możliwa do wykonania.",
};

function parseDesign(
  value: string
): KitchenDesign {

  try {

    const parsed =
      JSON.parse(
        value
      ) as Partial<KitchenDesign>;

    return {
      ...fallbackDesign,
      ...parsed,

      island: {
        ...fallbackDesign.island,
        ...(parsed.island || {}),
        dimensions_mm: {
          ...fallbackDesign.island.dimensions_mm,
          ...(parsed.island?.dimensions_mm || {}),
        },
        function:
          Array.isArray(
            parsed.island?.function
          )
            ? parsed.island!.function
            : [],
      },

      modules:
        Array.isArray(
          parsed.modules
        )
          ? parsed.modules
          : [],

      appliances: {
        ...fallbackDesign.appliances,
        ...(parsed.appliances || {}),
      },

      materials: {
        ...fallbackDesign.materials,
        ...(parsed.materials || {}),
        lighting:
          Array.isArray(
            parsed.materials?.lighting
          )
            ? parsed.materials!.lighting
            : [],
      },

      ergonomics: {
        ...fallbackDesign.ergonomics,
        ...(parsed.ergonomics || {}),
        passages:
          Array.isArray(
            parsed.ergonomics?.passages
          )
            ? parsed.ergonomics!.passages
            : [],
        collisions:
          Array.isArray(
            parsed.ergonomics?.collisions
          )
            ? parsed.ergonomics!.collisions
            : [],
      },

      technical_notes:
        Array.isArray(
          parsed.technical_notes
        )
          ? parsed.technical_notes
          : [],

      client_questions:
        Array.isArray(
          parsed.client_questions
        )
          ? parsed.client_questions
          : [],
    };

  } catch (
    error
  ) {

    console.error(
      "DESIGN KITCHEN JSON ERROR:",
      error
    );

    return {
      ...fallbackDesign,
    };
  }
}

function buildDesignPrompt({
  room,
  message,
  conversation,
  memory,
  isCorrection,
  correctionRequest,
}: Omit<DesignKitchenOptions, "openai">) {

  return `

DANE POMIESZCZENIA:
${JSON.stringify(
  room.roomData,
  null,
  2
)}

ANALIZA POMIESZCZENIA:
${room.roomAnalysis || "Brak dodatkowej analizy."}

WIADOMOŚĆ KLIENTA:
${message || "Brak wiadomości."}

HISTORIA ROZMOWY:
${conversation || "Brak historii."}

PAMIĘĆ PROJEKTU:
${JSON.stringify(
  memory || {},
  null,
  2
)}

TRYB POPRAWKI:
${isCorrection ? "TAK" : "NIE"}

UWAGA DO POPRAWKI:
${correctionRequest || "BRAK"}

ZADANIE:
Przygotuj realistyczny projekt kuchni na wymiar.

Jeżeli TRYB POPRAWKI = TAK:
- nie projektuj od początku,
- zachowaj układ i wszystkie elementy niewskazane przez klienta,
- zmodyfikuj tylko elementy z UWAGI DO POPRAWKI,
- zachowaj spójność z pamięcią projektu,
- nie zmieniaj AGD bez wyraźnej prośby,
- nie zmieniaj wyspy, okien, drzwi, ścian ani przejść bez wyraźnej prośby.

Zwróć wyłącznie JSON zgodny ze schematem:

{
  "project_name": "",
  "summary": "",
  "layout": "",
  "layout_reason": "",
  "island": {
    "included": false,
    "type": "",
    "dimensions_mm": {
      "width": null,
      "depth": null,
      "height": null
    },
    "function": [],
    "notes": ""
  },
  "modules": [
    {
      "id": "M1",
      "category": "dolna",
      "name": "",
      "width_mm": 600,
      "height_mm": 720,
      "depth_mm": 560,
      "quantity": 1,
      "wall": "A",
      "function": "",
      "notes": ""
    }
  ],
  "appliances": {
    "refrigerator": "",
    "sink": "",
    "hob": "",
    "oven": "",
    "dishwasher": "",
    "hood": ""
  },
  "materials": {
    "style": "",
    "fronts": "",
    "countertop": "",
    "handles": "",
    "carcass": "",
    "backsplash": "",
    "plinth": "",
    "lighting": []
  },
  "ergonomics": {
    "work_triangle": "",
    "preparation_zone": "",
    "washing_zone": "",
    "cooking_zone": "",
    "storage_zone": "",
    "passages": [],
    "collisions": []
  },
  "technical_notes": [],
  "client_questions": [],
  "render_description": ""
}

OBOWIĄZKOWA KONTROLA:
- dokładnie jedna lodówka,
- dokładnie jeden zlew,
- dokładnie jedna płyta,
- dokładnie jeden piekarnik,
- dokładnie jedna zmywarka,
- zmywarka blisko zlewu,
- lodówka na początku logicznego ciągu,
- miejsce robocze między zlewem i płytą,
- brak kolizji z drzwiami i oknami,
- wyspa tylko jeśli przejścia są realistyczne,
- moduły mają realistyczne szerokości,
- projekt ma być możliwy do wykonania przez stolarza,
- jeżeli nie znasz wymiaru, wpisz null zamiast zgadywać.

`;
}

export async function designKitchen({
  openai,
  room,
  message,
  conversation = "",
  memory = {},
  isCorrection = false,
  correctionRequest = "",
}: DesignKitchenOptions): Promise<KitchenDesign> {

  try {

    const response =
      await openai.chat.completions.create({

        model:
          "gpt-4.1",

        response_format: {
          type:
            "json_object",
        },

        messages: [

          {
            role:
              "system",

            content: `

Jesteś głównym projektantem kuchni w systemie Projektuj AI.

Projektujesz kuchnie:
- realistyczne,
- ergonomiczne,
- możliwe do wykonania przez stolarza,
- zgodne z wymiarami i układem pomieszczenia,
- zgodne z wymaganiami klienta.

KORZYSTAJ Z TEJ BAZY WIEDZY:

${kitchenKnowledge}

Nie generujesz obrazu.
Tworzysz technicznie spójny model projektu, który później zostanie sprawdzony przez walidator i przekazany do renderera.

Nie wolno:
- dublować AGD,
- pomijać lodówki,
- wymyślać pewnych wymiarów bez danych,
- blokować okien i drzwi,
- projektować wyspy bez odpowiednich przejść,
- tworzyć przypadkowych modułów,
- ignorować poprzedniej wersji podczas poprawki.

`,
          },

          {
            role:
              "user",

            content:
              buildDesignPrompt({
                room,
                message,
                conversation,
                memory,
                isCorrection,
                correctionRequest,
              }),
          },
        ],
      });

    const content =
      response
        .choices?.[0]
        ?.message?.content ||
      "{}";

    return parseDesign(
      content
    );

  } catch (
    error
  ) {

    console.error(
      "DESIGN KITCHEN ERROR:",
      error
    );

    return {
      ...fallbackDesign,
      summary:
        "Nie udało się przygotować kompletnego projektu kuchni.",
    };
  }
}