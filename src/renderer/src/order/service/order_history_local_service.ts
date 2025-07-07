import Dexie, { Table } from "dexie";
import { OrderHistory, OrderHistoryInterface } from "../interface/order_history";

class OrderHistoryDatabase extends Dexie {
  // Table where each key is a custom generated key, and the value is a list of OrderHistory objects
  orderHistories!: Table<{ dateId: string; histories: OrderHistoryInterface[] }, string>;

  constructor() {
    super("order_history_data");
    this.version(1).stores({
      orderHistories: "dateId" // Use dateId as the key
    });
  }
}


export default class OrderHistoryLocalService {
  db = new OrderHistoryDatabase();

  // Fetch order histories for a specific date
  async getOrderHistories(dateId: string): Promise<OrderHistory[]> {
    const result = await this.db.orderHistories.get(dateId);
    if (result) {
      return result.histories.map((e: any) => OrderHistory.fromJson(e));
    } else {
      return [];
    }
  }

  // Fetch a specific order history by orderId
  async getOrderHistory(dateId: string, orderId: string): Promise<OrderHistory | undefined> {
    const orders = await this.getOrderHistories(dateId);
    return orders.find((e) => e.orderId === orderId);
  }

  // Add a new order history
  async addOrderHistory(dateId: string, order: OrderHistory) {
    let result = await this.db.orderHistories.get(dateId);
    if (result) {
      result.histories.push(order.toJson());
      await this.db.orderHistories.put(result, dateId);
    } else {
      await this.db.orderHistories.add({
        dateId: dateId,
        histories: [order.toJson()]
      });
    }
  }

  // Update an existing order history
  async updateOrderHistory(dateId: string, order: OrderHistory) {
    let result = await this.db.orderHistories.get(dateId);
    if (result) {
      const filtered = result.histories.filter((e: any) => e.orderId !== order.orderId);
      filtered.push(order.toJson());
      result.histories = filtered;
      await this.db.orderHistories.put(result, dateId);
    }
  }

  // Delete an order history
  async deleteOrderHistory(dateId: string, orderId: string) {
    let result = await this.db.orderHistories.get(dateId);
    if (result) {
      result.histories = result.histories.filter((e: any) => e.orderId !== orderId);
      await this.db.orderHistories.put(result, dateId);
    }
  }
}