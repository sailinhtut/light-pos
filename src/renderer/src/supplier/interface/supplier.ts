import { decodeGzip, encodeGzip } from "@renderer/utils/encrypt_utils";

export interface Supplier {
  supplierId: string;
  name: string;
  note: string;
  phoneOne: string;
  itemName: string;
  amount: number;
  quantity: number;
  payAmount: number;
  leftAmount: number;
  created_at: Date;
  updated_at: Date;
  attachments: string[];
}

export function encodeSupplierJson(supplier: Supplier) {
  return {
    supplierId: supplier.supplierId,
    name: supplier.name,
    note: supplier.note,
    phoneOne: supplier.phoneOne,
    itemName: supplier.itemName,
    amount: supplier.amount,
    quantity: supplier.quantity,
    payAmount: supplier.payAmount,
    leftAmount: supplier.leftAmount,
    created_at: supplier.created_at.toISOString(),
    updated_at: supplier.updated_at.toISOString(),
    attachments: supplier.attachments.map((e) => encodeGzip(e))
  };
}

export function decodeSupplierJson(json: object) {
  const data = json as Supplier;
  return {
    supplierId: data.supplierId,
    name: data.name,
    note: data.note,
    phoneOne: data.phoneOne,
    itemName: data.itemName,
    amount: data.amount,
    quantity: data.quantity,
    payAmount: data.payAmount,
    leftAmount: data.leftAmount,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    attachments:
      data.attachments && data.attachments.length > 0
        ? data.attachments.map((e) => decodeGzip(e))
        : []
  };
}
