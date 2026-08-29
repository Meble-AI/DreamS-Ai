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

  roomImages?:
    string[];

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
- dokładnie jedna lodówka — LODÓWKA JEST OBOWIĄZKOWA I NIE MOŻE ZNIKNĄĆ Z WIZUALIZACJI
- jeśli lodówka jest w zabudowie, pokaż jednoznaczny słupek lodówkowy 600 mm
- nie zastępuj lodówki zwykłą szafą wysoką
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

LOGIKA SZAFEK GÓRNYCH — BEZWZGLĘDNA:
- standardowa głębokość górnych szafek: około 350 mm
- sąsiadujące górne szafki mają mieć spójną głębokość i jedną linię frontów
- nie twórz przypadkowych uskoków głębokości
- wysoka zabudowa 560–600 mm nie może wyglądać jak górna szafka
- w narożniku nie zestawiaj dwóch wiszących szafek o przypadkowo różnych głębokościach
- narożnik rozwiązuj poprawnie stolarsko: szafka narożna o spójnej głębokości ALBO zakończenie ciągu blendą/dystansem
- fronty w narożniku nie mogą kolidować przy otwieraniu
- jeżeli narożnik jest niepewny, lepiej zakończyć ciąg blendą niż tworzyć nielogiczną bryłę
- wyjątek dla okapu może mieć lokalną różnicę konstrukcyjną, ale nie może wyglądać jak przypadkowy głęboki słupek wiszący

KONTROLA AGD PRZED ZWROTEM OBRAZU:
- lodówka = dokładnie 1
- zlew = dokładnie 1
- płyta = dokładnie 1
- piekarnik = dokładnie 1
- zmywarka = dokładnie 1
- jeśli lodówki nie widać lub nie jest jednoznacznie zabudowana, wynik jest niepoprawny

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

