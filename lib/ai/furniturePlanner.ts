import type {
  KitchenDesign,
  KitchenModule,
} from "@/lib/ai/designKitchen";

import type {
  RoomAnalysisData,
} from "@/lib/ai/analyzeRoom";

export type PlannerWall = {
  id: string;
  length_mm: number | null;
  usable: boolean;
  notes: string;
};

export type PlannedFurnitureModule =
  KitchenModule & {
    position_mm: number | null;
    end_position_mm: number | null;
    sequence: number;
    calculated_width_mm: number | null;
    is_fixed_width: boolean;
    source:
      | "design"
      | "calculated"
      | "appliance"
      | "filler";
  };

export type WallPlanSummary = {
  wall_id: string;
  wall_length_mm: number | null;
  used_length_mm: number;
  remaining_mm: number | null;
  difference_mm: number | null;
  exact_fit: boolean;
  module_ids: string[];
};

export type FurniturePlannerIssue = {
  id: string;
  severity:
    | "info"
    | "warning"
    | "error";
  title: string;
  description: string;
  suggestion: string;
};

export type FurniturePlannerResult = {
  success: boolean;
  layout: string;
  walls: PlannerWall[];
  modules: PlannedFurnitureModule[];
  wallSummaries: WallPlanSummary[];
  issues: FurniturePlannerIssue[];
  summary: string;
};

type FurniturePlannerOptions = {
  design: KitchenDesign;
  room: RoomAnalysisData;

  settings?: {
    board_thickness_mm?: number;
    left_filler_mm?: number;
    right_filler_mm?: number;
    minimum_custom_cabinet_width_mm?: number;
    maximum_custom_cabinet_width_mm?: number;
    minimum_passage_mm?: number;
  };
};

type PlannerSettings = {
  board_thickness_mm: number;
  left_filler_mm: number;
  right_filler_mm: number;
  minimum_custom_cabinet_width_mm: number;
  maximum_custom_cabinet_width_mm: number;
  minimum_passage_mm: number;
};

type WorkingModule = KitchenModule & {
  original_index: number;
  fixed_width: boolean;
  preferred_width_mm: number | null;
  minimum_width_mm: number;
  maximum_width_mm: number;
  planner_source:
    | "design"
    | "calculated"
    | "appliance";
};

const DEFAULT_SETTINGS: PlannerSettings = {
  board_thickness_mm: 18,
  left_filler_mm: 20,
  right_filler_mm: 20,
  minimum_custom_cabinet_width_mm: 250,
  maximum_custom_cabinet_width_mm: 1200,
  minimum_passage_mm: 900,
};

const STANDARD_BASE_HEIGHT_MM = 720;
const STANDARD_BASE_DEPTH_MM = 560;
const STANDARD_TALL_HEIGHT_MM = 2200;
const STANDARD_TALL_DEPTH_MM = 580;
const STANDARD_WALL_HEIGHT_MM = 720;
const STANDARD_WALL_DEPTH_MM = 320;
const STANDARD_ISLAND_HEIGHT_MM = 900;
const STANDARD_ISLAND_DEPTH_MM = 900;

function cleanText(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWallId(
  value: unknown,
  fallback = "A"
): string {
  const text =
    cleanText(
      value
    )
      .toUpperCase();

  if (
    ["A", "B", "C", "D"].includes(
      text
    )
  ) {
    return text;
  }

  return fallback;
}

function safeNumber(
  value: unknown
): number | null {
  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return null;
  }

  return Math.round(
    numeric
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value
    )
  );
}

