import { offlineMode } from "@renderer/utils/app_constants";
import { uniqueId } from "@renderer/utils/general_utils";
import { Timestamp } from "firebase/firestore";
import { date } from "zod";

export interface Creditbook {
  creditBookId: string;
  name: string;
  note: string;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
  creditAmount: number;
  completed: boolean;
  parsedMonth: string;
  records: CashRecord[];
  attachedOrders: AttachedOrder[];
}

export interface CashRecord {
  cashRecordId: string;
  attachedOrderId: string | null;
  name: string;
  amount: number;
  note: string;
  date: Date;
  cashIn: boolean;
}

export interface AttachedOrder {
  orderId: string;
  orderShortName: string;
  storageRefPath: string;
  orderCollectionName: string;
}

export function encodeCreditbook(book: Creditbook) {
  return {
    creditBookId: book.creditBookId,
    name: book.name,
    note: book.note,
    createdBy: book.createdBy,
    createdDate: book.createdDate,
    updatedDate: book.updatedDate,
    creditAmount: book.creditAmount,
    completed: book.completed,
    parsedMonth: book.parsedMonth,
    records:
      book.records && Array.isArray(book.records)
        ? book.records.map((element) => encodeCashRecord(element))
        : [],
    attachedOrders:
      book.attachedOrders && Array.isArray(book.attachedOrders)
        ? book.attachedOrders.map((element) => encodeAttachedOrder(element))
        : []
  };
}

export function encodeCashRecord(record: CashRecord) {
  return {
    cashRecordId: record.cashRecordId ?? uniqueId(),
    attachedOrderId: record.attachedOrderId,
    name: record.name,
    amount: record.amount,
    note: record.note,
    date: record.date,
    cashIn: record.cashIn
  };
}

export function encodeAttachedOrder(record: AttachedOrder) {
  return {
    orderId: record.orderId,
    orderShortName: record.orderShortName,
    storageRefPath: record.storageRefPath,
    orderCollectionName: record.orderCollectionName
  };
}

export function decodeCreditbook(book: object) {
  const data = book as Creditbook;
  return {
    creditBookId: data.creditBookId,
    name: data.name,
    note: data.note,
    createdBy: data.createdBy,
    createdDate: offlineMode ? data.createdDate : (data.createdDate as Timestamp).toDate(),
    updatedDate: offlineMode ? data.updatedDate : (data.updatedDate as Timestamp).toDate(),
    creditAmount: data.creditAmount,
    completed: data.completed,
    parsedMonth: data.parsedMonth,
    records: data.records ? data.records.map((element) => decodeCashRecord(element)) : [],
    attachedOrders: data.attachedOrders
      ? data.attachedOrders.map((element) => decodeAttachedOrder(element))
      : []
  };
}

export function decodeCashRecord(record: CashRecord) {
  const data = record as CashRecord;
  return {
    cashRecordId: data.cashRecordId,
    attachedOrderId: data.attachedOrderId,
    name: data.name,
    amount: data.amount,
    note: data.note,
    date: offlineMode ? data.date : (data.date as Timestamp).toDate(),
    cashIn: data.cashIn
  };
}

export function decodeAttachedOrder(record: AttachedOrder) {
  const data = record as AttachedOrder;
  return {
    orderId: data.orderId,
    orderShortName: data.orderShortName,
    storageRefPath: data.storageRefPath,
    orderCollectionName: data.orderCollectionName
  };
}