function buildRoomPhotoPrompt({
  design,
  validation,
}: {
  design: KitchenDesign;
  validation?: KitchenValidationResult | null;
}): string {

  const modules =
    buildModulesDescription(design);

  const validationText =
    buildValidationDescription(validation);

  return `
EDYTUJ ZAŁĄCZONE ORYGINALNE ZDJĘCIE POMIESZCZENIA KLIENTA I WSTAW DO NIEGO PROJEKT KUCHNI.

ZAŁĄCZONE ZDJĘCIE JEST JEDYNYM ŹRÓDŁEM PRAWDY DLA ARCHITEKTURY POMIESZCZENIA.

NIE GENERUJ NOWEGO POMIESZCZENIA.
NIE ZMIENIAJ ARCHITEKTURY.

BEZWZGLĘDNIE ZACHOWAJ:
- dokładny kadr i perspektywę
- położenie kamery
- proporcje pomieszczenia
- ściany, narożniki i wnęki
- dokładną liczbę, wielkość i położenie okien
- dokładną liczbę, wielkość i położenie drzwi i przejść
- sufit i podłogę
- słupy, skosy, grzejniki i inne stałe elementy

NIE WOLNO:
- przesuwać, usuwać ani dodawać okien
- przesuwać, usuwać ani dodawać drzwi
- zmieniać szerokości lub wysokości pomieszczenia
- tworzyć albo usuwać ścian
- zmieniać punktu widzenia
- tworzyć nowego wnętrza zamiast tego ze zdjęcia

PROJEKT:
${design.summary}

UKŁAD:
${design.layout}

MODUŁY:
${modules}

AGD:
- lodówka: ${design.appliances.refrigerator}
- zlew: ${design.appliances.sink}
- płyta: ${design.appliances.hob}
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

${validationText}

Wstaw zabudowę do istniejącego wnętrza tak, jakby została naprawdę wykonana.
Nie zasłaniaj okien ani przejść.
Dokładnie jedna lodówka, jeden zlew, jedna płyta, jeden piekarnik i jedna zmywarka.
Fotorealizm profesjonalnej fotografii wnętrz.
Bez napisów i wymiarów.

KONTROLA KOŃCOWA:
wynik ma przedstawiać TO SAMO pomieszczenie co fotografia wejściowa — z zachowaną architekturą, kadrem i perspektywą — ale z zaprojektowaną zabudową kuchenną.
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

  const correction =
    cleanText(
      correctionRequest,
      "Brak jednoznacznej poprawki."
    );

  const validationText =
    buildValidationDescription(
      validation
    );

  return `

EDYTUJ DOKŁADNIE ZAŁĄCZONĄ WIZUALIZACJĘ KUCHNI.

NAJWAŻNIEJSZA INSTRUKCJA — MA ABSOLUTNY PRIORYTET:
"${correction}"

OBRAZ WEJŚCIOWY JEST JEDYNYM ŹRÓDŁEM PRAWDY DLA:
- układu kuchni
- liczby i położenia szafek
- położenia AGD
- okien
- drzwi
- ścian
- perspektywy
- kadru
- proporcji mebli
- aktualnych materiałów i kolorów

DANE TEKSTOWE PONIŻEJ SĄ WYŁĄCZNIE POMOCNICZE.
JEŚLI SĄ SPRZECZNE Z OBRAZEM LUB POLECENIEM KLIENTA,
ZIGNORUJ JE.

POMOCNICZY OPIS TECHNICZNY:
- układ: ${design.layout}
- styl: ${design.materials.style}
- fronty: ${design.materials.fronts}
- blat: ${design.materials.countertop}
- system otwierania: ${design.materials.handles}
- wyspa: ${design.island.included ? "TAK" : "NIE"}

${validationText}

SPOSÓB WYKONANIA POPRAWKI:
1. Najpierw znajdź na obrazie element wskazany przez klienta.
2. Zmień ten element WYRAŹNIE i WIDOCZNIE zgodnie z poleceniem.
3. Nie wykonuj kosmetycznej, ledwo widocznej zmiany.
4. Wszystko, czego klient nie wskazał, pozostaw możliwie identyczne.
5. Jeśli klient prosi o zmianę koloru lub materiału, nowy kolor/materiał ma być jednoznacznie widoczny.
6. Jeśli klient prosi o dodanie elementu, dodaj go dokładnie w logicznym miejscu i nie zmieniaj reszty projektu.
7. Jeśli klient prosi o usunięcie elementu, usuń tylko ten element i odtwórz realistycznie tło.
8. Jeśli klient prosi o zmianę konkretnej szafki/bryły, zmień tylko tę bryłę.

ZASADY BEZWZGLĘDNE:
- WYKONAJ polecenie klienta; nie wolno pozostawić obrazu bez zmiany
- lodówka jest elementem obowiązkowym; jeśli poprawka jej nie dotyczy, nie wolno jej usuwać
- zachowaj dokładnie jedną lodówkę
- górne szafki utrzymuj w spójnej głębokości około 350 mm
- w narożniku nie twórz przypadkowego uskoku głębokości; zastosuj poprawne rozwiązanie narożne albo blendę
- nie twórz nowej kuchni
- nie twórz nowej sceny
- zachowaj identyczny kadr
- zachowaj identyczną perspektywę
- zachowaj położenie kamery
- zachowaj ściany, okna, drzwi, przejścia, sufit i podłogę
- zachowaj wszystkie meble, których poprawka nie dotyczy
- zachowaj AGD, którego poprawka nie dotyczy
- nie dodawaj elementów niezamówionych przez klienta
- nie usuwaj elementów nieobjętych poleceniem
- nie duplikuj lodówki, zlewu, płyty, piekarnika ani zmywarki
- nie zmieniaj oświetlenia, jeśli klient o to nie prosił
- nie zmieniaj stylu całej kuchni, jeśli klient o to nie prosił
- wszystkie nieedytowane obszary mają pozostać możliwie identyczne
- fotorealizm
- brak napisów
- brak wymiarów na obrazie

KONTROLA KOŃCOWA:
Przed zwróceniem obrazu sprawdź, czy polecenie
"${correction}"
jest faktycznie widoczne na wyniku.
Jeżeli nie — popraw obraz ponownie w ramach tej samej edycji.

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
  roomImages = [],
  isCorrection = false,
  correctionRequest = "",
  imageCount = 1,
  addLogo = true,
}: RenderKitchenOptions): Promise<RenderKitchenResult> {

  const sourceRoomImage =
    Array.isArray(roomImages)
      ? roomImages.find(
          (image) =>
            typeof image === "string" &&
            image.startsWith("data:image/")
        ) || null
      : null;

  const shouldEdit =
    Boolean(
      isCorrection &&
      previousImage
    );

  const shouldUseRoomPhoto =
    Boolean(
      !shouldEdit &&
      sourceRoomImage
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
      : shouldUseRoomPhoto
        ? buildRoomPhotoPrompt({
            design,
            validation,
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
      shouldUseRoomPhoto &&
      sourceRoomImage
    ) {

      const normalizedImage =
        normalizeBase64Image(
          sourceRoomImage
        );

      const imageBuffer =
        Buffer.from(
          normalizedImage,
          "base64"
        );

      const isJpeg =
        sourceRoomImage.startsWith(
          "data:image/jpeg"
        ) ||
        sourceRoomImage.startsWith(
          "data:image/jpg"
        );

      const mimeType =
        isJpeg
          ? "image/jpeg"
          : "image/png";

      const extension =
        isJpeg
          ? "jpg"
          : "png";

      const imageFile =
        await toFile(
          imageBuffer,
          `client-room.${extension}`,
          {
            type:
              mimeType,
          }
        );

      /*
       * Każdy wariant powstaje jako EDYCJA tego samego
       * oryginalnego zdjęcia klienta, a nie generacja od zera.
       */
      for (
        let index = 0;
        index < safeCount;
        index += 1
      ) {

        const result =
          await openai.images.edit({
            model:
              "gpt-image-1.5",

            image:
              imageFile,

            prompt:
              `${prompt}

WARIANT ${index + 1}/${safeCount}.
Zachowaj dokładnie architekturę, kadr i perspektywę zdjęcia wejściowego.
Różnicuj wyłącznie rozwiązanie zabudowy kuchennej zgodnie z projektem.`,

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
      }

    } else if (
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

      const isJpeg =
        previousImage.startsWith(
          "data:image/jpeg"
        ) ||
        previousImage.startsWith(
          "data:image/jpg"
        );

      const mimeType =
        isJpeg
          ? "image/jpeg"
          : "image/png";

      const extension =
        isJpeg
          ? "jpg"
          : "png";

      const imageFile =
        await toFile(
          imageBuffer,
          `previous-kitchen.${extension}`,
          {
            type:
              mimeType,
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

      const cameraAngles = [
        `
UJĘCIE 1 — GŁÓWNE:
- szeroki, reprezentacyjny kadr pokazujący całą zabudowę
- naturalna perspektywa wnętrzarska
- pokaż układ kuchni możliwie kompletnie
`,
        `
UJĘCIE 2 — BOCZNE:
- pokaż dokładnie TEN SAM projekt z drugiej strony
- kamera przesunięta w bok o około 35–45 stopni
- zachowaj identyczny układ, materiały, kolory, AGD i wyposażenie
`,
        `
UJĘCIE 3 — DRUGA PERSPEKTYWA:
- pokaż dokładnie TEN SAM projekt z przeciwnego narożnika lub bliższej perspektywy
- pokaż fronty, blat, uchwyty i najważniejsze detale zabudowy
- zachowaj identyczny układ, materiały, kolory, AGD i wyposażenie
`,
      ];

      const generatedResults =
        await Promise.all(
          Array.from({
            length:
              safeCount,
          }).map(
            async (
              _,
              index
            ) => {

              const variantPrompt =
                safeCount > 1
                  ? `${prompt}

${cameraAngles[index] || cameraAngles[0]}

ZASADY SPÓJNOŚCI:
- wszystkie obrazy przedstawiają dokładnie tę samą kuchnię
- identyczna liczba i położenie szafek
- identyczne kolory frontów
- identyczny materiał i kolor blatu
- identyczny system uchwytów / otwierania
- identyczne AGD
- identyczna wyspa, jeśli występuje
- identyczne ściany, okna, drzwi i podłoga
- zmienia się wyłącznie punkt ustawienia kamery
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

              if (!rawImage) {
                return null;
              }

              return await addOptionalLogo(
                rawImage,
                addLogo
              );
            }
          )
        );

      generatedResults.forEach(
        (
          image
        ) => {

          if (image) {
            generatedImages.push(
              image
            );
          }
        }
      );
    }

    return {
      generatedImage:
        generatedImages[0] ||
        null,

      generatedImages,

      prompt,

      mode:
        (
          shouldEdit ||
          shouldUseRoomPhoto
        )
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
        (
          shouldEdit ||
          shouldUseRoomPhoto
        )
          ? "edit"
          : "generate",
    };
  }
}
