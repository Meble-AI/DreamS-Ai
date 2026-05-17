export async function generateEstimate(
  kitchenData: any
) {

  let netto = 25000;

  const cabinets =
    kitchenData?.cabinets || [];

  cabinets.forEach(
    (cabinet: any) => {

      netto +=
        (cabinet.width || 600) * 8;

      if (
        cabinet.front
          ?.toLowerCase()
          .includes("akryl")
      ) {

        netto += 1200;
      }

      if (
        cabinet.type
          ?.toLowerCase()
          .includes("cargo")
      ) {

        netto += 2500;
      }
    }
  );

  if (
    kitchenData?.led
  ) {

    netto += 1200;
  }

  if (
    kitchenData?.premium
  ) {

    netto += 6000;
  }

  const brutto =
    Math.round(
      netto * 1.08
    );

  return {

    netto,
    brutto,
  };
}