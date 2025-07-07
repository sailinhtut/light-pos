import { firebaseFirestore } from "@renderer/firebase";
import { OrderHistory } from "../interface/order_history";
import { noConnection } from "@renderer/utils/general_utils";
import OrderActiveLocalService from "./order_active_local_service";

export default class OrderActiveNetworkService {
  orderActiveCollection = "active_orders";
  orderActiveLocalService = new OrderActiveLocalService();

  async getOrderHistories(): Promise<OrderHistory[]> {
    if (noConnection()) return [];
    const snap = await firebaseFirestore.collection(this.orderActiveCollection).get();
    if (snap.docs.length > 0) {
      const data = snap.docs.map((docSnap) => OrderHistory.fromJson(docSnap.data()));
      return data;
    }
    return [];
  }

  async getOrderHistory(orderHistoryId: string): Promise<OrderHistory | undefined> {
    if (navigator.onLine) {
      const docSnap = await firebaseFirestore
        .collection(this.orderActiveCollection)
        .doc(orderHistoryId)
        .get();
      if (docSnap.exists && docSnap.data()) {
        const data = OrderHistory.fromJson(docSnap.data()!);
        return data;
      }
      return undefined;
    } else {
      return await this.orderActiveLocalService.getOrderHistory(orderHistoryId);
    }
  }

  async addOrderHistory(orderHistory: OrderHistory) {
    if (navigator.onLine) {
      await firebaseFirestore
        .collection(this.orderActiveCollection)
        .doc(orderHistory.orderId)
        .set(orderHistory.toJson());
    } else {
      await this.orderActiveLocalService.addOrderHistory(orderHistory);
    }
  }

  async updateOrderHistory(orderHistory: OrderHistory) {
    if (navigator.onLine) {
      await firebaseFirestore
        .collection(this.orderActiveCollection)
        .doc(orderHistory.orderId)
        .update(orderHistory.toJson());
    } else {
      await this.orderActiveLocalService.updateOrderHistory(orderHistory);
    }
  }

  async deleteOrderHistory(orderHistoryId: string) {
    if (navigator.onLine) {
      await firebaseFirestore.collection(this.orderActiveCollection).doc(orderHistoryId).delete();
    } else {
      await this.orderActiveLocalService.deleteOrderHistory(orderHistoryId);
    }
  }
}
