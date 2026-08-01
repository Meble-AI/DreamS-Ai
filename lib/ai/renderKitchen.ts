import OpenAI, {
  toFile,
} from "openai";

import {
  addLogoToImage,
} from "@/lib/addLogo";

import type {
  KitchenDesign,
} from "@/lib/ai/designKitchen";

import type {
  KitchenValidationResult,
} from "@/lib/ai/validateKitchen";

import type {
  ProjectMemory,
} from "@/lib/ai/projectMemory";

type RenderKitchenOptions = {
  openai: OpenAI;

  design:
    KitchenDesign;

  validation?:
    KitchenValidationResult |
    null;

  memory?:
    Partial<ProjectMemory> |
    null;

  previousImage?:
    string |
    null;

  isCorrection?:
    boolean;

  correctionRequest?:
    string;

  imageCount?:
    number;

  addLogo?:
    boolean;
};

export type RenderKitchenResult = {
  generatedImage:
    string |
    null;

  generatedImages:
    string[];

  prompt:
    string;

  mode:
    "generate" |
    "edit";
};

function normalizeBase64Image(
  image:
    string
): string {

  if (!image) {
    return "";
  }

  const commaIndex =
    image.indexOf(
      ","
    );

  if (
    image.startsWith(
      "data:image/"
    ) &&
    commaIndex !== -1
  ) {

    return image.slice(
      commaIndex + 1
    );
  }

  return image;
}

