import { offlineMode } from "@renderer/utils/app_constants";
import { Unit } from "../interface/unit";
import UnitLocalService from "./unit_local_service";
import UnitNetworkService from "./unit_network_service";

class UnitService {
  static service = offlineMode ? new UnitLocalService() : new UnitNetworkService();
  static async getUnits(): Promise<Unit[]> {
    return await this.service.getUnits();
  }

  static async getUnit(unitId: string): Promise<Unit | undefined> {
    return await this.service.getUnit(unitId);
  }

  static async addUnit(unit: Unit): Promise<boolean> {
    return await this.service.addUnit(unit);
  }

  static async updateUnit(unit: Unit): Promise<boolean> {
    return await this.service.updateUnit(unit);
  }
  static async deleteUnit(unitId: string) {
    await this.service.deleteUnit(unitId);
  }
  static async clearUnit() {
    await this.service.clearUnit();
  }
}

export default UnitService;