function inferCategoryDimensions(
  module: KitchenModule
) {
  if (
    module.category ===
      "wysoka_zabudowa" ||
    module.category ===
      "agd"
  ) {
    return {
      height:
        module.height_mm ??
        STANDARD_TALL_HEIGHT_MM,

      depth:
        module.depth_mm ??
        STANDARD_TALL_DEPTH_MM,
    };
  }

  if (
    module.category ===
      "wiszaca"
  ) {
    return {
      height:
        module.height_mm ??
        STANDARD_WALL_HEIGHT_MM,

      depth:
        module.depth_mm ??
        STANDARD_WALL_DEPTH_MM,
    };
  }

  if (
    module.category ===
      "wyspa"
  ) {
    return {
      height:
        module.height_mm ??
        STANDARD_ISLAND_HEIGHT_MM,

      depth:
        module.depth_mm ??
        STANDARD_ISLAND_DEPTH_MM,
    };
  }

  return {
    height:
      module.height_mm ??
      STANDARD_BASE_HEIGHT_MM,

    depth:
      module.depth_mm ??
      STANDARD_BASE_DEPTH_MM,
  };
}

function getModuleText(
  module: KitchenModule
): string {
  return [
    module.name,
    module.function,
    module.notes,
    module.category,
  ]
    .join(" ")
    .toLowerCase();
}

function isApplianceModule(
  module: KitchenModule
): boolean {
  const text =
    getModuleText(
      module
    );

  return (
    module.category ===
      "agd" ||
    text.includes("lodów") ||
    text.includes("zmywark") ||
    text.includes("piekarnik") ||
    text.includes("płyta") ||
    text.includes("induk") ||
    text.includes("ekspres") ||
    text.includes("mikrofala")
  );
}

function isCargoModule(
  module: KitchenModule
): boolean {
  return getModuleText(
    module
  ).includes(
    "cargo"
  );
}

function isCornerModule(
  module: KitchenModule
): boolean {
  const text =
    getModuleText(
      module
    );

  return (
    module.category ===
      "narozna" ||
    text.includes("lemans") ||
    text.includes("naroż") ||
    text.includes("naroz")
  );
}

function isFillerModule(
  module: KitchenModule
): boolean {
  const text =
    getModuleText(
      module
    );

  return (
    text.includes("blenda") ||
    text.includes("filler")
  );
}

function isDecorativeModule(
  module: KitchenModule
): boolean {
  return (
    module.category ===
      "dekoracyjna" ||
    getModuleText(
      module
    ).includes("panel")
  );
}

function isFixedWidthModule(
  module: KitchenModule
): boolean {
  return (
    isApplianceModule(
      module
    ) ||
    isCargoModule(
      module
    ) ||
    isCornerModule(
      module
    ) ||
    isFillerModule(
      module
    ) ||
    isDecorativeModule(
      module
    )
  );
}

function inferFixedWidth(
  module: KitchenModule
): number | null {
  const explicit =
    safeNumber(
      module.width_mm
    );

  if (
    explicit &&
    explicit > 0
  ) {
    return explicit;
  }

  const text =
    getModuleText(
      module
    );

  if (
    text.includes("lodów")
  ) {
    return 600;
  }

  if (
    text.includes("zmywark")
  ) {
    return 600;
  }

  if (
    text.includes("piekarnik") ||
    text.includes("ekspres") ||
    text.includes("mikrofala")
  ) {
    return 600;
  }

  if (
    text.includes("płyta") ||
    text.includes("induk")
  ) {
    return 600;
  }

  if (
    text.includes("cargo")
  ) {
    const cargoWidths = [
      150,
      200,
      250,
      275,
      300,
      400,
      450,
      500,
      600,
    ];

    for (
      const width
      of cargoWidths
    ) {
      if (
        text.includes(
          String(width)
        )
      ) {
        return width;
      }
    }

    return 300;
  }

  if (
    text.includes("lemans")
  ) {
    return 1000;
  }

  return null;
}

function inferCustomWidthLimits(
  module: KitchenModule,
  settings: PlannerSettings
) {
  const text =
    getModuleText(
      module
    );

  if (
    module.category ===
      "wiszaca"
  ) {
    return {
      minimum:
        200,
      maximum:
        1400,
    };
  }

  if (
    text.includes("szuflad")
  ) {
    return {
      minimum:
        300,
      maximum:
        1200,
    };
  }

  if (
    text.includes("zlew")
  ) {
    return {
      minimum:
        450,
      maximum:
        1200,
    };
  }

  return {
    minimum:
      settings.minimum_custom_cabinet_width_mm,
    maximum:
      settings.maximum_custom_cabinet_width_mm,
  };
}

