import { firebaseFirestore } from "@renderer/firebase";
import { Creditbook, decodeCreditbook, encodeCreditbook } from "../interface/credit_book";
import { firebaseCollectionRemove } from "@renderer/app/view/clear_data_page";
import { noConnection } from "@renderer/utils/general_utils";

class CreditbookNetworkService {
  creditBookCollection = "credits";

  async getCreditbooks(): Promise<Creditbook[]> {
    if (noConnection()) return [];
    const snap = await firebaseFirestore.collection(this.creditBookCollection).get();
    if (snap.docs.length > 0) {
      const data = snap.docs.map((docSnap) => decodeCreditbook(docSnap.data()));
      return data;
    }
    return [];
  }

  async getCreditbook(creditBookId: string): Promise<Creditbook | undefined> {
    if (noConnection()) return undefined;
    const docSnap = await firebaseFirestore
      .collection(this.creditBookCollection)
      .doc(creditBookId)
      .get();
    if (docSnap.exists && docSnap.data()) {
      const data = decodeCreditbook(docSnap.data()!);
      return data;
    }
    return undefined;
  }

  async addCreditbook(creditBook: Creditbook): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.creditBookCollection)
      .doc(creditBook.creditBookId)
      .set(encodeCreditbook(creditBook));
    return true;
  }

  async updateCreditbook(creditBook: Creditbook): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.creditBookCollection)
      .doc(creditBook.creditBookId)
      .set(encodeCreditbook(creditBook), { merge: true });
    return true;
  }

  async deleteCreditbook(creditBookId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.creditBookCollection).doc(creditBookId).delete();
  }

  async clearBooks() {
    if (noConnection()) return;
    await firebaseCollectionRemove(this.creditBookCollection);
  }
}

export default CreditbookNetworkService;
