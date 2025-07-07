import * as Excel from "xlsx";
import { parseNumber } from "@renderer/utils/general_utils";
import moment from "moment";
import { OrderHistory } from "../interface/order_history";
import { decodeGzip, encodeGzip } from "@renderer/utils/encrypt_utils";
import { CartItem } from "../interface/cart_item";
import { browserReadFileText, generateDownloadText } from "@renderer/utils/file_utils";
import User from "@renderer/auth/interface/user";

export async function importOrderExcel(file: File): Promise<OrderHistory[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = Excel.read(data, { type: "array" });

      // Assuming data is in the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Parse the worksheet to JSON
      const jsonData = Excel.utils.sheet_to_json(worksheet);

      const orderData: OrderHistory[] = [];

      const sanitizeString = (raw): string | null => {
        const castString = String(raw);
        const sanitizedString = castString.trim();
        let isEmpty =
          sanitizedString === "undefined" ||
          sanitizedString === "null" ||
          sanitizedString === "Null" ||
          sanitizedString === "NULL" ||
          sanitizedString.length === 0;
        return isEmpty ? null : sanitizedString;
      };

      for (const json of jsonData) {
        const jsonRaw = decodeGzip(sanitizeString(json["Import Back Data"]) ?? "");
        const orderJson = JSON.parse(jsonRaw);
        const order = OrderHistory.fromJson(orderJson);
        orderData.push(order);
      }

      resolve(orderData);
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function exportOrderExcel(
  filename: string,
  data: OrderHistory[],
  users: User[],
  mode: "customSave" | "returnBytes"
) {
  const worksheet = Excel.utils.json_to_sheet([], { skipHeader: true });

  const headers = [
    "Order ID",
    "DATE",
    "Orders",
    "TOTAL",
    "AMOUNT",
    "DISCOUNT",
    "TAX",
    "Pay Amount",
    "Credit",
    "Credit Book ID",
    "CASHER",
    "CUSTOMER",
    "Import Back Data"
  ];
  Excel.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

  const arrangedProductData = data.map((order) => {
    const matchedUser = users.find((e) => e.docId === order.casherId);

    return {
      orderId: order.orderId,
      date: order.date === null ? "" : moment(order.date).format("hh:mm:ss A DD/MM/YYYY"),
      orders: order.orders!.map((e) => `(${e.itemName}x${e.quantity}=${e.getTotal()})`).join(","),
      total: order.calculateTotal(),
      amount: order.getAmount(),
      discount: order.discount,
      tag: order.tag,
      payAmount: order.payAmount,
      credit: order.isCreditOrder,
      creditBookId: order.creditBookId,
      casher: matchedUser?.name ?? "",
      customer: order.customer,
      meta_data: encodeGzip(JSON.stringify(order.toJson()))
    };
  });

  Excel.utils.sheet_add_json(worksheet, arrangedProductData, { origin: "A2", skipHeader: true });
  const workbook = Excel.utils.book_new();
  Excel.utils.book_append_sheet(workbook, worksheet, "Products");
  if (mode === "customSave") {
    Excel.writeFile(workbook, filename);
  } else {
    const excelBuffer = Excel.write(workbook, { bookType: "xlsx", type: "array" });
    return excelBuffer;
  }
}