function normalizeModule(
  module: KitchenModule,
  index: number,
  settings: PlannerSettings
): WorkingModule {
  const dimensions =
    inferCategoryDimensions(
      module
    );

  const fixedWidth =
    isFixedWidthModule(
      module
    );

  const explicitWidth =
    safeNumber(
      module.width_mm
    );

  const fixedValue =
    fixedWidth
      ? inferFixedWidth(
          module
        )
      : null;

  const limits =
    inferCustomWidthLimits(
      module,
      settings
    );

  return {
    ...module,

    id:
      cleanText(
        module.id
      ) ||
      `M${index + 1}`,

    name:
      cleanText(
        module.name
      ) ||
      `Moduł ${index + 1}`,

    width_mm:
      fixedWidth
        ? fixedValue
        : explicitWidth,

    height_mm:
      dimensions.height,

    depth_mm:
      dimensions.depth,

    quantity:
      Math.max(
        1,
        Number(
          module.quantity || 1
        )
      ),

    wall:
      module.category ===
        "wyspa"
        ? null
        : normalizeWallId(
            module.wall,
            "A"
          ),

    function:
      cleanText(
        module.function
      ),

    notes:
      cleanText(
        module.notes
      ),

    original_index:
      index,

    fixed_width:
      fixedWidth,

    preferred_width_mm:
      fixedWidth
        ? fixedValue
        : explicitWidth,

    minimum_width_mm:
      fixedWidth
        ? fixedValue || 0
        : limits.minimum,

    maximum_width_mm:
      fixedWidth
        ? fixedValue ||
          limits.maximum
        : limits.maximum,

    planner_source:
      fixedWidth
        ? isApplianceModule(module)
          ? "appliance"
          : "design"
        : "calculated",
  };
}

function extractWallLength(
  wall: unknown
): number | null {
  if (
    typeof wall ===
      "number" &&
    Number.isFinite(
      wall
    )
  ) {
    return Math.round(
      wall
    );
  }

  if (
    wall &&
    typeof wall ===
      "object"
  ) {
    const object =
      wall as Record<
        string,
        unknown
      >;

    const directMillimeterCandidates = [
      object.length_mm,
      object.width_mm,
      object.estimated_width_mm,
    ];

    for (
      const candidate
      of directMillimeterCandidates
    ) {
      const numeric =
        safeNumber(
          candidate
        );

      if (
        numeric &&
        numeric > 0
      ) {
        return numeric;
      }
    }

    const centimeterCandidates = [
      object.estimated_width_cm,
      object.length_cm,
      object.width_cm,
    ];

    for (
      const candidate
      of centimeterCandidates
    ) {
      const numeric =
        safeNumber(
          candidate
        );

      if (
        numeric &&
        numeric > 0
      ) {
        return numeric * 10;
      }
    }

    const genericCandidates = [
      object.length,
      object.width,
    ];

    for (
      const candidate
      of genericCandidates
    ) {
      const numeric =
        safeNumber(
          candidate
        );

      if (
        numeric &&
        numeric > 0
      ) {
        return numeric <= 1000
          ? numeric * 10
          : numeric;
      }
    }
  }

  return null;
}

function createWalls(
  room:
    RoomAnalysisData
): PlannerWall[] {
  const sourceWalls =
    Array.isArray(
      room.roomData.walls
    )
      ? room.roomData.walls
      : [];

  const walls:
    PlannerWall[] = [];

  sourceWalls.forEach(
    (
      wall,
      index
    ) => {
      const object =
        wall &&
        typeof wall ===
          "object"
          ? wall as Record<
              string,
              unknown
            >
          : {};

      walls.push({
        id:
          normalizeWallId(
            object.id,
            ["A", "B", "C", "D"][index] ||
            `W${index + 1}`
          ),

        length_mm:
          extractWallLength(
            wall
          ),

        usable:
          object.usable_for_furniture !==
            false,

        notes:
          cleanText(
            object.description ||
            object.notes ||
            ""
          ),
      });
    }
  );

  if (
    walls.length === 0
  ) {
    walls.push(
      {
        id:
          "A",
        length_mm:
          null,
        usable:
          true,
        notes:
          "Główna ściana zabudowy.",
      },
      {
        id:
          "B",
        length_mm:
          null,
        usable:
          room.roomData.layout
            .toLowerCase()
            .includes("l") ||
          room.roomData.layout
            .toLowerCase()
            .includes("u"),
        notes:
          "Druga ściana zabudowy.",
      }
    );
  }

  return walls;
}

