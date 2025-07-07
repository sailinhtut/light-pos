import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import {
  chunkArray,
  durationGenerator,
  formatNumberWithCommas,
  getTodayParsedID,
  paginator,
  parseNumber,
  sleep,
  uniqueId
} from "@renderer/utils/general_utils";

import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import OrderService from "../service/item_service";
import { useContext, useEffect, useState } from "react";
import { useRouteContext } from "@renderer/router";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  MoreHorizontal,
  Printer,
  RefreshCcw
} from "lucide-react";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { motion } from "framer-motion";
import { OrderHistory } from "../interface/order_history";
import { importOrderExcel } from "../utility/order_excel_utils";
import { formatOrderTime } from "../utility/order_utils";
import PromptDialog from "@renderer/app/view/components/prompt_dialog";
import OrderHistoryService from "../service/order_history_service";
import { ScrollArea, ScrollBar } from "@renderer/assets/shadcn/components/ui/scroll-area";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import { CartDetailDialog } from "./order_active_detail_page";
import { PrintOrder } from "@renderer/app/view/printer_setting_page";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { AppContext } from "@renderer/app/context/app_context";

export function OrderImportPage() {
  const { push } = useRouteContext();
  const [orders, setOrders] = useState<OrderHistory[]>([]);

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const importOrders = async () => {
    if (!selectedFile) {
      toast({ title: "Please select file" });
      return;
    }
    setImporting(true);

    for (const order of orders) {
      await OrderHistoryService.addOrderHistory(getTodayParsedID(order.date), order);
    }

    setOrders([]);
    setSelectedID([]);

    toast({ title: "Successfully Imported" });

    setImporting(false);
  };

  const filterOrders = (origin: OrderHistory[]) => {
    return origin.filter(
      (element) =>
        element.customer.toLowerCase().includes(query.toLowerCase()) ||
        (String(element.orderId).length > 1 && element.orderId === query)
    );
  };

  const filteredOrders = filterOrders(orders ?? []);
  const paginatedData = paginator(filteredOrders, paginateIndex, 10);

  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Order Menu", route: "/settings/order-menu" },
          { name: "Import & Export", route: "/settings/order-menu/order-import-export-menu" },
          { name: "Order Import", route: "/settings/order-menu/order-import" }
        ]}
      />

      <div className="flex justify-between items-center">
        <p className="text-lg">Order Import</p>
        <div className="flex gap-x-3 items-center">
          <Button variant={"ghost"} className="w-[40px] px-2">
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <Input
            type="file"
            onChange={async (event) => {
              if (event.target.files && event.target.files[0]) {
                const chosenFile = event.target.files[0];
                setSelectedFile(chosenFile);
                const importData = await importOrderExcel(chosenFile);
                importData.sort((a, b) => b.date.getTime() - a.date.getTime());
                setOrders(importData);
                setSelectedID(importData.map((e) => e.orderId));
              }
            }}
            placeholder="Choose Excel File"
          ></Input>

          <Button
            variant={importing ? "outline" : "default"}
            className={importing ? "text-primary" : ""}
            onClick={() => {
              if (importing) {
                toast({ title: "Please wait current updating finish" });
                return;
              } else {
                importOrders();
              }
            }}
          >
            {importing ? `Importing` : `Import`}
          </Button>
        </div>
      </div>

      {loading && <LoadingWidget />}

      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={
                      selectedIDs.length !== 0 && selectedIDs.length === filteredOrders.length
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredOrders.map((e) => e.orderId));
                      } else {
                        setSelectedID([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="flex flex-row items-center">
                  <motion.div
                    initial={{
                      scale: 0,
                      width: 0
                    }}
                    animate={{
                      scale: selectedIDs.length === 0 ? 0 : "100%",
                      width: selectedIDs.length === 0 ? 0 : "auto"
                    }}
                  >
                    <span className="p-1 text-sm text-primary mr-2">{selectedIDs.length}</span>
                  </motion.div>
                  Name
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Time</TableHead>
                {/* <TableHead>Detail</TableHead> */}
                <TableHead className="rounded-tr-sm"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={8} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((order, index) => (
                  <ImportOrderDetailDialog order={order}>
                    <TableRow
                      key={order.orderId}
                      className={`${selectedIDs.includes(order.orderId) && "bg-secondary"}`}
                    >
                      <TableCell>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(order.orderId)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([order.orderId, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== order.orderId));
                            }
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {order.customer}
                        {order.isCreditOrder && (
                          <span className="ml-3 rounded-md bg-primary/70 text-white text-xs px-2 py-0.5">
                            Credit
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{order.orders.length}</TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell
                        className={order.getProfitOrLoss() < 0 ? "text-red-500" : "text-green-500"}
                      >
                        {order.getProfitOrLoss()}
                      </TableCell>
                      <TableCell>{formatOrderTime(order.date)}</TableCell>
                      {/* <TableCell
                        className="text-primary text-sm cursor-pointer"
                        onClick={() => {
                          push(`/order-history/${getTodayParsedID(order.date)}/${order.orderId}`, {
                            breadcumbRoutes: JSON.stringify([
                              { name: "Active Orders", route: "/order-active" },
                              {
                                name: "Order History",
                                route: `/order-history/${getTodayParsedID(order?.date ?? new Date())}`
                              }
                            ])
                          });
                        }}
                      >
                        View Detail
                      </TableCell> */}
                      <TableCell
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuGroup>
                              <PromptDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  setOrders(orders.filter((e) => e.orderId !== order.orderId));
                                  setLoading(false);
                                }}
                                title="Delete Order History"
                                description={`Are you sure to delete ${order.customer} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </PromptDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </ImportOrderDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredOrders.length}</p>
            <div className="flex items-center gap-x-3">
              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  if (paginateIndex <= 0) {
                    setPanigateIndex(0);
                    return;
                  }
                  setPanigateIndex(paginateIndex - 1);
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span>
                {paginateIndex + 1} - {chunkArray(filteredOrders, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredOrders, 10);
                  const lastIndex = chunks.length - 1;
                  if (paginateIndex >= lastIndex) {
                    return;
                  }
                  setPanigateIndex(paginateIndex + 1);
                }}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="h-[100px]"></div>
    </div>
  );
}

function ImportOrderDetailDialog({
  order,
  children
}: {
  order: OrderHistory;
  children: React.ReactNode;
}) {
  const { currency } = useContext(AppContext);
  const [scrollTop, setScrollTop] = useState(true);
  const listenScroll = (event) => {
    if (event.target.scrollTop > 0) {
      setScrollTop(false);
    } else {
      setScrollTop(true);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-[80vw] overflow-auto">
        <div className="flex flex-wrap">
          <div className="mt-3 w-1/2">
            <p className="text-lg">{order.customer}</p>
            <div className="mt-3 h-[70vh] border border-slate-300 rounded-xl overflow-hidden">
              <div className={`${!scrollTop && "border-b bg-slate-50"} h-[6vh] p-3 pb-0`}>
                <p className="font-medium mb-3">Orders</p>
              </div>

              <ScrollArea className="h-[64vh] p-3 pt-0 pr-0" onScrollCapture={listenScroll}>
                {order.orders.map((product, index) => (
                  <Card key={index} className="my-3 mr-5">
                    <CardHeader className="px-4 py-3 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="mb-2">
                          {index + 1}. {product.itemName}
                        </CardTitle>
                        <CardDescription>
                          Price {product.price} Ks • Quantity {product.quantity}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            onClick={() => {}}
                            variant={"ghost"}
                            className="size-8 px-0 rounded-lg"
                          >
                            <EllipsisVertical className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <CartDetailDialog item={product}>
                              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                Detail
                              </DropdownMenuItem>
                            </CartDetailDialog>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                  </Card>
                ))}

                <ScrollBar />
              </ScrollArea>
            </div>
          </div>

          <div className="mt-3 w-1/2 px-10">
            <p className="font-medium mb-3">Order Information</p>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatOrderTime(order.date)}{" "}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Duration</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {durationGenerator(order.date)}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Customer</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {order.customer}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Casher</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {order.casherName}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {order.orders.length} items
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Amount</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatNumberWithCommas(order.amount)} {currency}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Discount</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatNumberWithCommas(order.discount)} {currency}
                  </TableCell>
                </TableRow>
                <TableRow className="group ">
                  <TableCell>Tax</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatNumberWithCommas(order.tag)} {currency}
                  </TableCell>
                </TableRow>

                {order.metaData &&
                  Object.keys(order.metaData).length > 0 &&
                  Object.keys(order.metaData).map((e, index) => {
                    const value = order.metaData[e];
                    const isPlainMeta = String(value).startsWith("*");
                    const absoluteValue = isPlainMeta ? String(value) : parseNumber(value) ?? 0;
                    const decreaseCost = !isPlainMeta && absoluteValue < 0;
                    const outputValue = isPlainMeta
                      ? absoluteValue.replaceAll("*", "")
                      : Math.abs(absoluteValue);

                    return (
                      <TableRow key={index} className="group ">
                        <TableCell>{e}</TableCell>
                        <TableCell
                          colSpan={2}
                          className={`${isPlainMeta ? "text-black" : decreaseCost ? "text-green-500" : "text-red-500"} pl-5`}
                        >
                          {outputValue}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                <TableRow className="border-b">
                  <TableCell>Total</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatNumberWithCommas(order.calculateTotal())} {currency}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Pay Amount</TableCell>
                  <TableCell colSpan={2} className="pl-5">
                    {formatNumberWithCommas(order.payAmount)} {currency}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Profit</TableCell>
                  <TableCell
                    colSpan={2}
                    className={`pl-5 ${order.getProfitOrLoss() < 0 ? "text-red-500" : "text-green-500"}`}
                  >
                    {formatNumberWithCommas(order.calculateTotal())} {currency}
                  </TableCell>
                </TableRow>
                <TableRow className="group">
                  <TableCell>Payment Status</TableCell>
                  <TableCell
                    colSpan={2}
                    className={`pl-5 ${order.isCreditOrder ? "text-red-500" : "text-green-500"}`}
                  >
                    {order.isCreditOrder ? "Credit" : "Paid"}
                  </TableCell>
                </TableRow>
                {order.isCreditOrder && (
                  <TableRow className="group">
                    <TableCell>Left Amount</TableCell>
                    <TableCell colSpan={2} className={`pl-5 text-red-500`}>
                      {order.calculateTotal() - order.payAmount}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <PrintOrder order={order} creditBookId={order.creditBookId ?? undefined}>
              <Button className="mt-2 w-full" variant={"outline"}>
                <Printer className="text-black size-4 mr-5" /> Print Receipt
              </Button>
            </PrintOrder>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
