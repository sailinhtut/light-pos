import * as Excel from "xlsx";
import { Item, ItemInterface } from "../interface/item";
import { Category } from "../interface/category";
import { Unit } from "../interface/unit";
import { parseNumber } from "@renderer/utils/general_utils";
import moment from "moment";

function parseUnitPriceText(value: string): object | undefined {
  // [adsf-25000x3]
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  const removedBracket = trimmed.substring(1, trimmed.length - 1);
  const parts = removedBracket.split("-");
  const name = parts[0];
  const quantity = parseFloat(parts[1]) || 0;
  const price = parseFloat(parts[2]) || 0;

  return {
    name: name,
    quantity: quantity,
    price: price
  };
}

export async function importProductExcel(file: File): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = Excel.read(data, { type: "array" });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const jsonData = Excel.utils.sheet_to_json(worksheet);

      const itemData: Item[] = [];

      const cleanString = (raw) => String(raw).trim();

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

      const convertNumber = (numberString: string) => parseNumber(numberString) ?? 0;

      const convertBoolean = (booleanString: string) => Boolean(booleanString);

      const convertDate = (dateString: string) =>
        moment(dateString, "hh:mm:ss A DD/MM/YYYY").toDate();

      for (const json of jsonData) {
        // 0 - item_id : data["ID"],
        // 1 - name : data["name"],
        // 2 - itemImage : data["Image"],                 // string
        // 3 - description : data["Description"],
        // 4 - category_id : data["Category"],
        // 5 - useStock : data["Use Stock"],              // number
        // 6 - purchasedPrice : data["Purchased Price"],  // number
        // 7 - unitAmount : data["Unit Amount"],          // number
        // 8 - unitPrice : data["Unit Price"],            // number
        // 9 - unitNameId : data["Unit Name"],
        // 10 - stock : data["Stock"],                    // number
        // 11 - unitPriceVariants : data["Price Variant"],
        // 12 - expiredDate : data["Expiry Date"],
        // 13 - editedDate : data["Updated Date"],
        // 14 - barcode : data["Barcode"]                 // string

        const data = json as {};
        const foundCategory = sanitizeString(data["Category"]) ?? "";
        const foundUnit = sanitizeString(data["Unit Name"]) ?? "";

        const product = Item.fromJson({
          pinned: false,
          pinnedTime: null,
          item_id: sanitizeString(data["ID"]) ?? "",
          name: cleanString(data["Name"]),
          itemImage: sanitizeString(data["Image"]),
          description: cleanString(data["Description"]),
          category_id: foundCategory,
          useStock: convertBoolean(cleanString(data["Use Stock"])),
          purchasedPrice: convertNumber(cleanString(data["Purchased Price"])),
          unitAmount: convertNumber(cleanString(data["Unit Amount"])),
          unitPrice: convertNumber(cleanString(data["Unit Price"])),
          unitNameId: foundUnit,
          stock: convertNumber(cleanString(data["Stock"])),
          unitPriceVariants: sanitizeString(cleanString(data["Price Variant"]))
            ? cleanString(data["Price Variant"])
                .split(",")
                .map((part) => parseUnitPriceText(part) ?? {})
            : [],
          expiredDate: sanitizeString(data["Expiry Date"])
            ? convertDate(cleanString(data["Expiry Date"]))
            : new Date(),
          editedDate: sanitizeString(data["Updated Date"])
            ? convertDate(cleanString(data["Updated Date"]))
            : new Date(),
          barcode: sanitizeString(data["Barcode"])
        });
        itemData.push(product);
      }

      resolve(itemData);
    };

    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
  });
}

export async function exportProductExcel(
  filename: string,
  data: Item[],
  categories: Category[],
  units: Unit[],
  mode: "customSave" | "returnBytes"
) {
  const worksheet = Excel.utils.json_to_sheet([], { skipHeader: true });

  const headers = [
    "ID",
    "Name",
    "Image",
    "Description",
    "Category",
    "Use Stock",
    "Purchased Price",
    "Unit Amount",
    "Unit Price",
    "Unit Name",
    "Stock",
    "Price Variant",
    "Expiry Date",
    "Updated Date",
    "Barcode"
  ];
  Excel.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

  const arrangedProductData = data.map((product) => {
    const selectedCategory = categories.find((e) => e.category_id === product.category_id);
    const selectedUnit = units.find((e) => e.unitId === product.unitNameId);

    const formattedVariantPriceString = product.unitPriceVariants
      .map((e) => {
        return `[${e["name"]}-${e["quantity"]}-${e["price"]}]`;
      })
      .join(",");

    return {
      item_id: product.item_id,
      name: product.name,
      itemImage: product.itemImage ?? "",
      description: product.description,
      category_id: selectedCategory?.name ?? "",
      useStock: product.useStock ? "true" : "false",
      purchasedPrice: product.purchasedPrice,
      unitAmount: product.unitAmount,
      unitPrice: product.unitPrice,
      unitNameId: selectedUnit?.unitName ?? "",
      stock: product.stock,
      unitPriceVariants: formattedVariantPriceString,
      expiredDate:
        product.expiredDate === null
          ? ""
          : moment(product.expiredDate).format("hh:mm:ss A DD/MM/YYYY"),
      editedDate:
        product.editedDate === null
          ? ""
          : moment(product.editedDate).format("hh:mm:ss A DD/MM/YYYY"),
      barcode: product.barcode ?? ""
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
