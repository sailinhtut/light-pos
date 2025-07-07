import { offlineMode } from "@renderer/utils/app_constants";
import { OrderHistory } from "../interface/order_history";
import OrderHistoryLocalService from "./order_active_local_service";
import OrderHistoryNetworkService from "./order_active_network_service";

export default class OrderActiveService {
  static service = offlineMode ? new OrderHistoryLocalService() : new OrderHistoryNetworkService();
  static async getOrderHistories(): Promise<OrderHistory[]> {
    return await this.service.getOrderHistories();
  }

  static async getOrderHistory(orderHistoryId: string): Promise<OrderHistory | undefined> {
    return await this.service.getOrderHistory(orderHistoryId);
  }

  static async addOrderHistory(orderHistory: OrderHistory) {
    await this.service.addOrderHistory(orderHistory);
  }

  static async updateOrderHistory(orderHistory: OrderHistory) {
    await this.service.updateOrderHistory(orderHistory);
  }
  static async deleteOrderHistory(orderHistoryId: string) {
    await this.service.deleteOrderHistory(orderHistoryId);
  }

 
}
