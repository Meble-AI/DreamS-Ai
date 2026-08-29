import type {
  KitchenDesign,
  KitchenMaterials,
  KitchenAppliancePlan,
  KitchenErgonomics,
  KitchenModule,
} from "@/lib/ai/designKitchen";

export type ProjectChangeMode =
  | "initial"
  | "correction"
  | "manual_update"
  | "system";

export type ProjectChangeEntry = {
  version: number;
  mode: ProjectChangeMode;
  description: string;
  created_at: string;
  changed_fields: string[];
};

export type ProtectedProjectElements = {
  layout: boolean;
  camera: boolean;
  walls: boolean;
  windows: boolean;
  doors: boolean;
  passages: boolean;
  modules: boolean;
  appliances: boolean;
  materials: boolean;
  lighting: boolean;
};

export type ProjectMemory = {
  version_number: number;
  created_at: string;
  updated_at: string;

  project_name: string;
  project_summary: string;

  layout: string;
  layout_reason: string;

  room: {
    analysis: string;
    walls: unknown[];
    windows: number;
    doors: number;
    layout: string;
    estimated_size: string;
    has_island_space: boolean;
    kitchen_type: string;
    ergonomic_notes: string[];
  };

  island: KitchenDesign["island"];

  modules: KitchenModule[];

  appliances: KitchenAppliancePlan;

  materials: KitchenMaterials;

  ergonomics: KitchenErgonomics;

  technical_notes: string[];

  render_description: string;

  protected_elements: ProtectedProjectElements;

  last_correction: string;

  change_history: ProjectChangeEntry[];

  user_preferences: {
    style: string;
    front_color: string;
    countertop: string;
    handle_system: string;
    lighting: string[];
    wants_island: boolean | null;
    wants_display_cabinets: boolean | null;
    wants_blum: boolean | null;
  };
};

type CreateProjectMemoryOptions = {
  design: KitchenDesign;
  roomAnalysis?: string;
  roomData?: {
    walls?: unknown[];
    windows?: number;
    doors?: number;
    layout?: string;
    estimated_size?: string;
    has_island_space?: boolean;
    kitchen_type?: string;
    ergonomic_notes?: string[];
  };
  previousMemory?: Partial<ProjectMemory> | null;
  correctionRequest?: string;
  isCorrection?: boolean;
};

type MergeProjectMemoryOptions = {
  previousMemory: Partial<ProjectMemory> | null | undefined;
  nextDesign: KitchenDesign;
  roomAnalysis?: string;
  roomData?: CreateProjectMemoryOptions["roomData"];
  correctionRequest?: string;
  isCorrection?: boolean;
};

const DEFAULT_PROTECTED_ELEMENTS: ProtectedProjectElements = {
  layout: true,
  camera: true,
  walls: true,
  windows: true,
  doors: true,
  passages: true,
  modules: true,
  appliances: true,
  materials: true,
  lighting: true,
};

function nowIso(): string {
  return new Date().toISOString();
}

function cleanString(
  value: unknown,
  fallback = ""
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value
    .replace(/\s+/g, " ")
    .trim();
}

function safeArray<T>(
  value: unknown
): T[] {
  return Array.isArray(value)
    ? value as T[]
    : [];
}

function deepClone<T>(
  value: T
): T {
  return JSON.parse(
    JSON.stringify(value)
  ) as T;
}

function normalizeBoolean(
  value: unknown
): boolean | null {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  return null;
}

function createInitialHistoryEntry(): ProjectChangeEntry {
  return {
    version: 1,
    mode: "initial",
    description:
      "Pierwsza wersja projektu.",
    created_at:
      nowIso(),
    changed_fields: [
      "layout",
      "modules",
      "appliances",
      "materials",
      "ergonomics",
    ],
  };
}

