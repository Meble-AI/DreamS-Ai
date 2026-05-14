import { pricing } from "./pricing";

export function calculateKitchenPrice(data: any) {

  let total =
    data.meters * pricing.basePricePerMeter;

  if (data.front === "akryl") {
    total += pricing.fronts.akryl;
  }

  if (data.front === "lakier") {
    total += pricing.fronts.lakier;
  }

  if (data.blum) {
    total += pricing.accessories.blum;
  }

  if (data.led) {
    total += pricing.accessories.led;
  }

  if (data.cargo) {
    total += pricing.accessories.cargo;
  }

  return total;
}