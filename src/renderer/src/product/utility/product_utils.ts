import { Unit } from "../interface/unit";

export function extractUnitName(units: Unit[], unitId: string) {
  const matched = units.find((e) => e.unitId === unitId);
  return matched?.unitName ?? "Pcs";
}