function detectChangedFields(
  previousMemory:
    Partial<ProjectMemory> |
    null |
    undefined,
  nextDesign:
    KitchenDesign
): string[] {

  if (!previousMemory) {
    return [
      "layout",
      "modules",
      "appliances",
      "materials",
      "ergonomics",
      "island",
    ];
  }

  const changed:
    string[] = [];

  if (
    cleanString(
      previousMemory.layout
    ) !==
    cleanString(
      nextDesign.layout
    )
  ) {
    changed.push("layout");
  }

  if (
    JSON.stringify(
      previousMemory.modules || []
    ) !==
    JSON.stringify(
      nextDesign.modules || []
    )
  ) {
    changed.push("modules");
  }

  if (
    JSON.stringify(
      previousMemory.appliances || {}
    ) !==
    JSON.stringify(
      nextDesign.appliances || {}
    )
  ) {
    changed.push("appliances");
  }

  if (
    JSON.stringify(
      previousMemory.materials || {}
    ) !==
    JSON.stringify(
      nextDesign.materials || {}
    )
  ) {
    changed.push("materials");
  }

  if (
    JSON.stringify(
      previousMemory.ergonomics || {}
    ) !==
    JSON.stringify(
      nextDesign.ergonomics || {}
    )
  ) {
    changed.push("ergonomics");
  }

  if (
    JSON.stringify(
      previousMemory.island || {}
    ) !==
    JSON.stringify(
      nextDesign.island || {}
    )
  ) {
    changed.push("island");
  }

  return changed;
}

function updateProtectionRules(
  correctionRequest: string,
  previous:
    ProtectedProjectElements
): ProtectedProjectElements {

  const request =
    correctionRequest
      .toLowerCase();

  const updated = {
    ...previous,
  };

  if (
    request.includes("układ") ||
    request.includes("przestaw") ||
    request.includes("rozmieszczenie")
  ) {
    updated.layout = false;
    updated.modules = false;
    updated.appliances = false;
  }

  if (
    request.includes("kamera") ||
    request.includes("kadr") ||
    request.includes("perspektyw")
  ) {
    updated.camera = false;
  }

  if (
    request.includes("ścian") ||
    request.includes("okno") ||
    request.includes("drzwi") ||
    request.includes("przejście")
  ) {
    updated.walls = false;
    updated.windows = false;
    updated.doors = false;
    updated.passages = false;
  }

  if (
    request.includes("front") ||
    request.includes("kolor") ||
    request.includes("blat") ||
    request.includes("uchwyt") ||
    request.includes("materiał") ||
    request.includes("spiek") ||
    request.includes("drewno") ||
    request.includes("kaszmir")
  ) {
    updated.materials = false;
  }

  if (
    request.includes("led") ||
    request.includes("oświetlen")
  ) {
    updated.lighting = false;
  }

  if (
    request.includes("lodów") ||
    request.includes("zlew") ||
    request.includes("płyta") ||
    request.includes("piekarnik") ||
    request.includes("zmywark") ||
    request.includes("agd")
  ) {
    updated.appliances = false;
  }

  if (
    request.includes("wyspa") ||
    request.includes("półwysep")
  ) {
    updated.layout = false;
    updated.modules = false;
  }

  return updated;
}

function extractUserPreferences(
  design: KitchenDesign,
  previousMemory:
    Partial<ProjectMemory> |
    null |
    undefined
): ProjectMemory["user_preferences"] {

  return {
    style:
      cleanString(
        design.materials?.style,
        previousMemory
          ?.user_preferences
          ?.style || ""
      ),

    front_color:
      cleanString(
        design.materials?.fronts,
        previousMemory
          ?.user_preferences
          ?.front_color || ""
      ),

    countertop:
      cleanString(
        design.materials?.countertop,
        previousMemory
          ?.user_preferences
          ?.countertop || ""
      ),

    handle_system:
      cleanString(
        design.materials?.handles,
        previousMemory
          ?.user_preferences
          ?.handle_system || ""
      ),

    lighting:
      safeArray<string>(
        design.materials?.lighting
      ),

    wants_island:
      normalizeBoolean(
        design.island?.included
      ),

    wants_display_cabinets:
      design.modules?.some(
        (module) =>
          cleanString(
            module.name
          )
            .toLowerCase()
            .includes("witryn")
      ) ?? null,

    wants_blum:
      (
        JSON.stringify(
          design
        )
          .toLowerCase()
          .includes("blum")
      )
        ? true
        : previousMemory
            ?.user_preferences
            ?.wants_blum ??
          null,
  };
}

