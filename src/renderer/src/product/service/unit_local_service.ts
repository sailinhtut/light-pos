import Dexie, { Table } from "dexie";
import { Unit, decodeUnitJson } from "../interface/unit";

class UnitDatabase extends Dexie {
  units!: Table<Unit, string>;
  constructor() {
    super("unit_data");
    this.version(1).stores({
      units: "unitId,unitName,convertion"
    });
  }
}

class UnitLocalService {
  db = new UnitDatabase();

  async getUnits(): Promise<Unit[]> {
    const data = await this.db.units.toArray();
    const decoded = data.map((element) => decodeUnitJson(element));
    return decoded;
  }

  async getUnit(unitId: string): Promise<Unit | undefined> {
    const data = await this.db.units.get(unitId);
    return data;
  }

  async saveUnits(categories: Unit[]) {
    await this.clearUnit();
    categories.forEach(async (e) => {
      await this.updateUnit(e);
    });
  }

  async addUnit(unit: Unit): Promise<boolean> {
    await this.db.units.add(unit, unit.unitId);
    return true;
  }

  async updateUnit(unit: Unit): Promise<boolean> {
    await this.db.units.update(unit.unitId, { ...unit });
    return true;
  }
  async deleteUnit(unitId: string) {
    await this.db.units.delete(unitId);
  }

  async clearUnit() {
    await this.db.units.clear();
  }
}

export default UnitLocalService;