function addIssue(
  issues:
    FurniturePlannerIssue[],
  issue:
    FurniturePlannerIssue
) {
  if (
    issues.some(
      (
        existing
      ) =>
        existing.id ===
        issue.id
    )
  ) {
    return;
  }

  issues.push(
    issue
  );
}

function expandQuantities(
  modules:
    WorkingModule[]
): WorkingModule[] {
  const expanded:
    WorkingModule[] = [];

  modules.forEach(
    (
      module
    ) => {
      const quantity =
        Math.max(
          1,
          Number(
            module.quantity ||
            1
          )
        );

      for (
        let index = 0;
        index < quantity;
        index += 1
      ) {
        expanded.push({
          ...module,

          id:
            quantity > 1
              ? `${module.id}-${index + 1}`
              : module.id,

          quantity:
            1,
        });
      }
    }
  );

  return expanded;
}

function prioritizeModules(
  modules:
    WorkingModule[]
): WorkingModule[] {
  const priority = (
    module:
      WorkingModule
  ) => {
    const text =
      getModuleText(
        module
      );

    if (
      text.includes(
        "lodów"
      )
    ) {
      return 10;
    }

    if (
      text.includes(
        "cargo"
      )
    ) {
      return 20;
    }

    if (
      module.category ===
        "wysoka_zabudowa"
    ) {
      return 25;
    }

    if (
      text.includes(
        "zlew"
      )
    ) {
      return 40;
    }

    if (
      text.includes(
        "zmywark"
      )
    ) {
      return 45;
    }

    if (
      module.category ===
        "narozna"
    ) {
      return 50;
    }

    if (
      text.includes(
        "płyta"
      ) ||
      text.includes(
        "induk"
      )
    ) {
      return 70;
    }

    if (
      text.includes(
        "piekarnik"
      )
    ) {
      return 75;
    }

    return 60;
  };

  return [
    ...modules,
  ].sort(
    (
      first,
      second
    ) =>
      priority(first) -
      priority(second)
  );
}

function createFillerModule(
  id: string,
  name: string,
  wall: string,
  width: number
): WorkingModule {
  return {
    id,
    category:
      "dekoracyjna",
    name,
    width_mm:
      width,
    height_mm:
      STANDARD_TALL_HEIGHT_MM,
    depth_mm:
      STANDARD_TALL_DEPTH_MM,
    quantity:
      1,
    wall,
    function:
      "Blenda montażowa",
    notes:
      "Element dopasowany do rzeczywistego wymiaru ściany.",
    original_index:
      -1,
    fixed_width:
      true,
    preferred_width_mm:
      width,
    minimum_width_mm:
      width,
    maximum_width_mm:
      width,
    planner_source:
      "design",
  };
}

