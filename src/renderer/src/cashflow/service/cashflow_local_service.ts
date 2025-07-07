import Dexie, { Table } from "dexie";
import { Cashflow, decodeCashflowJson } from "../interface/cashflow";

class CashflowDatabase extends Dexie {
  cashflows!: Table<Cashflow, string>;
  constructor() {
    super("cashflow_data");
    this.version(1).stores({
      cashflows: "cashflowId,date,records"
    });
  }
}

class CashflowLocalService {
  db = new CashflowDatabase();

  async getCashflows(): Promise<Cashflow[]> {
    const data = await this.db.cashflows.toArray();
    const decoded = data.map((element) => decodeCashflowJson(element));
    return decoded;
  }

  async getCashflow(cashflowId: string): Promise<Cashflow | undefined> {
    const data = await this.db.cashflows.get(cashflowId);
    return data;
  }

  async saveCashflows(cashflows: Cashflow[]) {
    await this.clearCashflow();
    cashflows.forEach(async (e) => {
      await this.db.cashflows.add(e, e.cashflowId);
    });
  }

  async addCashflow(supplier: Cashflow): Promise<boolean> {
    await this.db.cashflows.add(supplier, supplier.cashflowId);
    return true;
  }

  async updateCashflow(supplier: Cashflow): Promise<boolean> {
    await this.db.cashflows.update(supplier.cashflowId, { ...supplier });
    return true;
  }
  async deleteCashflow(cashflowId: string) {
    await this.db.cashflows.delete(cashflowId);
  }
  async clearCashflow() {
    await this.db.cashflows.clear();
  }
}

export default CashflowLocalService;
