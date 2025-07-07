import { firebaseFirestore } from "@renderer/firebase";
import { Customer, decodeCustomerJson, encodeCustomerJson } from "../interface/customer";
import { firebaseCollectionRemove } from "@renderer/app/view/clear_data_page";
import { noConnection } from "@renderer/utils/general_utils";
import CustomerLocalService from "./customer_local_service";

class CustomerNetworkService {
  customerCollection = "customers";
  customerLocalService = new CustomerLocalService();

  async getCustomers(): Promise<Customer[]> {
    if (navigator.onLine) {
      const snap = await firebaseFirestore.collection(this.customerCollection).get();
      if (snap.docs.length > 0) {
        const data = snap.docs.map((docSnap) => decodeCustomerJson(docSnap.data()));
        await this.customerLocalService.saveCustomers(data);
        return data;
      }
      return [];
    } else {
      return await this.customerLocalService.getCustomers();
    }
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    if (navigator.onLine) {
      const docSnap = await firebaseFirestore
        .collection(this.customerCollection)
        .doc(customerId)
        .get();
      if (docSnap.exists && docSnap.data()) {
        const data = decodeCustomerJson(docSnap.data()!);
        return data;
      }
      return undefined;
    } else {
      const savedOfflineCustomers = await this.customerLocalService.getCustomers();
      return savedOfflineCustomers.find((e) => e.customerId === customerId);
    }
  }

  async addCustomer(customer: Customer): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.customerCollection)
      .doc(customer.customerId)
      .set(encodeCustomerJson(customer));
    return true;
  }

  async updateCustomer(customer: Customer): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.customerCollection)
      .doc(customer.customerId)
      .update(encodeCustomerJson(customer));
    return true;
  }

  async deleteCustomer(customerId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.customerCollection).doc(customerId).delete();
  }
  async clearCustomer() {
    if (noConnection()) return;
    await firebaseCollectionRemove(this.customerCollection);
  }
}

export default CustomerNetworkService;