function distributeExactWidth(
  modules:
    WorkingModule[],
  targetWidth:
    number,
  issues:
    FurniturePlannerIssue[],
  wallId:
    string
): WorkingModule[] {
  const fixedModules =
    modules.filter(
      (
        module
      ) =>
        module.fixed_width
    );

  const flexibleModules =
    modules.filter(
      (
        module
      ) =>
        !module.fixed_width
    );

  const fixedTotal =
    fixedModules.reduce(
      (
        sum,
        module
      ) =>
        sum +
        (
          module.width_mm ||
          0
        ),
      0
    );

  const remaining =
    targetWidth -
    fixedTotal;

  if (
    remaining < 0
  ) {
    addIssue(
      issues,
      {
        id:
          `negative-space-${wallId}`,
        severity:
          "error",
        title:
          "Stałe elementy są szersze niż ściana",
        description:
          `Na ścianie ${wallId} stałe elementy zajmują ${fixedTotal} mm, a dostępne jest ${targetWidth} mm.`,
        suggestion:
          "Usuń element, zmniejsz cargo, przenieś AGD na inną ścianę albo zmień układ.",
      }
    );

    return modules;
  }

  if (
    flexibleModules.length === 0
  ) {
    if (
      remaining > 0
    ) {
      addIssue(
        issues,
        {
          id:
            `unused-space-${wallId}`,
          severity:
            "warning",
          title:
            "Pozostało niewykorzystane miejsce",
          description:
            `Na ścianie ${wallId} pozostało ${remaining} mm.`,
          suggestion:
            "Dodaj szafkę wykonywaną na wymiar lub zwiększ blendę.",
        }
      );
    }

    return modules;
  }

  const preferredTotal =
    flexibleModules.reduce(
      (
        sum,
        module
      ) =>
        sum +
        (
          module.preferred_width_mm ||
          0
        ),
      0
    );

  let calculatedWidths:
    number[];

  if (
    preferredTotal > 0
  ) {
    calculatedWidths =
      flexibleModules.map(
        (
          module
        ) => {
          const ratio =
            (
              module.preferred_width_mm ||
              1
            ) /
            preferredTotal;

          return clamp(
            Math.floor(
              remaining *
              ratio
            ),
            module.minimum_width_mm,
            module.maximum_width_mm
          );
        }
      );
  } else {
    const baseWidth =
      Math.floor(
        remaining /
        flexibleModules.length
      );

    calculatedWidths =
      flexibleModules.map(
        (
          module
        ) =>
          clamp(
            baseWidth,
            module.minimum_width_mm,
            module.maximum_width_mm
          )
      );
  }

  let currentTotal =
    calculatedWidths.reduce(
      (
        sum,
        width
      ) =>
        sum +
        width,
      0
    );

  let difference =
    remaining -
    currentTotal;

  let guard =
    0;

  while (
    difference !== 0 &&
    guard < 100000
  ) {
    guard += 1;

    let changed =
      false;

    for (
      let index = 0;
      index <
        flexibleModules.length;
      index += 1
    ) {
      const module =
        flexibleModules[index];

      if (
        difference > 0 &&
        calculatedWidths[index] <
          module.maximum_width_mm
      ) {
        calculatedWidths[index] += 1;
        difference -= 1;
        changed = true;
      } else if (
        difference < 0 &&
        calculatedWidths[index] >
          module.minimum_width_mm
      ) {
        calculatedWidths[index] -= 1;
        difference += 1;
        changed = true;
      }

      if (
        difference === 0
      ) {
        break;
      }
    }

    if (!changed) {
      break;
    }
  }

  if (
    difference !== 0
  ) {
    addIssue(
      issues,
      {
        id:
          `distribution-failed-${wallId}`,
        severity:
          "error",
        title:
          "Nie udało się rozdzielić wymiaru co do 1 mm",
        description:
          `Na ścianie ${wallId} pozostała różnica ${difference} mm.`,
        suggestion:
          "Zmień minimalne lub maksymalne szerokości szafek albo zmień liczbę modułów.",
      }
    );
  }

  let flexibleIndex =
    0;

  return modules.map(
    (
      module
    ) => {
      if (
        module.fixed_width
      ) {
        return module;
      }

      const width =
        calculatedWidths[
          flexibleIndex
        ];

      flexibleIndex += 1;

      return {
        ...module,

        width_mm:
          width,

        preferred_width_mm:
          width,

        planner_source:
          "calculated",
      };
    }
  );
}

