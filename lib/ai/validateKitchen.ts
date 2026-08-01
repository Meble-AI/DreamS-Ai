import OpenAI from "openai";

import type {
  KitchenDesign,
  KitchenModule,
} from "@/lib/ai/designKitchen";

export type ValidationSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type ValidationCategory =
  | "agd"
  | "ergonomia"
  | "kolizje"
  | "wymiary"
  | "wyspa"
  | "moduly"
  | "materialy"
  | "technika"
  | "kompletnosc";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  title: string;
  description: string;
  suggestion: string;
};

export type KitchenValidationResult = {
  valid: boolean;
  score: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
  correctedDesign: KitchenDesign;
  summary: string;
};

type ValidateKitchenOptions = {
  design: KitchenDesign;
  openai?: OpenAI;
  useAiReview?: boolean;
};

const STANDARD_MODULE_WIDTHS = [
  150,
  200,
  250,
  275,
  300,
  350,
  400,
  450,
  500,
  600,
  800,
  900,
  950,
  1000,
  1050,
  1100,
  1150,
  1200,
];

const MIN_PASSAGE_MM = 900;
const RECOMMENDED_PASSAGE_MM = 1000;
const MIN_WORKTOP_BETWEEN_SINK_AND_HOB_MM = 600;
const MIN_HOB_EDGE_DISTANCE_MM = 300;

function cloneDesign(
  design: KitchenDesign
): KitchenDesign {
  return JSON.parse(
    JSON.stringify(design)
  ) as KitchenDesign;
}

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}

function includesAny(
  value: unknown,
  terms: string[]
): boolean {
  const text =
    normalizeText(value);

  return terms.some(
    (term) =>
      text.includes(
        term.toLowerCase()
      )
  );
}

function countMatchingModules(
  modules: KitchenModule[],
  terms: string[]
): number {
  return modules.reduce(
    (
      total,
      module
    ) => {

      const content =
        [
          module.name,
          module.function,
          module.notes,
          module.category,
        ].join(" ");

      return total +
        (
          includesAny(
            content,
            terms
          )
            ? module.quantity || 1
            : 0
        );

    },
    0
  );
}

function countApplianceMentions(
  design: KitchenDesign,
  terms: string[]
): number {

  const applianceValues =
    Object.values(
      design.appliances || {}
    );

  const applianceCount =
    applianceValues.reduce(
      (
        total,
        value
      ) =>
        total +
        (
          includesAny(
            value,
            terms
          )
            ? 1
            : 0
        ),
      0
    );

  const moduleCount =
    countMatchingModules(
      design.modules || [],
      terms
    );

  return Math.max(
    applianceCount,
    moduleCount
  );
}

function addIssue(
  issues: ValidationIssue[],
  issue: ValidationIssue
) {

  if (
    issues.some(
      (existing) =>
        existing.id === issue.id
    )
  ) {
    return;
  }

  issues.push(
    issue
  );
}

function parseMillimeters(
  value: unknown
): number | null {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const match =
    String(value ?? "")
      .replace(",", ".")
      .match(
        /(\d+(?:\.\d+)?)\s*(mm|cm|m)?/i
      );

  if (!match) {
    return null;
  }

  const numeric =
    Number(match[1]);

  const unit =
    (
      match[2] ||
      "mm"
    ).toLowerCase();

  if (
    !Number.isFinite(numeric)
  ) {
    return null;
  }

  if (unit === "m") {
    return Math.round(
      numeric * 1000
    );
  }

  if (unit === "cm") {
    return Math.round(
      numeric * 10
    );
  }

  return Math.round(
    numeric
  );
}

