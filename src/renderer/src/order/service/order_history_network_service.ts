import { firebaseFirestore } from "@renderer/firebase";
import { OrderHistory } from "../interface/order_history";
import { noConnection } from "@renderer/utils/general_utils";

export default class OrderHistoryNetworkService {
  orderHistoryCollection = "order_histories";

  async getOrderHistories(orderId: string): Promise<OrderHistory[]> {
    if (noConnection()) return [];
    const snap = await firebaseFirestore
      .collection(this.orderHistoryCollection)
      .doc(orderId)
      .collection(this.orderHistoryCollection)
      .get();
    if (snap.docs.length > 0) {
      const data = snap.docs.map((docSnap) => OrderHistory.fromJson(docSnap.data()));
      return data;
    }
    return [];
  }

  async getOrderHistory(dateId: string, orderHistoryId: string): Promise<OrderHistory | undefined> {
    if (noConnection()) return undefined;
    const docSnap = await firebaseFirestore
      .collection(this.orderHistoryCollection)
      .doc(dateId)
      .collection(this.orderHistoryCollection)
      .doc(orderHistoryId)
      .get();
    if (docSnap.exists && docSnap.data()) {
      const data = OrderHistory.fromJson(docSnap.data()!);
      return data;
    }
    return undefined;
  }

  async addOrderHistory(dateId: string, orderHistory: OrderHistory) {
    if (noConnection()) return;
    await firebaseFirestore
      .collection(this.orderHistoryCollection)
      .doc(dateId)
      .collection(this.orderHistoryCollection)
      .doc(orderHistory.orderId)
      .set(orderHistory.toJson(), { merge: true });
  }

  async updateOrderHistory(dateId: string, orderHistory: OrderHistory) {
    if (noConnection()) return;
    await firebaseFirestore
      .collection(this.orderHistoryCollection)
      .doc(dateId)
      .collection(this.orderHistoryCollection)
      .doc(orderHistory.orderId)
      .update(orderHistory.toJson());
  }

  async deleteOrderHistory(dateId: string, orderHistoryId: string) {
    if (noConnection()) return;
    await firebaseFirestore
      .collection(this.orderHistoryCollection)
      .doc(dateId)
      .collection(this.orderHistoryCollection)
      .doc(orderHistoryId)
      .delete();
  }
}