function prepareModulesForWall(
  modules:
    WorkingModule[],
  wall:
    PlannerWall,
  settings:
    PlannerSettings,
  issues:
    FurniturePlannerIssue[]
): WorkingModule[] {
  if (
    wall.length_mm === null
  ) {
    addIssue(
      issues,
      {
        id:
          `unknown-wall-${wall.id}`,
        severity:
          "warning",
        title:
          "Brak dokładnej długości ściany",
        description:
          `Ściana ${wall.id} nie ma dokładnego wymiaru.`,
        suggestion:
          "Podaj długość ściany w milimetrach, aby planner mógł rozdzielić zabudowę co do 1 mm.",
      }
    );

    return modules;
  }

  const leftFiller =
    createFillerModule(
      `FILLER-${wall.id}-L`,
      "Blenda lewa",
      wall.id,
      settings.left_filler_mm
    );

  const rightFiller =
    createFillerModule(
      `FILLER-${wall.id}-R`,
      "Blenda prawa",
      wall.id,
      settings.right_filler_mm
    );

  const availableForCabinets =
    wall.length_mm -
    settings.left_filler_mm -
    settings.right_filler_mm;

  if (
    availableForCabinets <= 0
  ) {
    addIssue(
      issues,
      {
        id:
          `invalid-wall-space-${wall.id}`,
        severity:
          "error",
        title:
          "Blendy zajmują całą ścianę",
        description:
          `Po odjęciu blend na ścianie ${wall.id} nie pozostaje miejsce na zabudowę.`,
        suggestion:
          "Zmniejsz blendy lub popraw wymiar ściany.",
      }
    );

    return modules;
  }

  const distributed =
    distributeExactWidth(
      modules,
      availableForCabinets,
      issues,
      wall.id
    );

  return [
    leftFiller,
    ...distributed,
    rightFiller,
  ];
}

function placeModulesOnWalls(
  modules:
    WorkingModule[],
  walls:
    PlannerWall[],
  settings:
    PlannerSettings,
  issues:
    FurniturePlannerIssue[]
): PlannedFurnitureModule[] {
  const usableWalls =
    walls.filter(
      (
        wall
      ) =>
        wall.usable
    );

  const modulesByWall =
    new Map<
      string,
      WorkingModule[]
    >();

  for (
    const wall
    of usableWalls
  ) {
    modulesByWall.set(
      wall.id,
      []
    );
  }

  const islandModules =
    modules.filter(
      (
        module
      ) =>
        module.category ===
        "wyspa"
    );

  const wallModules =
    modules.filter(
      (
        module
      ) =>
        module.category !==
        "wyspa"
    );

  wallModules.forEach(
    (
      module
    ) => {
      const preferredWall =
        module.wall &&
        modulesByWall.has(
          module.wall
        )
          ? module.wall
          : usableWalls[0]
            ?.id ||
            "A";

      const collection =
        modulesByWall.get(
          preferredWall
        ) ||
        [];

      collection.push(
        module
      );

      modulesByWall.set(
        preferredWall,
        collection
      );
    }
  );

  const planned:
    PlannedFurnitureModule[] = [];

  let sequence =
    1;

  for (
    const wall
    of usableWalls
  ) {
    const wallModulesForPlanning =
      prioritizeModules(
        modulesByWall.get(
          wall.id
        ) ||
        []
      );

    if (
      wallModulesForPlanning.length ===
      0
    ) {
      continue;
    }

    const prepared =
      prepareModulesForWall(
        wallModulesForPlanning,
        wall,
        settings,
        issues
      );

    let offset =
      0;

    prepared.forEach(
      (
        module
      ) => {
        const width =
          module.width_mm ||
          0;

        const start =
          offset;

        const end =
          start +
          width;

        planned.push({
          ...module,

          wall:
            wall.id,

          position_mm:
            start,

          end_position_mm:
            end,

          sequence:
            sequence++,

          calculated_width_mm:
            width,

          is_fixed_width:
            module.fixed_width,

          source:
            isFillerModule(
              module
            )
              ? "filler"
              : module.planner_source,
        });

        offset =
          end;
      }
    );

    if (
      wall.length_mm !== null &&
      offset !==
        wall.length_mm
    ) {
      addIssue(
        issues,
        {
          id:
            `exact-fit-${wall.id}`,
          severity:
            "error",
          title:
            "Suma nie zgadza się z długością ściany",
          description:
            `Ściana ${wall.id}: suma elementów ${offset} mm, wymiar ściany ${wall.length_mm} mm, różnica ${wall.length_mm - offset} mm.`,
          suggestion:
            "Sprawdź ograniczenia szerokości szafek i wartości blend.",
        }
      );
    }
  }

  islandModules.forEach(
    (
      module
    ) => {
      planned.push({
        ...module,

        position_mm:
          null,

        end_position_mm:
          null,

        sequence:
          sequence++,

        calculated_width_mm:
          module.width_mm,

        is_fixed_width:
          module.fixed_width,

        source:
          module.planner_source,
      });
    }
  );

  return planned;
}

