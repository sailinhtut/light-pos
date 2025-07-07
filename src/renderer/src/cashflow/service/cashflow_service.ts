import { offlineMode } from "@renderer/utils/app_constants";
import CashflowLocalService from "./cashflow_local_service";
import CashflowNetworkService from "./cashflow_network_service";
import { Cashflow } from "../interface/cashflow";

class CashflowService {
  static service = offlineMode ? new CashflowLocalService() : new CashflowNetworkService();
  static async getCashflows(): Promise<Cashflow[]> {
    return await this.service.getCashflows();
  }

  static async getCashflow(cashflowId: string): Promise<Cashflow | undefined> {
    return await this.service.getCashflow(cashflowId);
  }

  static async addCashflow(cashflow: Cashflow): Promise<boolean> {
    return await this.service.addCashflow(cashflow);
  }

  static async updateCashflow(cashflow: Cashflow): Promise<boolean> {
    return await this.service.updateCashflow(cashflow);
  }
  static async deleteCashflow(cashflowId: string) {
    await this.service.deleteCashflow(cashflowId);
  }
  static async clearCashflow() {
    await this.service.clearCashflow();
  }
}

export default CashflowService;
