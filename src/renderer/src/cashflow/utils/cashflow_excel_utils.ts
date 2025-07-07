import * as Excel from "xlsx";
import { parseNumber } from "@renderer/utils/general_utils";
import moment from "moment";
import { Timeline } from "../interface/cashflow";

export async function exportCashflowExcel(
  filename: string,
  data: Timeline[],
  mode: "customSave" | "returnBytes"
) {
  const worksheet = Excel.utils.json_to_sheet([], { skipHeader: true });

  const headers = ["ID", "DATE", "NAME", "AMOUNT", "NOTE"];

  Excel.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

  const arrangedProductData = data.map((timeline) => {
    return {
      timelineId: timeline.timelineId,
      date: moment(timeline.date).format("hh:mm:ss A DD/MM/YYYY"),
      name: timeline.name,
      amount: timeline.amount,
      note: timeline.note
    };
  });

  Excel.utils.sheet_add_json(worksheet, arrangedProductData, { origin: "A2", skipHeader: true });
  const workbook = Excel.utils.book_new();
  Excel.utils.book_append_sheet(workbook, worksheet, "Cashflow");
  if (mode === "customSave") {
    Excel.writeFile(workbook, filename);
  } else {
    const excelBuffer = Excel.write(workbook, { bookType: "xlsx", type: "array" });
    return excelBuffer;
  }
}