function validateAppliances(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  const checks = [
    {
      id:
        "refrigerator",
      label:
        "lodówka",
      terms:
        [
          "lodów",
          "refrigerator",
        ],
      required:
        true,
    },
    {
      id:
        "sink",
      label:
        "zlew",
      terms:
        [
          "zlew",
          "sink",
        ],
      required:
        true,
    },
    {
      id:
        "hob",
      label:
        "płyta grzewcza",
      terms:
        [
          "płyta",
          "hob",
          "induk",
        ],
      required:
        true,
    },
    {
      id:
        "oven",
      label:
        "piekarnik",
      terms:
        [
          "piekarnik",
          "oven",
        ],
      required:
        true,
    },
    {
      id:
        "dishwasher",
      label:
        "zmywarka",
      terms:
        [
          "zmywark",
          "dishwasher",
        ],
      required:
        true,
    },
  ];

  for (
    const check
    of checks
  ) {

    const count =
      countApplianceMentions(
        design,
        check.terms
      );

    const applianceValue =
      normalizeText(
        (
          design.appliances as Record<
            string,
            string
          >
        )?.[check.id]
      );

    const explicitlyMissing =
      includesAny(
        applianceValue,
        [
          "brak",
          "nie przewidziano",
          "do ustalenia",
          "nie dotyczy",
        ]
      );

    if (
      check.required &&
      (
        count === 0 ||
        explicitlyMissing
      )
    ) {

      addIssue(
        issues,
        {
          id:
            `missing-${check.id}`,
          severity:
            "critical",
          category:
            "agd",
          title:
            `Brak elementu: ${check.label}`,
          description:
            `Projekt nie zawiera jednoznacznie wskazanego elementu: ${check.label}.`,
          suggestion:
            `Dodaj dokładnie jeden element: ${check.label}, w logicznym miejscu ciągu roboczego.`,
        }
      );
    }

    if (count > 1) {

      addIssue(
        issues,
        {
          id:
            `duplicate-${check.id}`,
          severity:
            "critical",
          category:
            "agd",
          title:
            `Zdublowany element: ${check.label}`,
          description:
            `Projekt wskazuje więcej niż jeden element typu ${check.label}.`,
          suggestion:
            `Pozostaw dokładnie jeden element typu ${check.label}, chyba że klient wyraźnie poprosił o dwa.`,
        }
      );
    }
  }

  if (
    !includesAny(
      design.appliances?.dishwasher,
      [
        "zlew",
        "blisko",
        "obok",
        "sąsiad",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "dishwasher-near-sink",
        severity:
          "warning",
        category:
          "ergonomia",
        title:
          "Niepotwierdzona lokalizacja zmywarki",
        description:
          "Projekt nie potwierdza, że zmywarka znajduje się blisko zlewu.",
        suggestion:
          "Umieść zmywarkę bezpośrednio obok szafki zlewozmywakowej albo możliwie najbliżej instalacji wodnej.",
      }
    );
  }
}

