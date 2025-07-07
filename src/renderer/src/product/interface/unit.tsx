export interface Unit {
  unitId: string;
  unitName: string;
  convertion: object | null;
}

export function encodeUnitJson(unit: Unit) {
  return {
    unitId: unit.unitId,
    unitName: unit.unitName,
    convertion: unit.convertion
  };
}

export function decodeUnitJson(json: object): Unit {
  const data = json as Unit;
  return {
    unitId: data.unitId,
    unitName: data.unitName,
    convertion: data.convertion
  };
}
