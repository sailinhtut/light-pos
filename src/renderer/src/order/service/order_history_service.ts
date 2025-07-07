import { offlineMode } from "@renderer/utils/app_constants";
import { OrderHistory } from "../interface/order_history";
import OrderHistoryLocalService from "./order_history_local_service";
import OrderHistoryNetworkService from "./order_history_network_service";
import { dateRangeBetween, getTodayParsedID } from "@renderer/utils/general_utils";

export default class OrderHistoryService {
  static service = offlineMode ? new OrderHistoryLocalService() : new OrderHistoryNetworkService();
  static async getOrderHistories(dateId: string): Promise<OrderHistory[]> {
    return await this.service.getOrderHistories(dateId);
  }

  static async getOrderHistory(
    dateId: string,
    orderHistoryId: string
  ): Promise<OrderHistory | undefined> {
    return await this.service.getOrderHistory(dateId, orderHistoryId);
  }

  static async addOrderHistory(dateId: string, orderHistory: OrderHistory) {
    await this.service.addOrderHistory(dateId, orderHistory);
  }

  static async updateOrderHistory(dateId: string, orderHistory: OrderHistory) {
    await this.service.updateOrderHistory(dateId, orderHistory);
  }
  static async deleteOrderHistory(dateId: string, orderHistoryId: string) {
    await this.service.deleteOrderHistory(dateId, orderHistoryId);
  }

  static async getOrderBetween(
    from: Date,
    to: Date,
    onProgress?: (progress: number) => void
  ): Promise<OrderHistory[]> {
    const dataStore: OrderHistory[] = [];

    const dates = dateRangeBetween(from, to);
    let finishedCount = 0;

    for (let intervalDate of dates) {
      const orders = await this.getOrderHistories(getTodayParsedID(intervalDate));

      if (orders.length > 0) {
        dataStore.push(...orders);
      }
      finishedCount++;
      onProgress?.(finishedCount / dates.length);
    }

    return dataStore;
  }
}
