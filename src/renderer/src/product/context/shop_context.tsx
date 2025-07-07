import { createContext, useContext, useEffect, useState } from "react";
import { Category } from "../interface/category";
import { Item } from "../interface/item";
import { Unit } from "../interface/unit";
import ItemService from "../service/item_service";
import CategoryService from "../service/category_service";
import UnitService from "../service/unit_service";
import { CartContext } from "@renderer/order/context/cart_context";
import { OrderHistory } from "@renderer/order/interface/order_history";
import { CartItem } from "@renderer/order/interface/cart_item";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { ArrowLeftSquareIcon } from "lucide-react";
import { exportProductExcel } from "../utility/product_excel_utils";
import { getTodayParsedID, parseNumber, sleep } from "@renderer/utils/general_utils";
import { ToastAction } from "@renderer/assets/shadcn/components/ui/toast";
import { useRouteContext } from "@renderer/router";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import { exportOrderExcel } from "@renderer/order/utility/order_excel_utils";
import UserService from "@renderer/users/service/account_service";
import { exportCashflowExcel } from "@renderer/cashflow/utils/cashflow_excel_utils";
import CashflowService from "@renderer/cashflow/service/cashflow_service";
import { getTimelinesBetween } from "@renderer/app/view/dashboard_page";

interface ShopContext {
  items: Item[];
  categories: Category[];
  units: Unit[];
  fetching: boolean;
  fetchData: (options?: { backup?: boolean; minimumStockAlaram?: boolean }) => void;
  addStockByQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeStockByQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  addStockByOrder: (order: OrderHistory) => void;
  removeStockByOrder: (order: OrderHistory) => void;
  removeStockByCart: (cartItems: CartItem[]) => void;
}

export const ShopContext = createContext<ShopContext>({
  items: [],
  categories: [],
  units: [],
  fetching: false,
  fetchData: () => {},
  addStockByQuantity: () => Promise.resolve(false),
  removeStockByQuantity: () => Promise.resolve(false),
  addStockByOrder: () => {},
  removeStockByOrder: () => {},
  removeStockByCart: () => {}
});

export function ShopContextProvider({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fetching, setFetching] = useState(false);

  const cartContext = useContext(CartContext);

  const fetchData = async (options?: { backup?: boolean; minimumStockAlaram?: boolean }) => {
    cartContext.clearCart();
    setFetching(true);

    const itemData = await ItemService.getItems();
    const categoryData = await CategoryService.getCategories();
    const unitData = await UnitService.getUnits();
    setItems(itemData);
    setCategories(categoryData);
    setUnits(unitData);

    setFetching(false);

    if (options?.minimumStockAlaram ?? false) {
      const stock = parseNumber(localStorage.getItem("minimumStockQuantity") ?? "") ?? 25;
      const stockFiltered = itemData.filter((e) => e.useStock && e.stock < stock);
      stockFiltered.sort((a, b) => a.stock - b.stock);
      if (stockFiltered.length > 0) {
        const content = stockFiltered.map((e) => `${e.name} - ${e.stock}`).join(" | ");
        toast({
          title: `Minimum Stock ${stock} (Total - ${stockFiltered.length} Items)`,
          description: (
            <p
              className="hover:text-primary"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              {content}
            </p>
          )
        });
      }
    }

    if ((options?.backup ?? false) && itemData.length > 0) {
      await ItemService.backupItems(itemData);

      // Today Item Back Up
      const itemExcelBytes = await exportProductExcel(
        "Item Daily Back Up.xlsx",
        itemData,
        categories,
        units,
        "returnBytes"
      );
      const backupFilePath = await window.electron.ipcRenderer.invoke(
        "backupExcel",
        "Item Daily Back Up.xlsx",
        itemExcelBytes
      );

      // Today Order Back Up
      const orderData = await OrderHistoryService.getOrderHistories(getTodayParsedID(new Date()));
      const users = await UserService.getUsers();
      const orderExcelBytes = await exportOrderExcel(
        "Order Daily Back Up.xlsx",
        orderData,
        users,
        "returnBytes"
      );
      await window.electron.ipcRenderer.invoke(
        "backupExcel",
        "Order Daily Back Up.xlsx",
        orderExcelBytes
      );

      // Today Cashflow Back Up
      const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const cashflowData = await getTimelinesBetween(lastWeekDate, new Date(), (p) => {});
      const records = cashflowData.map((e) => e.records).flat();
      records.sort((a, b) => a.date.getTime() - b.date.getTime());
      const cashflowExcelBytes = await exportCashflowExcel(
        "Cash Flow Weekly Back Up.xlsx",
        records,
        "returnBytes"
      );
      await window.electron.ipcRenderer.invoke(
        "backupExcel",
        "Cash Flow Weekly Back Up.xlsx",
        cashflowExcelBytes
      );

      if (orderData)
        if (backupFilePath !== null) {
          toast({
            title: "Data Backed Up Successfully",
            description: <p className="hover:text-primary">{backupFilePath}</p>,
            action: (
              <ToastAction
                onClick={() => window.api.shell.openPath(backupFilePath)}
                altText={"Back Up File Path"}
              >
                Open
              </ToastAction>
            )
          });
        }
    }
  };

  const addStockByQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    const itemData = await ItemService.getItems();
    const matchedItem = itemData.find((e) => e.item_id === itemId);
    if (matchedItem) {
      matchedItem.addStock(quantity);
      await ItemService.saveItems(itemData);
      return true;
    }
    return false;
  };

  const removeStockByQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    const itemData = await ItemService.getItems();
    const matchedItem = itemData.find((e) => e.item_id === itemId);
    if (matchedItem) {
      if (matchedItem.useStock && matchedItem.stock < quantity) {
        toast({ title: "No Enough Stock" });
        return false;
      }
      matchedItem.consumeStock(quantity);
      await ItemService.saveItems(itemData);
      return true;
    }
    return false;
  };
  const addStockByOrder = async (order: OrderHistory) => {
    const itemData = await ItemService.getItems();
    order.orders.forEach((cartItem) => {
      const matchedItem = itemData.find((e) => e.item_id === cartItem.itemId);
      if (matchedItem) {
        matchedItem.addStock(cartItem.quantity);
      }
    });
    await ItemService.saveItems(itemData);
  };
  const removeStockByOrder = async (order: OrderHistory) => {
    const itemData = await ItemService.getItems();
    order.orders.forEach((cartItem) => {
      const matchedItem = itemData.find((e) => e.item_id === cartItem.itemId);
      if (matchedItem) {
        matchedItem.consumeStock(cartItem.quantity);
      }
    });
    await ItemService.saveItems(itemData);
  };
  const removeStockByCart = async (cartItems: CartItem[]) => {
    const itemData = await ItemService.getItems();
    cartItems.forEach((cartItem) => {
      const matchedItem = itemData.find((e) => e.item_id === cartItem.itemId);
      if (matchedItem) {
        matchedItem.consumeStock(cartItem.quantity);
      }
    });
    await ItemService.saveItems(itemData);
  };

  return (
    <ShopContext.Provider
      value={{
        items: items,
        categories: categories,
        units: units,
        fetching: fetching,
        fetchData: fetchData,
        addStockByQuantity: addStockByQuantity,
        removeStockByQuantity: removeStockByQuantity,
        addStockByOrder: addStockByOrder,
        removeStockByOrder: removeStockByOrder,
        removeStockByCart: removeStockByCart
      }}
    >
      {children}{" "}
    </ShopContext.Provider>
  );
}
