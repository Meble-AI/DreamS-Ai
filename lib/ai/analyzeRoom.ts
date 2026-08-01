import OpenAI from "openai";

export type RoomAnalysisData = {
  roomAnalysis: string;

  roomData: {
    walls: unknown[];
    windows: number;
    doors: number;
    layout: string;
    estimated_size: string;
    has_island_space: boolean;
    kitchen_type: string;
    ergonomic_notes: string[];
  };
};

type AnalyzeRoomOptions = {
  openai: OpenAI;
  images?: string[];
};

const emptyRoomData: RoomAnalysisData["roomData"] = {
  walls: [],
  windows: 0,
  doors: 0,
  layout: "",
  estimated_size: "",
  has_island_space: false,
  kitchen_type: "",
  ergonomic_notes: [],
};

export async function analyzeRoom({
  openai,
  images = [],
}: AnalyzeRoomOptions): Promise<RoomAnalysisData> {

  const validImages =
    Array.isArray(images)
      ? images
          .filter(
            (image): image is string =>
              typeof image === "string" &&
              image.startsWith("data:image/")
          )
          .slice(0, 4)
      : [];

  if (!validImages.length) {

    return {
      roomAnalysis: "",
      roomData: {
        ...emptyRoomData,
      },
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

Jesteś technicznym analizatorem pomieszczeń dla Projektuj AI.

Przeanalizuj wszystkie załączone zdjęcia jako jedno pomieszczenie.

Zwróć wyłącznie poprawny JSON:

{
  "room_analysis": "",
  "layout": "",
  "estimated_size": "",
  "walls": [],
  "windows": 0,
  "doors": 0,
  "has_island_space": false,
  "kitchen_type": "",
  "ergonomic_notes": []
}

ZASADY:
- analizuj rzeczywisty układ pomieszczenia
- wykrywaj ściany, okna, drzwi i przejścia
- nie wymyślaj dokładnych wymiarów, jeżeli nie są widoczne
- oceniaj miejsce na wyspę realistycznie
- nie zasłaniaj okien i drzwi zabudową
- zwróć najbezpieczniejszy możliwy układ kuchni
- jeżeli czegoś nie da się wiarygodnie ustalić, wpisz pustą wartość
- ergonomic_notes ma zawierać krótkie techniczne uwagi
`,
          },

          {
            role:
              "user",

            content: [

              {
                type:
                  "text",

                text: `
Przeanalizuj pomieszczenie pod projekt realistycznej kuchni na wymiar.
`,
              },

              ...validImages.map(
                (image) => ({
                  type:
                    "image_url" as const,

                  image_url: {
                    url:
                      image,
                  },
                })
              ),
            ],
          },
        ],
      });

    const rawContent =
      response
        .choices?.[0]
        ?.message?.content ||
      "{}";

    const parsed =
      JSON.parse(
        rawContent
      );

    return {

      roomAnalysis:
        typeof parsed.room_analysis ===
        "string"
          ? parsed.room_analysis
          : "",

      roomData: {

        walls:
          Array.isArray(
            parsed.walls
          )
            ? parsed.walls
            : [],

        windows:
          Number.isFinite(
            Number(
              parsed.windows
            )
          )
            ? Number(
                parsed.windows
              )
            : 0,

        doors:
          Number.isFinite(
            Number(
              parsed.doors
            )
          )
            ? Number(
                parsed.doors
              )
            : 0,

        layout:
          typeof parsed.layout ===
          "string"
            ? parsed.layout
            : "",

        estimated_size:
          typeof parsed.estimated_size ===
          "string"
            ? parsed.estimated_size
            : "",

        has_island_space:
          Boolean(
            parsed.has_island_space
          ),

        kitchen_type:
          typeof parsed.kitchen_type ===
          "string"
            ? parsed.kitchen_type
            : "",

        ergonomic_notes:
          Array.isArray(
            parsed.ergonomic_notes
          )
            ? parsed.ergonomic_notes
                .filter(
                  (
                    note: unknown
                  ): note is string =>
                    typeof note ===
                    "string"
                )
            : [],
      },
    };

  } catch (error) {

    console.error(
      "ANALYZE ROOM ERROR:",
      error
    );

    return {
      roomAnalysis: "",
      roomData: {
        ...emptyRoomData,
      },
    };
  }
}