function validatePlannerLogic(
  design:
    KitchenDesign,
  modules:
    PlannedFurnitureModule[],
  settings:
    PlannerSettings,
  issues:
    FurniturePlannerIssue[]
) {
  const countByTerm = (
    term:
      string
  ) =>
    modules.filter(
      (
        module
      ) =>
        `${module.name} ${module.function}`
          .toLowerCase()
          .includes(
            term
          )
    ).length;

  const refrigeratorCount =
    countByTerm(
      "lodów"
    );

  const sinkCount =
    countByTerm(
      "zlew"
    );

  const hobCount =
    modules.filter(
      (
        module
      ) => {
        const text =
          `${module.name} ${module.function}`
            .toLowerCase();

        return (
          text.includes(
            "płyta"
          ) ||
          text.includes(
            "induk"
          )
        );
      }
    ).length;

  if (
    refrigeratorCount === 0
  ) {
    addIssue(
      issues,
      {
        id:
          "planner-missing-fridge",
        severity:
          "error",
        title:
          "Brak lodówki w planie",
        description:
          "Planner nie znalazł modułu lodówki.",
        suggestion:
          "Dodaj jedną lodówkę w zabudowie lub wolnostojącą.",
      }
    );
  }

  if (
    refrigeratorCount > 1
  ) {
    addIssue(
      issues,
      {
        id:
          "planner-duplicate-fridge",
        severity:
          "error",
        title:
          "Zdublowana lodówka",
        description:
          "Plan zawiera więcej niż jedną lodówkę.",
        suggestion:
          "Pozostaw dokładnie jedną lodówkę.",
      }
    );
  }

  if (
    sinkCount > 1
  ) {
    addIssue(
      issues,
      {
        id:
          "planner-duplicate-sink",
        severity:
          "error",
        title:
          "Zdublowany zlew",
        description:
          "Plan zawiera więcej niż jeden zlew.",
        suggestion:
          "Pozostaw dokładnie jeden zlew.",
      }
    );
  }

  if (
    hobCount > 1
  ) {
    addIssue(
      issues,
      {
        id:
          "planner-duplicate-hob",
        severity:
          "error",
        title:
          "Zdublowana płyta grzewcza",
        description:
          "Plan zawiera więcej niż jedną płytę grzewczą.",
        suggestion:
          "Pozostaw dokładnie jedną płytę grzewczą.",
      }
    );
  }

  const sinkModule =
    modules.find(
      (
        module
      ) =>
        `${module.name} ${module.function}`
          .toLowerCase()
          .includes(
            "zlew"
          )
    );

  const dishwasherModule =
    modules.find(
      (
        module
      ) =>
        `${module.name} ${module.function}`
          .toLowerCase()
          .includes(
            "zmywark"
          )
    );

  if (
    sinkModule &&
    dishwasherModule &&
    sinkModule.wall ===
      dishwasherModule.wall &&
    sinkModule.position_mm !==
      null &&
    dishwasherModule.position_mm !==
      null
  ) {
    const distance =
      Math.abs(
        sinkModule.position_mm -
        dishwasherModule.position_mm
      );

    if (
      distance >
      1200
    ) {
      addIssue(
        issues,
        {
          id:
            "dishwasher-distance",
          severity:
            "warning",
          title:
            "Zmywarka daleko od zlewu",
          description:
            `Odległość między zlewem a zmywarką wynosi około ${distance} mm.`,
          suggestion:
            "Przenieś zmywarkę bezpośrednio obok szafki zlewozmywakowej.",
        }
      );
    }
  }

  if (
    design.island?.included
  ) {
    const passages =
      design.ergonomics
        ?.passages ||
      [];

    if (
      passages.length ===
      0
    ) {
      addIssue(
        issues,
        {
          id:
            "island-no-passages",
          severity:
            "warning",
          title:
            "Brak wymiarów przejść przy wyspie",
          description:
            "Projekt zawiera wyspę, ale nie podaje szerokości przejść.",
          suggestion:
            `Zweryfikuj minimum ${settings.minimum_passage_mm} mm.`,
        }
      );
    }
  }
}