function validateModules(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  const modules =
    design.modules || [];

  if (
    modules.length === 0
  ) {

    addIssue(
      issues,
      {
        id:
          "no-modules",
        severity:
          "error",
        category:
          "moduly",
        title:
          "Brak listy modułów",
        description:
          "Projekt nie zawiera uporządkowanej listy szafek i elementów zabudowy.",
        suggestion:
          "Dodaj listę modułów z nazwą, szerokością, kategorią, ilością i przypisaną ścianą.",
      }
    );

    return;
  }

  modules.forEach(
    (
      module,
      index
    ) => {

      const moduleId =
        module.id ||
        `M${index + 1}`;

      if (
        !module.name?.trim()
      ) {

        addIssue(
          issues,
          {
            id:
              `module-name-${moduleId}`,
            severity:
              "error",
            category:
              "moduly",
            title:
              "Moduł bez nazwy",
            description:
              `Moduł ${moduleId} nie ma nazwy.`,
            suggestion:
              "Nadaj modułowi jednoznaczną nazwę opisującą jego funkcję.",
          }
        );
      }

      if (
        !module.quantity ||
        module.quantity < 1
      ) {

        addIssue(
          issues,
          {
            id:
              `module-quantity-${moduleId}`,
            severity:
              "error",
            category:
              "moduly",
            title:
              "Nieprawidłowa ilość modułu",
            description:
              `Moduł ${module.name || moduleId} ma nieprawidłową ilość.`,
            suggestion:
              "Ustaw ilość na co najmniej 1.",
          }
        );
      }

      if (
        module.width_mm !== null &&
        (
          !Number.isFinite(
            module.width_mm
          ) ||
          module.width_mm <= 0
        )
      ) {

        addIssue(
          issues,
          {
            id:
              `module-width-invalid-${moduleId}`,
            severity:
              "error",
            category:
              "wymiary",
            title:
              "Nieprawidłowa szerokość modułu",
            description:
              `Moduł ${module.name || moduleId} ma nieprawidłową szerokość.`,
            suggestion:
              "Podaj szerokość w milimetrach albo ustaw null, jeżeli wymiar nie jest znany.",
          }
        );
      }

      if (
        module.width_mm !== null &&
        !STANDARD_MODULE_WIDTHS.includes(
          module.width_mm
        ) &&
        !includesAny(
          module.name,
          [
            "blenda",
            "panel",
            "wysłona",
            "cokół",
            "blat",
            "wyspa",
          ]
        )
      ) {

        addIssue(
          issues,
          {
            id:
              `module-width-unusual-${moduleId}`,
            severity:
              "info",
            category:
              "wymiary",
            title:
              "Nietypowa szerokość modułu",
            description:
              `Moduł ${module.name || moduleId} ma szerokość ${module.width_mm} mm, która nie jest typową szerokością systemową.`,
            suggestion:
              "Zweryfikuj, czy nietypowy wymiar jest celowy i możliwy do wykonania.",
          }
        );
      }

      if (
        !module.wall &&
        !includesAny(
          module.category,
          [
            "wyspa",
            "dekoracyjna",
          ]
        )
      ) {

        addIssue(
          issues,
          {
            id:
              `module-wall-${moduleId}`,
            severity:
              "warning",
            category:
              "kompletnosc",
            title:
              "Brak przypisania modułu do ściany",
            description:
              `Moduł ${module.name || moduleId} nie ma wskazanej ściany.`,
            suggestion:
              "Przypisz moduł do ściany A, B, C lub D albo oznacz jako element wyspy.",
          }
        );
      }
    }
  );
}

function validateIsland(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  if (
    !design.island?.included
  ) {
    return;
  }

  const width =
    design.island
      .dimensions_mm?.width;

  const depth =
    design.island
      .dimensions_mm?.depth;

  if (
    width !== null &&
    (
      width < 800 ||
      width > 4000
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "island-width",
        severity:
          "warning",
        category:
          "wyspa",
        title:
          "Podejrzany wymiar wyspy",
        description:
          `Szerokość wyspy wynosi ${width} mm i wymaga weryfikacji.`,
        suggestion:
          "Zweryfikuj szerokość wyspy względem pomieszczenia, funkcji i przejść.",
      }
    );
  }

  if (
    depth !== null &&
    depth < 600
  ) {

    addIssue(
      issues,
      {
        id:
          "island-depth",
        severity:
          "warning",
        category:
          "wyspa",
        title:
          "Zbyt mała głębokość wyspy",
        description:
          `Głębokość wyspy wynosi ${depth} mm.`,
        suggestion:
          "Dla funkcjonalnej wyspy rozważ głębokość co najmniej około 600 mm, a przy siedzeniu lub zabudowie dwustronnej odpowiednio większą.",
      }
    );
  }

  const passageText =
    (
      design.ergonomics?.passages ||
      []
    ).join(" ");

  const parsedPassage =
    parseMillimeters(
      passageText
    );

  if (
    parsedPassage !== null &&
    parsedPassage <
      MIN_PASSAGE_MM
  ) {

    addIssue(
      issues,
      {
        id:
          "island-passage-critical",
        severity:
          "critical",
        category:
          "wyspa",
        title:
          "Zbyt małe przejście przy wyspie",
        description:
          `Wskazane przejście ma około ${parsedPassage} mm.`,
        suggestion:
          `Zapewnij co najmniej ${MIN_PASSAGE_MM} mm, a najlepiej około ${RECOMMENDED_PASSAGE_MM}–1100 mm.`,
      }
    );
  }

  if (
    (
      design.ergonomics?.passages ||
      []
    ).length === 0
  ) {

    addIssue(
      issues,
      {
        id:
          "island-no-passage-data",
        severity:
          "warning",
        category:
          "wyspa",
        title:
          "Brak informacji o przejściach",
        description:
          "Projekt zawiera wyspę, ale nie podaje szerokości przejść.",
        suggestion:
          "Dodaj szerokości przejść po każdej stronie wyspy.",
      }
    );
  }
}

