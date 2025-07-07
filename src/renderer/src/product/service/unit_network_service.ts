import { firebaseFirestore } from "@renderer/firebase";
import { Unit, decodeUnitJson } from "../interface/unit";
import { useInRouterContext } from "react-router-dom";
import { noConnection } from "@renderer/utils/general_utils";
import UnitLocalService from "./unit_local_service";

class UnitNetworkService {
  unitLocalService = new UnitLocalService();
  async getUnits(): Promise<Unit[]> {
    if (navigator.onLine) {
      const docSnap = await firebaseFirestore.collection("order_meta").doc("unit_convertion").get();
      if (docSnap.exists) {
        const data = (await docSnap.data()) ?? {};
        const unitData = (data["units"] ?? []) as object[];
        const units = unitData.map((element) => decodeUnitJson(element));
        await this.unitLocalService.saveUnits(units);
        return units;
      }
      return [];
    } else {
      return await this.unitLocalService.getUnits();
    }
  }
  async getUnit(unitId: string): Promise<Unit | undefined> {
    if (navigator.onLine) {
      const units = await this.getUnits();
      const matchedUnit = units.find((element) => element.unitId === unitId);
      return matchedUnit;
    } else {
      const savedOfflieUntis = await this.unitLocalService.getUnits();
      return savedOfflieUntis.find((e) => e.unitId === unitId);
    }
  }

  async addUnit(unit: Unit): Promise<boolean> {
    if (noConnection()) return false;
    const units = await this.getUnits();
    units.push(unit);
    await firebaseFirestore.collection("order_meta").doc("unit_convertion").set({
      units: units
    });
    return true;
  }

  async updateUnit(unit: Unit): Promise<boolean> {
    if (noConnection()) return false;
    let units = (await this.getUnits()).filter((element) => element.unitId !== unit.unitId);
    units = [...units, unit];
    await firebaseFirestore.collection("order_meta").doc("unit_convertion").update({
      units: units
    });
    return true;
  }

  async deleteUnit(unitId: string) {
    if (noConnection()) return;
    let units = await this.getUnits();
    units = units.filter((element) => element.unitId !== unitId);
    await firebaseFirestore.collection("order_meta").doc("unit_convertion").set({
      units: units
    });
  }

  async clearUnit() {
    if (noConnection()) return;
    await firebaseFirestore.collection("order_meta").doc("unit_convertion").delete();
  }
}

export default UnitNetworkService;