export function createProjectMemory({
  design,
  roomAnalysis = "",
  roomData = {},
  previousMemory = null,
  correctionRequest = "",
  isCorrection = false,
}: CreateProjectMemoryOptions): ProjectMemory {

  const timestamp =
    nowIso();

  const previousVersion =
    Number(
      previousMemory
        ?.version_number ||
      0
    );

  const version =
    isCorrection
      ? Math.max(
          previousVersion + 1,
          2
        )
      : Math.max(
          previousVersion,
          1
        );

  const previousHistory =
    safeArray<ProjectChangeEntry>(
      previousMemory
        ?.change_history
    );

  const changedFields =
    detectChangedFields(
      previousMemory,
      design
    );

  const description =
    isCorrection
      ? cleanString(
          correctionRequest,
          "Wprowadzono poprawki do projektu."
        )
      : "Pierwsza wersja projektu.";

  const nextHistory =
    previousHistory.length > 0
      ? [
          ...previousHistory,
          {
            version,
            mode:
              isCorrection
                ? "correction"
                : "manual_update",
            description,
            created_at:
              timestamp,
            changed_fields:
              changedFields,
          } satisfies ProjectChangeEntry,
        ].slice(-50)
      : [
          createInitialHistoryEntry(),
        ];

  const previousProtected =
    previousMemory
      ?.protected_elements
      ? {
          ...DEFAULT_PROTECTED_ELEMENTS,
          ...previousMemory.protected_elements,
        }
      : {
          ...DEFAULT_PROTECTED_ELEMENTS,
        };

  const protectedElements =
    isCorrection
      ? updateProtectionRules(
          correctionRequest,
          previousProtected
        )
      : previousProtected;

  return {
    version_number:
      version,

    created_at:
      previousMemory
        ?.created_at ||
      timestamp,

    updated_at:
      timestamp,

    project_name:
      cleanString(
        design.project_name,
        previousMemory
          ?.project_name ||
        "Projekt kuchni"
      ),

    project_summary:
      cleanString(
        design.summary,
        previousMemory
          ?.project_summary ||
        ""
      ),

    layout:
      cleanString(
        design.layout,
        previousMemory
          ?.layout ||
        ""
      ),

    layout_reason:
      cleanString(
        design.layout_reason,
        previousMemory
          ?.layout_reason ||
        ""
      ),

    room: {
      analysis:
        cleanString(
          roomAnalysis,
          previousMemory
            ?.room
            ?.analysis ||
          ""
        ),

      walls:
        safeArray<unknown>(
          roomData.walls ??
          previousMemory
            ?.room
            ?.walls
        ),

      windows:
        Number(
          roomData.windows ??
          previousMemory
            ?.room
            ?.windows ??
          0
        ),

      doors:
        Number(
          roomData.doors ??
          previousMemory
            ?.room
            ?.doors ??
          0
        ),

      layout:
        cleanString(
          roomData.layout,
          previousMemory
            ?.room
            ?.layout ||
          ""
        ),

      estimated_size:
        cleanString(
          roomData.estimated_size,
          previousMemory
            ?.room
            ?.estimated_size ||
          ""
        ),

      has_island_space:
        Boolean(
          roomData.has_island_space ??
          previousMemory
            ?.room
            ?.has_island_space ??
          false
        ),

      kitchen_type:
        cleanString(
          roomData.kitchen_type,
          previousMemory
            ?.room
            ?.kitchen_type ||
          ""
        ),

      ergonomic_notes:
        safeArray<string>(
          roomData.ergonomic_notes ??
          previousMemory
            ?.room
            ?.ergonomic_notes
        ),
    },

    island:
      deepClone(
        design.island
      ),

    modules:
      deepClone(
        design.modules || []
      ),

    appliances:
      deepClone(
        design.appliances
      ),

    materials:
      deepClone(
        design.materials
      ),

    ergonomics:
      deepClone(
        design.ergonomics
      ),

    technical_notes:
      safeArray<string>(
        design.technical_notes
      ),

    render_description:
      cleanString(
        design.render_description,
        previousMemory
          ?.render_description ||
        ""
      ),

    protected_elements:
      protectedElements,

    last_correction:
      isCorrection
        ? cleanString(
            correctionRequest
          )
        : cleanString(
            previousMemory
              ?.last_correction
          ),

    change_history:
      nextHistory,

    user_preferences:
      extractUserPreferences(
        design,
        previousMemory
      ),
  };
}

