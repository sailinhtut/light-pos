import { firebaseFirestore } from "@renderer/firebase";
import { Cashflow, decodeCashflowJson, encodeCashflowJson } from "../interface/cashflow";
import { firebaseCollectionRemove } from "@renderer/app/view/clear_data_page";
import { noConnection } from "@renderer/utils/general_utils";

class CashflowNetworkService {
  cashflowCollection = "daily_cash";

  async getCashflows(): Promise<Cashflow[]> {
    if (noConnection()) return [];
    const snap = await firebaseFirestore.collection(this.cashflowCollection).get();
    if (snap.docs.length > 0) {
      const data = snap.docs.map((docSnap) => decodeCashflowJson(docSnap.data()));
      return data;
    }
    return [];
  }

  async getCashflow(cashflowId: string): Promise<Cashflow | undefined> {
    if (noConnection()) return undefined;
    const docSnap = await firebaseFirestore
      .collection(this.cashflowCollection)
      .doc(cashflowId)
      .get();
    if (docSnap.exists && docSnap.data()) {
      const data = decodeCashflowJson(docSnap.data()!);
      return data;
    }
    return undefined;
  }

  async addCashflow(cashflow: Cashflow): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.cashflowCollection)
      .doc(cashflow.cashflowId)
      .set(encodeCashflowJson(cashflow));
    return true;
  }

  async updateCashflow(cashflow: Cashflow): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.cashflowCollection)
      .doc(cashflow.cashflowId)
      .update(encodeCashflowJson(cashflow));
    return true;
  }

  async deleteCashflow(cashflowId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.cashflowCollection).doc(cashflowId).delete();
  }

  async clearCashflow() {
    if (noConnection()) return;
    await firebaseCollectionRemove(this.cashflowCollection);
  }
}

export default CashflowNetworkService;
