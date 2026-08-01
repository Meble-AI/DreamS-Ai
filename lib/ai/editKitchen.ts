import OpenAI from "openai";

import type {
  KitchenDesign,
} from "@/lib/ai/designKitchen";

import type {
  ProjectMemory,
} from "@/lib/ai/projectMemory";

type EditKitchenOptions = {
  openai: OpenAI;
  previousDesign: KitchenDesign;
  memory: Partial<ProjectMemory>;
  correctionRequest: string;
};

export type KitchenEditResult = {
  updatedDesign: KitchenDesign;
  changedFields: string[];
  summary: string;
};

function cloneDesign(
  design: KitchenDesign
): KitchenDesign {
  return JSON.parse(
    JSON.stringify(design)
  ) as KitchenDesign;
}

function parseResult(
  value: string,
  fallback: KitchenDesign
): KitchenEditResult {

  try {

    const parsed =
      JSON.parse(
        value
      );

    return {
      updatedDesign:
        parsed.updatedDesign ||
        fallback,

      changedFields:
        Array.isArray(
          parsed.changedFields
        )
          ? parsed.changedFields
          : [],

      summary:
        typeof parsed.summary ===
        "string"
          ? parsed.summary
          : "Wprowadzono poprawkę do projektu.",
    };

  } catch (
    error
  ) {

    console.error(
      "EDIT KITCHEN JSON ERROR:",
      error
    );

    return {
      updatedDesign:
        fallback,

      changedFields:
        [],

      summary:
        "Nie udało się bezpiecznie zinterpretować poprawki.",
    };
  }
}

export async function editKitchen({
  openai,
  previousDesign,
  memory,
  correctionRequest,
}: EditKitchenOptions): Promise<KitchenEditResult> {

  const fallback =
    cloneDesign(
      previousDesign
    );

  const correction =
    correctionRequest
      .replace(/\s+/g, " ")
      .trim();

  if (!correction) {

    return {
      updatedDesign:
        fallback,

      changedFields:
        [],

      summary:
        "Brak treści poprawki.",
    };
  }

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

Jesteś modułem edycji projektu kuchni w systemie Projektuj AI.

Twoim zadaniem jest zmienić wyłącznie elementy wskazane przez klienta.

ZASADY BEZWZGLĘDNE:
- zachowaj cały poprzedni projekt,
- nie twórz nowej koncepcji,
- nie zmieniaj układu, jeśli klient o to nie prosi,
- nie zmieniaj rozmieszczenia AGD, jeśli klient o to nie prosi,
- nie zmieniaj modułów, jeśli klient o to nie prosi,
- nie zmieniaj materiałów, jeśli klient o to nie prosi,
- nie zmieniaj wyspy, jeśli klient o to nie prosi,
- nie dodawaj nowych elementów z własnej inicjatywy,
- nie usuwaj elementów z własnej inicjatywy,
- nie dubluj lodówki, zlewu, płyty, piekarnika ani zmywarki,
- zachowaj realizm i wykonalność stolarską.

Zwróć wyłącznie JSON:

{
  "updatedDesign": {},
  "changedFields": [],
  "summary": ""
}

Pole updatedDesign musi zawierać kompletny projekt po poprawce, nie tylko fragment.

`,
          },

          {
            role:
              "user",

            content: `

POPRZEDNI PROJEKT:
${JSON.stringify(
  previousDesign,
  null,
  2
)}

PAMIĘĆ PROJEKTU:
${JSON.stringify(
  memory,
  null,
  2
)}

UWAGA KLIENTA:
${correction}

Wprowadź tylko tę zmianę.
Zachowaj wszystkie pozostałe elementy bez zmian.

`,
          },
        ],
      });

    const content =
      response
        .choices?.[0]
        ?.message?.content ||
      "{}";

    return parseResult(
      content,
      fallback
    );

  } catch (
    error
  ) {

    console.error(
      "EDIT KITCHEN ERROR:",
      error
    );

    return {
      updatedDesign:
        fallback,

      changedFields:
        [],

      summary:
        "Nie udało się wprowadzić poprawki.",
    };
  }
}