export function mergeProjectMemory({
  previousMemory,
  nextDesign,
  roomAnalysis = "",
  roomData = {},
  correctionRequest = "",
  isCorrection = false,
}: MergeProjectMemoryOptions): ProjectMemory {

  return createProjectMemory({
    design:
      nextDesign,
    roomAnalysis,
    roomData,
    previousMemory:
      previousMemory || null,
    correctionRequest,
    isCorrection,
  });
}

export function getProjectVersion(
  memory:
    Partial<ProjectMemory> |
    null |
    undefined
): number {

  const version =
    Number(
      memory
        ?.version_number ||
      1
    );

  return Number.isFinite(
    version
  )
    ? Math.max(
        1,
        version
      )
    : 1;
}

export function getProjectChangeHistory(
  memory:
    Partial<ProjectMemory> |
    null |
    undefined
): ProjectChangeEntry[] {

  return safeArray<ProjectChangeEntry>(
    memory
      ?.change_history
  );
}

export function getProjectMemorySummary(
  memory:
    Partial<ProjectMemory> |
    null |
    undefined
): string {

  if (!memory) {
    return "Brak zapisanej pamięci projektu.";
  }

  const moduleCount =
    safeArray<KitchenModule>(
      memory.modules
    ).reduce(
      (
        total,
        module
      ) =>
        total +
        Number(
          module.quantity ||
          1
        ),
      0
    );

  return [
    `Wersja: v${getProjectVersion(memory)}`,
    `Układ: ${cleanString(memory.layout, "nie określono")}`,
    `Styl: ${cleanString(memory.materials?.style, "nie określono")}`,
    `Fronty: ${cleanString(memory.materials?.fronts, "nie określono")}`,
    `Blat: ${cleanString(memory.materials?.countertop, "nie określono")}`,
    `Liczba modułów: ${moduleCount}`,
    `Wyspa: ${memory.island?.included ? "tak" : "nie"}`,
    `Ostatnia poprawka: ${cleanString(memory.last_correction, "brak")}`,
  ].join("\n");
}

export function getProtectedElementsForPrompt(
  memory:
    Partial<ProjectMemory> |
    null |
    undefined
): string[] {

  const protection = {
    ...DEFAULT_PROTECTED_ELEMENTS,
    ...(
      memory
        ?.protected_elements ||
      {}
    ),
  };

  const labels:
    Record<
      keyof ProtectedProjectElements,
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

  return (
    Object.keys(
      protection
    ) as Array<
      keyof ProtectedProjectElements
    >
  )
    .filter(
      (key) =>
        protection[key]
    )
    .map(
      (key) =>
        labels[key]
    );
}

export function sanitizeProjectMemory(
  value: unknown
): Partial<ProjectMemory> {

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return {};
  }

  const cloned =
    deepClone(
      value
    ) as Record<
      string,
      unknown
    >;

  const cleanRecursive =
    (
      input: unknown
    ): unknown => {

      if (
        Array.isArray(
          input
        )
      ) {
        return input
          .map(
            cleanRecursive
          )
          .filter(
            (
              item
            ) =>
              item !==
              undefined
          );
      }

      if (
        input &&
        typeof input ===
          "object"
      ) {

        const result:
          Record<
            string,
            unknown
          > = {};

        for (
          const [
            key,
            item,
          ]
          of Object.entries(
            input
          )
        ) {

          const lowerKey =
            key.toLowerCase();

          if (
            lowerKey.includes(
              "generatedimage"
            ) ||
            lowerKey.includes(
              "previousimage"
            ) ||
            lowerKey.includes(
              "image_url"
            ) ||
            lowerKey ===
              "image" ||
            lowerKey ===
              "images"
          ) {
            continue;
          }

          const cleaned =
            cleanRecursive(
              item
            );

          if (
            cleaned !==
            undefined
          ) {
            result[key] =
              cleaned;
          }
        }

        return result;
      }

      if (
        typeof input ===
          "string"
      ) {

        if (
          input.startsWith(
            "data:image/"
          ) ||
          input.length >
            12000
        ) {
          return undefined;
        }

        return input;
      }

      return input;
    };

  return (
    cleanRecursive(
      cloned
    ) ||
    {}
  ) as Partial<ProjectMemory>;
}