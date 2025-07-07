import Dexie, { Table } from "dexie";
import { OrderHistory, OrderHistoryInterface } from "../interface/order_history";

class OrderActiveDatabase extends Dexie {
  orders!: Table<OrderHistoryInterface, string>;
  constructor() {
    super("order_active_data");
    this.version(1).stores({
      orders:
        "orderId,casherName,casherId,customer,total,discount,tag,payAmount,warrantyMonth,amount,date,cooking,ready,creditBookId,paid,metaData,orders"
    });
  }
}

export default class OrderActiveLocalService {
  db = new OrderActiveDatabase().orders;

  async getOrderHistories(): Promise<OrderHistory[]> {
    const data = await this.db.toArray();
    const decoded = data.map((e) => OrderHistory.fromJson(e));
    return decoded;
  }

  async getOrderHistory(orderId: string): Promise<OrderHistory | undefined> {
    const data = await this.getOrderHistories();
    const matched = data.find((e) => e.orderId === orderId);
    return matched;
  }

  async addOrderHistory(order: OrderHistory) {
    await this.db.put(order.toJson());
  }

  async updateOrderHistory(order: OrderHistory) {
    await this.db.put(order.toJson());
  }
  async deleteOrderHistory(orderId: string) {
    await this.db.delete(orderId);
  }


}
