import { firebaseFirestore } from "@renderer/firebase";
import { Supplier, decodeSupplierJson, encodeSupplierJson } from "../interface/supplier";
import { firebaseCollectionRemove } from "@renderer/app/view/clear_data_page";
import { noConnection } from "@renderer/utils/general_utils";
import SupplierLocalService from "./supplier_local_service";
import { suppressDeprecationWarnings } from "moment";

class SupplierNetworkService {
  supplierCollection = "suppliers";
  supplierLocalService = new SupplierLocalService();
  async getSuppliers(): Promise<Supplier[]> {
    if (navigator.onLine) {
      const snap = await firebaseFirestore.collection(this.supplierCollection).get();
      if (snap.docs.length > 0) {
        const data = snap.docs.map((docSnap) => decodeSupplierJson(docSnap.data()));
        await this.supplierLocalService.saveSuppliers(data);
        return data;
      }
      return [];
    } else {
      return await this.supplierLocalService.getSuppliers();
    }
  }

  async getSupplier(supplierId: string): Promise<Supplier | undefined> {
    if (navigator.onLine) {
      const docSnap = await firebaseFirestore
        .collection(this.supplierCollection)
        .doc(supplierId)
        .get();
      if (docSnap.exists && docSnap.data()) {
        const data = decodeSupplierJson(docSnap.data()!);
        return data;
      }
      return undefined;
    } else {
      const savedOfflineSuppliers = await this.supplierLocalService.getSuppliers();
      return savedOfflineSuppliers.find((e) => e.supplierId === supplierId);
    }
  }

  async addSupplier(supplier: Supplier): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.supplierCollection)
      .doc(supplier.supplierId)
      .set(encodeSupplierJson(supplier));
    return true;
  }

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.supplierCollection)
      .doc(supplier.supplierId)
      .update(encodeSupplierJson(supplier));
    return true;
  }

  async deleteSupplier(supplierId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.supplierCollection).doc(supplierId).delete();
  }

  async clearSupplier() {
    if (noConnection()) return;
    await firebaseCollectionRemove(this.supplierCollection);
  }
}

export default SupplierNetworkService;
