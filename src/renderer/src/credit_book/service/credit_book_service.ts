import { offlineMode } from "@renderer/utils/app_constants";
import CreditbookLocalService from "./credit_book_local_service";
import CreditbookNetworkService from "./credit_book_network_service";
import { Creditbook } from "../interface/credit_book";
import { OrderHistory } from "@renderer/order/interface/order_history";

class CreditbookService {
  static service = offlineMode ? new CreditbookLocalService() : new CreditbookNetworkService();
  static async getCreditbooks(): Promise<Creditbook[]> {
    return await this.service.getCreditbooks();
  }

  static async getCreditbook(creditBookId: string): Promise<Creditbook | undefined> {
    return await this.service.getCreditbook(creditBookId);
  }

  static async addCreditbook(creditBook: Creditbook): Promise<boolean> {
    return await this.service.addCreditbook(creditBook);
  }

  static async updateCreditbook(creditBook: Creditbook): Promise<boolean> {
    return await this.service.updateCreditbook(creditBook);
  }

  static async deleteCreditbook(creditBookId: string) {
    await this.service.deleteCreditbook(creditBookId);
  }
  static async clearBooks() {
    await this.service.clearBooks();
  }

  static async uncompleteOrderCredit(order: OrderHistory) {
    if (!order.creditBookId) return;
    const creditBook = await CreditbookService.getCreditbook(order.creditBookId);
    if (creditBook) {
      creditBook.attachedOrders = creditBook.attachedOrders.filter(
        (e) => e.orderId !== order.orderId
      );
      const matchedRecord = creditBook.records.find(
        (e) => e.attachedOrderId === order.encodedOrderId
      );
      if (matchedRecord) {
       
          creditBook.creditAmount -= matchedRecord!.amount;
        
      }

      creditBook.records = creditBook.records.filter(
        (e) => e.attachedOrderId !== order.encodedOrderId
      );
      await CreditbookService.updateCreditbook(creditBook);
    }
  }
}

export default CreditbookService;