function cleanText(
  value:
    unknown,
  fallback = ""
): string {

  if (
    typeof value !==
    "string"
  ) {

    return fallback;
  }

  return value
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function buildModulesDescription(
  design:
    KitchenDesign
): string {

  if (
    !design.modules?.length
  ) {

    return "Brak dokładnej listy modułów. Zachowaj realistyczne standardy mebli na wymiar.";
  }

  return design.modules
    .map(
      (
        module,
        index
      ) => {

        return [
          `${index + 1}. ${module.name}`,
          `kategoria: ${module.category}`,
          `szerokość: ${module.width_mm ?? "nieustalona"} mm`,
          `wysokość: ${module.height_mm ?? "nieustalona"} mm`,
          `głębokość: ${module.depth_mm ?? "nieustalona"} mm`,
          `ilość: ${module.quantity || 1}`,
          `ściana: ${module.wall || "nieustalona"}`,
          `funkcja: ${module.function || "brak opisu"}`,
          `uwagi: ${module.notes || "brak"}`,
        ].join(
          ", "
        );
      }
    )
    .join(
      "\n"
    );
}

function buildValidationDescription(
  validation:
    KitchenValidationResult |
    null |
    undefined
): string {

  if (!validation) {

    return "Brak osobnego raportu walidacji.";
  }

  const issues =
    validation.issues
      ?.filter(
        (
          issue
        ) =>
          issue.severity ===
            "critical" ||
          issue.severity ===
            "error" ||
          issue.severity ===
            "warning"
      )
      .map(
        (
          issue,
          index
        ) =>
          `${index + 1}. [${issue.severity}] ${issue.title}: ${issue.suggestion}`
      )
      .join(
        "\n"
      );

  return `
WYNIK WALIDACJI:
${validation.score}/100

PODSUMOWANIE:
${validation.summary}

BŁĘDY I OSTRZEŻENIA DO UWZGLĘDNIENIA:
${issues || "Brak istotnych uwag."}
`.trim();
}

function buildProtectedElementsDescription(
  memory:
    Partial<ProjectMemory> |
    null |
    undefined
): string {

  const protectedElements =
    memory
      ?.protected_elements;

  if (!protectedElements) {

    return `
- układ pomieszczenia
- ściany
- okna
- drzwi
- przejścia
- perspektywa
- kąt kamery
- wszystkie elementy niewskazane przez klienta
`.trim();
  }

  const labels:
    Record<
      string,
      string
    > = {
      layout:
        "układ kuchni",
      camera:
        "kadr, perspektywa i położenie kamery",
      walls:
        "ściany",
      windows:
        "okna",
      doors:
        "drzwi",
      passages:
        "przejścia i komunikacja",
      modules:
        "rozmieszczenie modułów meblowych",
      appliances:
        "rozmieszczenie AGD",
      materials:
        "materiały i kolory",
      lighting:
        "oświetlenie",
    };

  const selected =
    Object.entries(
      protectedElements
    )
      .filter(
        (
          [
            ,
            enabled,
          ]
        ) =>
          Boolean(
            enabled
          )
      )
      .map(
        (
          [
            key,
          ]
        ) =>
          `- ${labels[key] || key}`
      );

  return selected.length
    ? selected.join(
        "\n"
      )
    : "- wszystkie elementy niewskazane przez klienta";
}

function buildGenerationPrompt({
  design,
  validation,
  memory,
}: {
  design:
    KitchenDesign;

  validation?:
    KitchenValidationResult |
    null;

  memory?:
    Partial<ProjectMemory> |
    null;
}): string {

  const modules =
    buildModulesDescription(
      design
    );

  const validationText =
    buildValidationDescription(
      validation
    );

  return `

Wygeneruj jedną fotorealistyczną wizualizację profesjonalnej kuchni na wymiar.

PROJEKT:
Nazwa:
${design.project_name}

Opis:
${design.summary}

Układ:
${design.layout}

Uzasadnienie układu:
${design.layout_reason}

OPIS DO RENDERU:
${design.render_description}

MODUŁY MEBLOWE:
${modules}

AGD:
- lodówka: ${design.appliances.refrigerator}
- zlew: ${design.appliances.sink}
- płyta grzewcza: ${design.appliances.hob}
- piekarnik: ${design.appliances.oven}
- zmywarka: ${design.appliances.dishwasher}
- okap: ${design.appliances.hood}

MATERIAŁY:
- styl: ${design.materials.style}
- fronty: ${design.materials.fronts}
- blat: ${design.materials.countertop}
- system otwierania: ${design.materials.handles}
- korpus: ${design.materials.carcass}
- wysłona: ${design.materials.backsplash}
- cokół: ${design.materials.plinth}
- oświetlenie: ${(design.materials.lighting || []).join(", ") || "realistyczne oświetlenie robocze i dekoracyjne"}

WYSPA:
- występuje: ${design.island.included ? "TAK" : "NIE"}
- typ: ${design.island.type}
- szerokość: ${design.island.dimensions_mm.width ?? "nieustalona"} mm
- głębokość: ${design.island.dimensions_mm.depth ?? "nieustalona"} mm
- wysokość: ${design.island.dimensions_mm.height ?? "nieustalona"} mm
- funkcje: ${(design.island.function || []).join(", ") || "brak"}
- uwagi: ${design.island.notes}

ERGONOMIA:
- trójkąt roboczy: ${design.ergonomics.work_triangle}
- strefa przygotowania: ${design.ergonomics.preparation_zone}
- strefa mycia: ${design.ergonomics.washing_zone}
- strefa gotowania: ${design.ergonomics.cooking_zone}
- strefa przechowywania: ${design.ergonomics.storage_zone}
- przejścia: ${(design.ergonomics.passages || []).join(", ") || "zachowaj realistyczne przejścia"}

${validationText}

PAMIĘĆ PROJEKTU:
Wersja:
${memory?.version_number || 1}

Poprzedni układ:
${memory?.layout || design.layout}

KRYTYCZNE ZASADY:
- dokładnie jedna lodówka
- dokładnie jeden zlew
- dokładnie jedna płyta grzewcza
- dokładnie jeden piekarnik
- dokładnie jedna zmywarka
- nie duplikuj AGD
- lodówka musi być czytelnie widoczna albo jednoznacznie umieszczona w wysokiej zabudowie
- zmywarka musi znajdować się blisko zlewu
- zachowaj realistyczne proporcje szafek
- zachowaj logiczne przejścia
- nie zasłaniaj okien
- nie blokuj drzwi
- nie dodawaj przypadkowych mebli
- nie dodawaj drugiej wyspy
- nie dodawaj przypadkowych dekoracji
- nie twórz nielogicznych frontów
- nie twórz szafek bez możliwości otwierania
- projekt ma być możliwy do wykonania przez stolarza
- bez napisów
- bez wymiarów na obrazie
- bez znaków wodnych poza logo dodawanym później przez aplikację

JAKOŚĆ:
- ultra photorealistic
- professional architectural visualization
- interior design magazine quality
- realistic daylight
- realistic artificial lighting
- realistic materials
- realistic wood grain
- realistic stone texture
- realistic glass reflections
- realistic shadows
- natural camera perspective
- premium custom-made kitchen
- high-end interior photography
- clean composition
- no surreal elements
- no distorted cabinetry
- no duplicated appliances

`.trim();
}

function buildEditPrompt({
  design,
  validation,
  memory,
  correctionRequest,
}: {
  design:
    KitchenDesign;

  validation?:
    KitchenValidationResult |
    null;

  memory?:
    Partial<ProjectMemory> |
    null;

  correctionRequest:
    string;
}): string {

  const protectedElements =
    buildProtectedElementsDescription(
      memory
    );

  const validationText =
    buildValidationDescription(
      validation
    );

  return `

EDYTUJ ZAŁĄCZONĄ WIZUALIZACJĘ KUCHNI.

UWAGA KLIENTA:
${cleanText(
  correctionRequest,
  "Brak jednoznacznej poprawki."
)}

ZAŁĄCZONA WIZUALIZACJA JEST OBOWIĄZUJĄCĄ BAZĄ.

NIE TWÓRZ NOWEJ KUCHNI.
NIE TWÓRZ NOWEJ SCENY.
NIE ZMIENIAJ KOMPOZYCJI.

ELEMENTY CHRONIONE:
${protectedElements}

AKTUALNY PROJEKT:
- układ: ${design.layout}
- styl: ${design.materials.style}
- fronty: ${design.materials.fronts}
- blat: ${design.materials.countertop}
- system otwierania: ${design.materials.handles}
- wyspa: ${design.island.included ? "TAK" : "NIE"}
- wersja: ${memory?.version_number || 1}

AGD, KTÓRE MUSI POZOSTAĆ SPÓJNE:
- lodówka: ${design.appliances.refrigerator}
- zlew: ${design.appliances.sink}
- płyta: ${design.appliances.hob}
- piekarnik: ${design.appliances.oven}
- zmywarka: ${design.appliances.dishwasher}
- okap: ${design.appliances.hood}

${validationText}

ZASADY BEZWZGLĘDNE:
- zmień wyłącznie to, o co poprosił klient
- zachowaj identyczny kadr
- zachowaj identyczną perspektywę
- zachowaj identyczny punkt widzenia
- zachowaj położenie kamery
- zachowaj ściany
- zachowaj okna
- zachowaj drzwi
- zachowaj przejścia
- zachowaj sufit
- zachowaj podłogę
- zachowaj wszystkie meble, których poprawka nie dotyczy
- zachowaj wszystkie materiały, których poprawka nie dotyczy
- zachowaj wszystkie kolory, których poprawka nie dotyczy
- zachowaj wszystkie urządzenia AGD, których poprawka nie dotyczy
- nie dodawaj nowych elementów
- nie usuwaj elementów bez polecenia
- nie poprawiaj niczego z własnej inicjatywy
- nie duplikuj lodówki
- nie duplikuj zlewu
- nie duplikuj płyty
- nie duplikuj piekarnika
- nie duplikuj zmywarki
- nie zmieniaj pory dnia
- nie zmieniaj oświetlenia, jeśli klient o to nie prosił
- nie zmieniaj stylu całej kuchni, jeśli klient o to nie prosił
- nie zmieniaj wielkości wyspy, jeśli klient o to nie prosił
- wynik musi wyglądać jak lokalna poprawka tego samego zdjęcia
- wszystkie nieedytowane obszary mają pozostać możliwie identyczne
- zachowaj wysoką wierność obrazu wejściowego
- fotorealizm
- brak napisów
- brak wymiarów na obrazie
- brak nowych dekoracji

`.trim();
}

async function addOptionalLogo(
  image:
    string,
  shouldAddLogo:
    boolean
): Promise<string> {

  if (!shouldAddLogo) {
    return image;
  }

  try {

    return await addLogoToImage(
      image
    );

  } catch (
    error
  ) {

    console.error(
      "ADD LOGO ERROR:",
      error
    );

    return image;
  }
}

export async function renderKitchen({
  openai,
  design,
  validation = null,
  memory = null,
  previousImage = null,
  isCorrection = false,
  correctionRequest = "",
  imageCount = 1,
  addLogo = true,
}: RenderKitchenOptions): Promise<RenderKitchenResult> {

  const shouldEdit =
    Boolean(
      isCorrection &&
      previousImage
    );

  const safeCount =
    shouldEdit
      ? 1
      : Math.max(
          1,
          Math.min(
            imageCount,
            3
          )
        );

  const prompt =
    shouldEdit
      ? buildEditPrompt({
          design,
          validation,
          memory,
          correctionRequest,
        })
      : buildGenerationPrompt({
          design,
          validation,
          memory,
        });

  const generatedImages:
    string[] = [];

  try {

    if (
      shouldEdit &&
      previousImage
    ) {

      const normalizedImage =
        normalizeBase64Image(
          previousImage
        );

      const imageBuffer =
        Buffer.from(
          normalizedImage,
          "base64"
        );

      const imageFile =
        await toFile(
          imageBuffer,
          "previous-kitchen.png",
          {
            type:
              "image/png",
          }
        );

      const result =
        await openai.images.edit({
          model:
            "gpt-image-1.5",

          image:
            imageFile,

          prompt,

          size:
            "1024x1536",

          quality:
            "high",

          input_fidelity:
            "high",
        });

      const rawImage =
        result.data?.[0]
          ?.b64_json;

      if (rawImage) {

        generatedImages.push(
          await addOptionalLogo(
            rawImage,
            addLogo
          )
        );
      }

    } else {

      for (
        let index = 0;
        index < safeCount;
        index += 1
      ) {

        const variantPrompt =
          safeCount > 1
            ? `${prompt}

WARIANT RENDERU:
${index + 1}

Zachowaj dokładnie ten sam projekt techniczny.
Zmieniaj wyłącznie subtelnie sposób oświetlenia i charakter fotografii.
Nie zmieniaj układu, modułów, AGD ani materiałów.
`
            : prompt;

        const result =
          await openai.images.generate({
            model:
              "gpt-image-1",

            prompt:
              variantPrompt,

            size:
              "1024x1536",
          });

        const rawImage =
          result.data?.[0]
            ?.b64_json;

        if (rawImage) {

          generatedImages.push(
            await addOptionalLogo(
              rawImage,
              addLogo
            )
          );
        }
      }
    }

    return {
      generatedImage:
        generatedImages[0] ||
        null,

      generatedImages,

      prompt,

      mode:
        shouldEdit
          ? "edit"
          : "generate",
    };

  } catch (
    error
  ) {

    console.error(
      "RENDER KITCHEN ERROR:",
      error
    );

    return {
      generatedImage:
        null,

      generatedImages:
        [],

      prompt,

      mode:
        shouldEdit
          ? "edit"
          : "generate",
    };
  }
}