function validateErgonomics(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  const ergonomics =
    design.ergonomics;

  if (
    !ergonomics?.work_triangle ||
    includesAny(
      ergonomics.work_triangle,
      [
        "do ustalenia",
        "brak",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "work-triangle",
        severity:
          "warning",
        category:
          "ergonomia",
        title:
          "Nieopisany trójkąt roboczy",
        description:
          "Projekt nie opisuje relacji między lodówką, zlewem i płytą.",
        suggestion:
          "Uzupełnij logiczny ciąg: lodówka → blat odkładczy → zlew → blat roboczy → płyta.",
      }
    );
  }

  if (
    !ergonomics
      ?.preparation_zone ||
    includesAny(
      ergonomics.preparation_zone,
      [
        "brak",
        "do ustalenia",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "preparation-zone",
        severity:
          "error",
        category:
          "ergonomia",
        title:
          "Brak strefy przygotowania",
        description:
          "Projekt nie wskazuje wyraźnego blatu roboczego.",
        suggestion:
          `Zapewnij funkcjonalny blat, najlepiej co najmniej około ${MIN_WORKTOP_BETWEEN_SINK_AND_HOB_MM} mm między zlewem a płytą.`,
      }
    );
  }

  const collisions =
    ergonomics?.collisions ||
    [];

  if (
    collisions.length > 0
  ) {

    collisions.forEach(
      (
        collision,
        index
      ) => {

        addIssue(
          issues,
          {
            id:
              `collision-${index + 1}`,
            severity:
              "error",
            category:
              "kolizje",
            title:
              "Wykryta możliwa kolizja",
            description:
              collision,
            suggestion:
              "Zmień układ, dodaj blendę albo zwiększ dystans między elementami.",
          }
        );
      }
    );
  }

  const passageValues =
    ergonomics?.passages ||
    [];

  passageValues.forEach(
    (
      passage,
      index
    ) => {

      const value =
        parseMillimeters(
          passage
        );

      if (
        value !== null &&
        value <
          MIN_PASSAGE_MM
      ) {

        addIssue(
          issues,
          {
            id:
              `passage-${index + 1}`,
            severity:
              "critical",
            category:
              "ergonomia",
            title:
              "Zbyt wąskie przejście",
            description:
              `Przejście opisano jako około ${value} mm.`,
            suggestion:
              `Zwiększ przejście do co najmniej ${MIN_PASSAGE_MM} mm.`,
          }
        );
      }
    }
  );
}

function validateMaterials(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  const materials =
    design.materials;

  const requiredFields = [
    {
      key:
        "style",
      label:
        "styl",
    },
    {
      key:
        "fronts",
      label:
        "fronty",
    },
    {
      key:
        "countertop",
      label:
        "blat",
    },
    {
      key:
        "handles",
      label:
        "system otwierania",
    },
  ] as const;

  requiredFields.forEach(
    (
      field
    ) => {

      const value =
        materials?.[
          field.key
        ];

      if (
        !value ||
        includesAny(
          value,
          [
            "do ustalenia",
            "brak",
          ]
        )
      ) {

        addIssue(
          issues,
          {
            id:
              `material-${field.key}`,
            severity:
              "info",
            category:
              "materialy",
            title:
              `Nieokreślone: ${field.label}`,
            description:
              `Projekt nie określa jednoznacznie pola: ${field.label}.`,
            suggestion:
              `Ustal z klientem: ${field.label}.`,
          }
        );
      }
    }
  );

  if (
    includesAny(
      materials?.countertop,
      [
        "spiek",
        "kamień",
        "kwarc",
      ]
    ) &&
    !includesAny(
      materials?.backsplash,
      [
        "spiek",
        "kamień",
        "szkło",
        "płyta",
        "mikrocement",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "backsplash-material",
        severity:
          "info",
        category:
          "materialy",
        title:
          "Nieokreślona wysłona",
        description:
          "Projekt premium z blatem kamiennym lub spiekiem nie ma jednoznacznie dobranej wysłony.",
        suggestion:
          "Dobierz wysłonę spójną z blatem i frontami.",
      }
    );
  }
}

