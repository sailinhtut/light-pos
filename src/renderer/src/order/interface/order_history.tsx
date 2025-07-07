//   String? orderId;
//   String? casherName;
//   String? casherId;
//   String? customer;
//   num? total;
//   num? discount;
//   num? tag;
//   num? payAmount;
//   int? warrantyMonth;
//   num? amount;
//   DateTime? date;
//   List<CartItem>? orders;
//   bool? cooking;
//   bool? ready;
//   String? creditBookId;
//   bool? paid;
//   Map<dynamic, dynamic>? metaData;

import { Timestamp } from "firebase/firestore";
import { CartItem } from "./cart_item";
import { getTodayParsedID, parseNumber } from "@renderer/utils/general_utils";

export interface OrderHistoryInterface {
  orderId: string;
  casherName: string;
  casherId: string;
  customer: string;
  total: number;
  discount: number;
  tag: number;
  payAmount: number;
  warrantyMonth: number;
  amount: number;
  date: Date;
  cooking: boolean;
  ready: boolean;
  creditBookId: string | null;
  paid: boolean;
  metaData: object;
  orders: CartItem[];
}

export class OrderHistory implements OrderHistoryInterface {
  orderId: string;
  casherName: string;
  casherId: string;
  customer: string;
  total: number;
  discount: number;
  tag: number;
  payAmount: number;
  warrantyMonth: number;
  amount: number;
  date: Date;
  cooking: boolean;
  ready: boolean;
  creditBookId: string | null;
  paid: boolean;
  metaData: {};
  orders: CartItem[];

  private constructor(object: object) {
    const json = object as OrderHistoryInterface;
    this.orderId = json.orderId;
    this.casherName = json.casherName;
    this.casherId = json.casherId;
    this.customer = json.customer;
    this.total = json.total;
    this.discount = json.discount;
    this.tag = json.tag;
    this.payAmount = json.payAmount;
    this.warrantyMonth = json.warrantyMonth;
    this.amount = json.amount;
    this.date =
      json.date instanceof Timestamp ? (json.date as Timestamp).toDate() : new Date(json.date);
    this.cooking = json.cooking;
    this.ready = json.ready;
    this.creditBookId = json.creditBookId;
    this.paid = json.paid;
    this.metaData = json.metaData;
    this.orders =
      json.orders && Array.isArray(json.orders) ? json.orders.map((e) => CartItem.fromJson(e)) : [];
  }

  static fromJson(json: object) {
    return new OrderHistory(json);
  }

  toJson() {
    return {
      orderId: this.orderId,
      casherName: this.casherName,
      casherId: this.casherId,
      customer: this.customer,
      total: this.total,
      discount: this.discount,
      tag: this.tag,
      payAmount: this.payAmount,
      warrantyMonth: this.warrantyMonth,
      amount: this.amount,
      date: this.date,
      cooking: this.cooking,
      ready: this.ready,
      creditBookId: this.creditBookId,
      paid: this.paid,
      metaData: this.metaData,
      orders: this.orders.map((e) => e.toJson())
    };
  }

  get encodedOrderId(): string {
    return `${getTodayParsedID(this.date)}$${this.orderId}`;
  }

  getProfitOrLoss(): number {
    const sale = this.amount;
    const purchasedCost =
      this.orders.length === 0
        ? 0
        : this.orders.map((e) => e.purchasedPrice * e.quantity).reduce((one, two) => one + two);
    const variableCost = this.discount + this.getRemoveCostMeta();
    const profit = sale - (purchasedCost + variableCost);
    return profit;
  }

  getAmount(): number {
    let amount = 0;
    this.orders.forEach((element) => {
      const quantityPrice = element.getTotalChildren({});
      amount += quantityPrice;
    });
    return amount;
  }

  get isCreditOrder(): boolean {
    return this.payAmount < this.calculateTotal();
  }

  intelligentAddAll(newOrders: CartItem[]) {
    for (const newOrder of newOrders) {
      const existedItem = this.orders.find((element) => element.itemId === newOrder.itemId);
      if (existedItem != null) {
        existedItem.addQuantity(newOrder.quantity);
      } else {
        this.orders.push(newOrder);
      }
    }
  }

  intelligentRemoveOrder(itemId: string) {
    const result = this.orders.find((element) => element.itemId === itemId);
    if (result != null) {
      result.removeQuantity(1);
      if (result.quantity == 0) {
        this.orders = this.orders.filter((element) => element.itemId !== itemId);
      }
    }
  }

  getAddCostMeta() {
    if (!this.metaData || Object.keys(this.metaData).length === 0) return 0;
    const addMetaValues: number[] = [];
    for (const key in this.metaData) {
      const value = this.metaData[key];
      if (!String(value).startsWith("*")) {
        const numeric = parseNumber(value) ?? 0;
        if (numeric > 0) {
          addMetaValues.push(Math.abs(numeric));
        }
      }
    }
    return addMetaValues.length === 0 ? 0 : addMetaValues.reduce((a, b) => a + b);
  }

  getRemoveCostMeta() {
    if (!this.metaData || Object.keys(this.metaData).length === 0) return 0;
    const addMetaValues: number[] = [];
    for (const key in this.metaData) {
      const value = this.metaData[key];
      if (!String(value).startsWith("*")) {
        const numeric = parseNumber(value) ?? 0;
        if (numeric < 0) {
          addMetaValues.push(Math.abs(numeric));
        }
      }
    }
    return addMetaValues.length === 0 ? 0 : addMetaValues.reduce((a, b) => a + b);
  }

  calculateTotal() {
    // total = (amount+tax+plusMetaCost) - (discount+minusMetaCost);
    const allCost = this.amount + this.tag + this.getAddCostMeta();
    const allPromotion = this.discount + this.getRemoveCostMeta();
    this.total = allCost - allPromotion;
    return this.total;
  }
}