function createWallSummaries(
  walls:
    PlannerWall[],
  modules:
    PlannedFurnitureModule[]
): WallPlanSummary[] {
  return walls
    .filter(
      (
        wall
      ) =>
        wall.usable
    )
    .map(
      (
        wall
      ) => {
        const wallModules =
          modules.filter(
            (
              module
            ) =>
              module.wall ===
              wall.id
          );

        const used =
          wallModules.reduce(
            (
              sum,
              module
            ) =>
              sum +
              (
                module.calculated_width_mm ||
                0
              ),
            0
          );

        const remaining =
          wall.length_mm ===
            null
            ? null
            : wall.length_mm -
              used;

        return {
          wall_id:
            wall.id,

          wall_length_mm:
            wall.length_mm,

          used_length_mm:
            used,

          remaining_mm:
            remaining,

          difference_mm:
            remaining,

          exact_fit:
            wall.length_mm !==
              null &&
            remaining ===
              0,

          module_ids:
            wallModules.map(
              (
                module
              ) =>
                module.id
            ),
        };
      }
    );
}

function createSummary(
  modules:
    PlannedFurnitureModule[],
  wallSummaries:
    WallPlanSummary[],
  issues:
    FurniturePlannerIssue[]
): string {
  const errors =
    issues.filter(
      (
        issue
      ) =>
        issue.severity ===
        "error"
    ).length;

  const warnings =
    issues.filter(
      (
        issue
      ) =>
        issue.severity ===
        "warning"
    ).length;

  const exactWalls =
    wallSummaries.filter(
      (
        summary
      ) =>
        summary.exact_fit
    ).length;

  return `Planner rozmieścił ${modules.length} elementów. ${exactWalls}/${wallSummaries.length} ścian dopasowano z różnicą 0 mm. Wykryto ${errors} błędów i ${warnings} ostrzeżeń.`;
}

export function furniturePlanner({
  design,
  room,
  settings: rawSettings = {},
}: FurniturePlannerOptions): FurniturePlannerResult {
  const settings:
    PlannerSettings = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
    };

  const issues:
    FurniturePlannerIssue[] = [];

  const walls =
    createWalls(
      room
    );

  const normalizedModules =
    (
      design.modules ||
      []
    ).map(
      (
        module,
        index
      ) =>
        normalizeModule(
          module,
          index,
          settings
        )
    );

  const expandedModules =
    expandQuantities(
      normalizedModules
    );

  const plannedModules =
    placeModulesOnWalls(
      expandedModules,
      walls,
      settings,
      issues
    );

  validatePlannerLogic(
    design,
    plannedModules,
    settings,
    issues
  );

  const wallSummaries =
    createWallSummaries(
      walls,
      plannedModules
    );

  const errorCount =
    issues.filter(
      (
        issue
      ) =>
        issue.severity ===
        "error"
    ).length;

  const allKnownWallsExact =
    wallSummaries
      .filter(
        (
          summary
        ) =>
          summary.wall_length_mm !==
          null
      )
      .every(
        (
          summary
        ) =>
          summary.exact_fit
      );

  return {
    success:
      errorCount === 0 &&
      allKnownWallsExact,

    layout:
      cleanText(
        design.layout ||
        room.roomData.layout ||
        "do ustalenia"
      ),

    walls,

    modules:
      plannedModules,

    wallSummaries,

    issues,

    summary:
      createSummary(
        plannedModules,
        wallSummaries,
        issues
      ),
  };
}