function validateTechnicalRules(
  design: KitchenDesign,
  issues: ValidationIssue[]
) {

  const allText =
    JSON.stringify(
      design
    ).toLowerCase();

  if (
    includesAny(
      allText,
      [
        "płyta przy lodówce",
        "płyta bezpośrednio przy lodówce",
        "hob next to refrigerator",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "hob-next-refrigerator",
        severity:
          "error",
        category:
          "technika",
        title:
          "Płyta zbyt blisko lodówki",
        description:
          "Projekt sugeruje ustawienie płyty bezpośrednio przy lodówce.",
        suggestion:
          `Zapewnij blat oddzielający, najlepiej co najmniej około ${MIN_HOB_EDGE_DISTANCE_MM} mm lub więcej.`,
      }
    );
  }

  if (
    includesAny(
      allText,
      [
        "zasłania okno",
        "blokuje okno",
        "kolizja z oknem",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "window-blocked",
        severity:
          "critical",
        category:
          "kolizje",
        title:
          "Zabudowa koliduje z oknem",
        description:
          "Projekt wskazuje możliwe zasłonięcie lub zablokowanie okna.",
        suggestion:
          "Przesuń wysoką zabudowę albo obniż elementy w strefie okna.",
      }
    );
  }

  if (
    includesAny(
      allText,
      [
        "blokuje drzwi",
        "kolizja z drzwiami",
        "w świetle drzwi",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "door-blocked",
        severity:
          "critical",
        category:
          "kolizje",
        title:
          "Zabudowa koliduje z drzwiami",
        description:
          "Projekt wskazuje możliwe zablokowanie drzwi lub przejścia.",
        suggestion:
          "Usuń element z pola otwierania drzwi i zapewnij swobodną komunikację.",
      }
    );
  }

  if (
    includesAny(
      allText,
      [
        "bez blendy",
        "brak blendy",
      ]
    )
  ) {

    addIssue(
      issues,
      {
        id:
          "missing-filler",
        severity:
          "warning",
        category:
          "technika",
        title:
          "Możliwy brak blendy",
        description:
          "Projekt wskazuje miejsce, w którym może brakować blendy przy ścianie lub narożniku.",
        suggestion:
          "Dodaj blendę umożliwiającą otwieranie frontu i kompensację nierówności ściany.",
      }
    );
  }
}

function createScore(
  issues: ValidationIssue[]
): number {

  let score =
    100;

  issues.forEach(
    (
      issue
    ) => {

      if (
        issue.severity ===
        "critical"
      ) {
        score -= 25;
      }

      if (
        issue.severity ===
        "error"
      ) {
        score -= 12;
      }

      if (
        issue.severity ===
        "warning"
      ) {
        score -= 5;
      }

      if (
        issue.severity ===
        "info"
      ) {
        score -= 1;
      }
    }
  );

  return Math.max(
    0,
    Math.min(
      100,
      score
    )
  );
}

function createSummary(
  issues: ValidationIssue[],
  score: number
): string {

  const critical =
    issues.filter(
      (issue) =>
        issue.severity ===
        "critical"
    ).length;

  const errors =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error"
    ).length;

  const warnings =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning"
    ).length;

  if (
    critical === 0 &&
    errors === 0 &&
    warnings === 0
  ) {
    return `Projekt przeszedł walidację bez istotnych zastrzeżeń. Wynik: ${score}/100.`;
  }

  return `Walidacja wykryła: ${critical} błędów krytycznych, ${errors} błędów i ${warnings} ostrzeżeń. Wynik projektu: ${score}/100.`;
}

