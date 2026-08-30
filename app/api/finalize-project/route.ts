export const runtime = "nodejs";
export const maxDuration = 300;

import OpenAI, {
  toFile,
} from "openai";

import {
  addLogoToImage,
} from "@/lib/addLogo";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Brak OPENAI_API_KEY w zmiennych środowiskowych.");
  }
  return new OpenAI({ apiKey });
}

type FinalizeRequest = {
  mode?: "analyze" | "finalize";
  selectedImage?: string;
  design?: unknown;
  estimate?: unknown;
};

function normalizeBase64Image(
  value: string
) {

  const trimmed =
    value.trim();

  if (
    trimmed.startsWith(
      "data:image/"
    )
  ) {

    return trimmed;
  }

  return `data:image/png;base64,${trimmed}`;
}

function parseJson(
  text: string
) {

  const cleaned =
    text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /```$/i,
        ""
      )
      .trim();

  return JSON.parse(
    cleaned
  );
}

export async function POST(
  req: Request
) {

  try {

    const openai = getOpenAI();

    const body =
      await req.json() as
        FinalizeRequest;

    const selectedImage =
      typeof body.selectedImage ===
        "string"
        ? body.selectedImage
        : "";

    if (
      selectedImage.length >
      3_500_000
    ) {

      return Response.json(
        {
          success:
            false,

          error:
            "Wybrane zdjęcie jest zbyt duże. Odśwież stronę i spróbuj ponownie.",
        },
        {
          status:
            413,
        }
      );
    }

    if (
      !selectedImage
    ) {

      return Response.json(
        {
          success:
            false,

          error:
            "Brak wybranego zdjęcia projektu.",
        },
        {
          status:
            400,
        }
      );
    }

    const imageDataUrl =
      normalizeBase64Image(
        selectedImage
      );

    /*
     * Najpierw analizujemy wybrany render.
     * To zdjęcie jest źródłem prawdy dla
     * kolorów, materiałów i charakteru kuchni.
     */
    const analysis =
      await openai.chat.completions
        .create({
          model:
            "gpt-4.1",

          temperature:
            0.1,

          messages: [
            {
              role:
                "system",

              content: `
Jesteś technicznym projektantem kuchni na wymiar i specjalistą od materiałów meblowych.

Przeanalizuj wybrane przez klienta zdjęcie kuchni.
Nie proponuj nowej kuchni. Opisz dokładnie wybrany wariant.

SPECYFIKACJA MATERIAŁOWA:
- dla MDF lakierowanego zawsze dobierz konkretny rekomendowany kod RAL i wykończenie: mat / półmat / połysk
- RAL jest świadomym wyborem projektowym, nie pomiarem koloru ze zdjęcia
- dla płyt wybieraj producenta + kod + nazwę + strukturę WYŁĄCZNIE z bazy poniżej
- NIE WYMYŚLAJ kodów produktów
- jeśli brak wiarygodnego dopasowania: "do ustalenia"

ZWERYFIKOWANA BAZA:
EGGER:
U702 ST9 Kaszmir
H1180 ST37 Dąb Halifax Naturalny
H1181 ST37 Dąb Halifax Tabak
U999 ST7 Czarny
W1000 ST9 Biały Premium
U963 ST9 Szary Diamentowy
U968 ST9 Szary Węglowy

KRONOSPAN:
K5982 BS Mussel — ciepły beż; najbliższy RAL 1013 / NCS S 1005-Y20R
Dla innych dekorów Kronospan, których nie ma powyżej: "do ustalenia".

SWISS KRONO / KRONOPOL:
D4225 OV Dąb Artisan
D3823 OW Dąb Nowy Jork
D1041 OW Dąb Odwieczny
D20230 OV Dąb Letni
D4428 OV Dąb Naturalny
D3349 MX Dąb San Marino
D3276 MX Dąb Ancona
D2609 MX Dąb Palermo Jasny
D20110 OV Dąb Nostalgiczny
D3166 MX Dąb Rijeka Jasny
D20140 OV Dąb Liryczny

WOODECO:
PD3124 PU Dąb Naturalny
PD3082 WP Dąb Stylowy
PD3084 WP Dąb Natura
PD3054 PU Dąb Carbon
PD3092 WP Dąb Terra naturalny
PD3051 VT Dąb Grand Naturalny
PD3115 PU Dąb Sękaty
PS3141 BW Dąb Ambiente Toffi
PD3116 PU Dąb Gentelmen
PD3120 RW Dąb Surowy
PD3074 LN Dąb Noble
PD3075 WP Dąb Nostalgia

Zwróć WYŁĄCZNIE poprawny JSON:

{
  "visualDescription": "",
  "style": "",
  "frontColor": "",
  "frontMaterial": "",
  "frontFinish": "",
  "frontRal": "",
  "board": "",
  "boardManufacturer": "",
  "boardCode": "",
  "boardName": "",
  "boardTexture": "",
  "carcass": "",
  "carcassManufacturer": "",
  "carcassCode": "",
  "countertop": "",
  "countertopManufacturer": "",
  "countertopCode": "",
  "countertopName": "",
  "countertopTexture": "",
  "handles": "",
  "plinth": "",
  "backsplash": "",
  "lighting": "",
  "floor": "",
  "walls": "",
  "appliances": "",
  "island": "",
  "colorMatchNote": "Kolory i dekory są rekomendacją projektową. Przed produkcją należy potwierdzić wybór na fizycznej próbce materiału / wzorniku RAL.",
  "fixedElements": [],
  "modules": [
    {
      "order": 1,
      "wall": "A",
      "name": "",
      "description": "",
      "confidence": "high|medium|low"
    }
  ],
  "summary": ""
}

ZASADY DLA "modules":
- opisz bryły meblowe po kolei tak, jak występują na WYBRANYM zdjęciu
- zacznij od lewej strony widocznego ciągu i idź logicznie po kolejnych ścianach
- nie dopisuj niewidocznych szafek
- AGD w zabudowie może być elementem opisu bryły
- jeśli nie jesteś pewien elementu, confidence ustaw "low"

ZASADY:
- lakierowany MDF: frontMaterial="MDF lakierowany", frontRal="RAL xxxx", frontFinish="mat/półmat/połysk"
- płyta laminowana: uzupełnij boardManufacturer, boardCode, boardName, boardTexture
- board zapisuj czytelnie, np. "EGGER H1180 ST37 Dąb Halifax Naturalny"
- nie przypisuj RAL dekorom drewnianym
- nie wymyślaj odpowiedników RAL dla płyt
- jeśli czegoś nie da się określić, wpisz "do ustalenia"
- colorMatchNote zawsze pozostaw z informacją o konieczności potwierdzenia na próbce.
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
WYBRANY PROJEKT JEST ŹRÓDŁEM PRAWDY.

DANE PROJEKTU:
${JSON.stringify(
  body.design ||
    {},
  null,
  2
)}

Przygotuj dokładną specyfikację wybranego wariantu.
Nie zmieniaj koncepcji. Zdjęcie jest nadrzędnym źródłem prawdy.
`,
                },
                {
                  type:
                    "image_url",

                  image_url: {
                    url:
                      imageDataUrl,
                  },
                },
              ],
            },
          ],
        });

    const rawAnalysis =
      analysis.choices?.[0]
        ?.message?.content ||
      "{}";

    let specification:
      any = {};

    try {

      specification =
        parseJson(
          rawAnalysis
        );

    } catch {

      specification = {
        visualDescription:
          rawAnalysis,

        summary:
          rawAnalysis,
      };
    }

    const mode =
      body.mode ===
        "analyze"
        ? "analyze"
        : "finalize";

    if (
      mode ===
      "analyze"
    ) {

      return Response.json({
        success:
          true,

        specification,

        modules:
          Array.isArray(
            specification?.modules
          )
            ? specification.modules
            : [],

        summary:
          specification?.summary ||
          "Wybrany projekt kuchni.",
      });
    }

    const masterDescription = `
WYBRANY PROJEKT — NIE ZMIENIAJ KONCEPCJI:

${specification.visualDescription || ""}

STYL:
${specification.style || "do ustalenia"}

KOLOR FRONTÓW:
${specification.frontColor || "do ustalenia"}

MATERIAŁ FRONTÓW:
${specification.frontMaterial || "do ustalenia"}

WYKOŃCZENIE FRONTÓW:
${specification.frontFinish || "do ustalenia"}

RAL FRONTÓW:
${specification.frontRal || "do ustalenia"}

PŁYTA / DEKOR:
${specification.board || "do ustalenia"}

PRODUCENT / KOD / STRUKTURA:
${specification.boardManufacturer || "do ustalenia"} / ${specification.boardCode || "do ustalenia"} / ${specification.boardTexture || "do ustalenia"}

BLAT:
${specification.countertop || "do ustalenia"}

UCHWYTY / OTWIERANIE:
${specification.handles || "do ustalenia"}

COKÓŁ:
${specification.plinth || "do ustalenia"}

WYSŁONA:
${specification.backsplash || "do ustalenia"}

OŚWIETLENIE:
${specification.lighting || "do ustalenia"}

PODŁOGA:
${specification.floor || "do ustalenia"}

ŚCIANY:
${specification.walls || "do ustalenia"}

AGD:
${specification.appliances || "do ustalenia"}

WYSPA:
${specification.island || "do ustalenia"}

STAŁE ELEMENTY:
${JSON.stringify(
  specification.fixedElements ||
    [],
  null,
  2
)}

DANE TECHNICZNE:
${JSON.stringify(
  body.design ||
    {},
  null,
  2
)}
`.trim();

    const anglePrompts = [
      `
UJĘCIE DODATKOWE 1:
- zachowaj dokładnie tę samą kuchnię
- przesuń kamerę nieznacznie w lewo, około 15–25 stopni
- pokaż ten sam układ szafek, AGD, okna, blat i witryny
- nie odkrywaj ani nie wymyślaj nowej części pomieszczenia
`,
      `
UJĘCIE DODATKOWE 2:
- zachowaj dokładnie tę samą kuchnię
- przesuń kamerę nieznacznie w prawo, około 15–25 stopni
- pokaż ten sam układ szafek, AGD, okna, blat i witryny
- nie odkrywaj ani nie wymyślaj nowej części pomieszczenia
`,
      `
UJĘCIE DODATKOWE 3:
- zachowaj dokładnie tę samą kuchnię
- wykonaj nieco szerszy kadr z bardzo zbliżonego punktu widzenia
- pokaż więcej otoczenia tylko wtedy, gdy wynika ono z obrazu bazowego
- absolutnie nie zmieniaj projektu mebli
`,
    ];

    const normalizedBase64 =
      selectedImage.includes(
        ","
      )
        ? selectedImage.split(
            ","
          )[1] ||
          ""
        : selectedImage;

    const mimeType =
      selectedImage.startsWith(
        "data:image/jpeg"
      )
        ? "image/jpeg"
        : "image/png";

    const extension =
      mimeType ===
      "image/jpeg"
        ? "jpg"
        : "png";

    const selectedBuffer =
      Buffer.from(
        normalizedBase64,
        "base64"
      );

    const generated =
      await Promise.all(
        anglePrompts.map(
          async (
            anglePrompt
          ) => {

            /*
             * WAŻNE:
             * Używamy images.edit i wybranego obrazu
             * jako bezpośredniej bazy. Nie generujemy
             * dodatkowych ujęć od zera z samego promptu.
             */
            const angleFile =
              await toFile(
                selectedBuffer,
                `selected-kitchen-${Math.random().toString(36).slice(2)}.${extension}`,
                {
                  type:
                    mimeType,
                }
              );

            const result =
              await openai.images
                .edit({
                  model:
                    "gpt-image-1.5",

                  image:
                    angleFile,

                  size:
                    "1536x1024",

                  quality:
                    "high",

                  input_fidelity:
                    "high",

                  prompt: `
EDYCJA / ZMIANA KADRU ISTNIEJĄCEJ WIZUALIZACJI.

OBRAZ WEJŚCIOWY JEST ZATWIERDZONYM PROJEKTEM.
NIE WOLNO PROJEKTOWAĆ NOWEJ KUCHNI.

${masterDescription}

${anglePrompt}

ZASADY KRYTYCZNE:
- źródłem prawdy jest przesłany obraz
- zachowaj 1:1 liczbę i położenie modułów widocznych na obrazie
- zachowaj 1:1 położenie lodówki, piekarnika, płyty, zlewu i zmywarki
- zachowaj 1:1 okna, ściany, wnęki i witryny
- zachowaj kolor frontów, drewna, blatu, cokołu i uchwytów
- zachowaj oświetlenie i dekoracje zabudowy
- nie dodawaj nowych słupków, szafek, okien ani witryn
- nie usuwaj żadnego elementu projektu
- nie przenoś AGD
- nie zmieniaj kształtu kuchni
- zmień wyłącznie punkt ustawienia kamery / szerokość kadru
- jeśli nowy kąt wymagałby wymyślenia niewidocznej geometrii, wybierz mniejszą zmianę kąta zamiast wymyślać elementy
- fotorealizm architektoniczny
- bez napisów i wymiarów na obrazie
`,
                });

            const rawImage =
              result.data?.[0]
                ?.b64_json;

            if (
              !rawImage
            ) {

              return null;
            }

            return await addLogoToImage(
              rawImage
            );
          }
        )
      );

    const additionalImages =
      generated.filter(
        (
          image
        ): image is string =>
          typeof image ===
            "string" &&
          image.length > 0
      );

    /*
     * Pierwsze zdjęcie jest oryginalnie wybranym
     * wariantem klienta. Nie regenerujemy go.
     */
    const normalizedSelected =
      selectedImage.startsWith(
        "data:image/"
      )
        ? selectedImage.split(
            ","
          )[1] ||
          selectedImage
        : selectedImage;

    const finalizedImages = [
      normalizedSelected,
      ...additionalImages,
    ];

    return Response.json({
      success:
        true,

      finalizedImages,

      specification,

      modules:
        Array.isArray(
          specification?.modules
        )
          ? specification.modules
          : [],

      summary:
        specification.summary ||
        "Wybrany projekt kuchni.",
    });

  } catch (
    error: unknown
  ) {

    console.error(
      "FINALIZE PROJECT ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Błąd przygotowania projektu.";

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