async function runAiReview(
  openai: OpenAI,
  design: KitchenDesign
): Promise<ValidationIssue[]> {

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

Jesteś technicznym walidatorem kuchni na wymiar.

Sprawdź projekt pod kątem:
- zdublowanego AGD,
- braku lodówki, zlewu, płyty, piekarnika lub zmywarki,
- złej ergonomii,
- braku blatu roboczego,
- kolizji frontów,
- kolizji z oknami lub drzwiami,
- zbyt małych przejść,
- nieprawidłowej wyspy,
- nierealnych modułów,
- błędów technicznych.

Zwróć wyłącznie JSON:

{
  "issues": [
    {
      "id": "",
      "severity": "info",
      "category": "technika",
      "title": "",
      "description": "",
      "suggestion": ""
    }
  ]
}

Dozwolone severity:
info, warning, error, critical.

Dozwolone category:
agd, ergonomia, kolizje, wymiary, wyspa, moduly, materialy, technika, kompletnosc.

Nie wymyślaj problemów bez podstawy.
`,
          },

          {
            role:
              "user",

            content:
              JSON.stringify(
                design,
                null,
                2
              ),
          },
        ],
      });

    const parsed =
      JSON.parse(
        response
          .choices?.[0]
          ?.message?.content ||
        "{}"
      );

    if (
      !Array.isArray(
        parsed.issues
      )
    ) {
      return [];
    }

    return parsed.issues
      .filter(
        (
          issue: unknown
        ) =>
          Boolean(
            issue &&
            typeof issue ===
            "object"
          )
      )
      .map(
        (
          issue: any,
          index: number
        ) => ({
          id:
            String(
              issue.id ||
              `ai-${index + 1}`
            ),
          severity:
            [
              "info",
              "warning",
              "error",
              "critical",
            ].includes(
              issue.severity
            )
              ? issue.severity
              : "warning",
          category:
            [
              "agd",
              "ergonomia",
              "kolizje",
              "wymiary",
              "wyspa",
              "moduly",
              "materialy",
              "technika",
              "kompletnosc",
            ].includes(
              issue.category
            )
              ? issue.category
              : "technika",
          title:
            String(
              issue.title ||
              "Uwaga walidatora AI"
            ),
          description:
            String(
              issue.description ||
              ""
            ),
          suggestion:
            String(
              issue.suggestion ||
              ""
            ),
        })
      );

  } catch (
    error
  ) {

    console.error(
      "AI VALIDATION ERROR:",
      error
    );

    return [];
  }
}

export async function validateKitchen({
  design,
  openai,
  useAiReview = false,
}: ValidateKitchenOptions): Promise<KitchenValidationResult> {

  const correctedDesign =
    cloneDesign(
      design
    );

  const issues:
    ValidationIssue[] = [];

  validateAppliances(
    correctedDesign,
    issues
  );

  validateModules(
    correctedDesign,
    issues
  );

  validateIsland(
    correctedDesign,
    issues
  );

  validateErgonomics(
    correctedDesign,
    issues
  );

  validateMaterials(
    correctedDesign,
    issues
  );

  validateTechnicalRules(
    correctedDesign,
    issues
  );

  if (
    useAiReview &&
    openai
  ) {

    const aiIssues =
      await runAiReview(
        openai,
        correctedDesign
      );

    aiIssues.forEach(
      (issue) =>
        addIssue(
          issues,
          issue
        )
    );
  }

  const score =
    createScore(
      issues
    );

  const criticalCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "critical"
    ).length;

  const errorCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "error"
    ).length;

  const warningCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "warning"
    ).length;

  const infoCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "info"
    ).length;

  return {
    valid:
      criticalCount === 0 &&
      errorCount === 0,

    score,

    criticalCount,

    errorCount,

    warningCount,

    infoCount,

    issues,

    correctedDesign,

    summary:
      createSummary(
        issues,
        score
      ),
  };
}