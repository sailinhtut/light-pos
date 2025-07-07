import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import {
  chunkArray,
  getTodayParsedID,
  getUnParsedDate,
  paginator
} from "@renderer/utils/general_utils";
import { useEffect, useState } from "react";
import { OrderHistory } from "../interface/order_history";
import OrderHistoryService from "../service/order_history_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCcw,
  Settings2,
  Trash
} from "lucide-react";

import PromptDialog from "@renderer/app/view/components/prompt_dialog";
import OrderActiveService from "../service/order_active_service";
import { Timestamp } from "firebase/firestore";
import {
  formatOrderTime,
  groupOrdersByCartItem,
  groupOrdersByCashier,
  groupOrdersByCustomer,
  groupOrdersByDate,
  groupOrdersByHour,
  isSingleDayOrders
} from "../utility/order_utils";
import { useRouteContext } from "@renderer/router";

import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { PieChartComponent } from "@renderer/app/view/components/pie_chart";
import { LineChartComponent } from "@renderer/app/view/components/line_chart";
import { motion } from "framer-motion";
import { decodeGzip, encodeGzip } from "@renderer/utils/encrypt_utils";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";

export default function OrderListPage() {
  const [title, setTitle] = useState("Orders");
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  const [searchParams] = useSearchParams();

  const { push } = useRouteContext();

  useEffect(function () {
    const json = decodeGzip(searchParams.get("data") ?? "");
    const data = (JSON.parse((json ?? "[]").length === 0 ? "[]" : json) as []).map((e) =>
      OrderHistory.fromJson(e)
    );
    setOrders(data);

    const titleValue = searchParams.get("title");
    setTitle(titleValue ?? title);
  }, []);

  const [showCreditOrder, setShowCreditOrder] = useState(false);
  const [sortLastest, setSortLastest] = useState(true);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const [cashierID, setCashierID] = useState<string | undefined>(undefined);

  const filterOrderHistorys = (origin: OrderHistory[]) => {
    let data = origin.filter(
      (element) =>
        element.customer.toLowerCase().includes(query.toLowerCase()) ||
        element.orderId.includes(query)
    );
    if (showCreditOrder) {
      data = data.filter((e) => e.isCreditOrder);
    }
    if (cashierID) {
      data = data.filter((e) => e.casherId === cashierID);
    }
    if (sortLastest) {
      data.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else {
      data.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return data;
  };

  const filteredOrders = filterOrderHistorys(orders ?? []);
  const paginatedData = paginator(filteredOrders, paginateIndex, 10);

  const isSingleDay = isSingleDayOrders(orders);

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Dashboard", route: "/dashboard" },
          { name: "Order List", route: "/order-list" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">{title}</p>
        <div className="flex ">
          {loading && (
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          )}
          <Input
            className="ml-3"
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <Button
            variant={"outline"}
            onClick={() => setShowInsight(!showInsight)}
            className={`${showInsight ? "text-slate-500" : "text-primary"} mx-3`}
          >
            <BarChart2 className="size-5 mr-2" /> Insight{" "}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant={"outline"} size={"icon"} className="">
                <Settings2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowCreditOrder(!showCreditOrder)}>
                  {showCreditOrder ? "Close Credit Order" : "Show Credit Order"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortLastest(!sortLastest)}>
                  {sortLastest ? "Sort Earliest" : "Sort Lastest"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.div
            initial={{
              x: "-100%",
              opacity: 0,
              width: 0
            }}
            animate={{
              x: selectedIDs.length > 0 ? 0 : "100%",
              opacity: selectedIDs.length > 0 ? 1 : 0,
              width: selectedIDs.length > 0 ? "auto" : 0
            }}
          >
            <ConfirmDialog
              actionVariant={"destructive"}
              title="Delete Items"
              description="Are you sure to delete all selected items ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const orderId of selectedIDs) {
                  const selectedOrder = orders.find((e) => e.orderId === orderId);
                  if (selectedOrder) {
                    await OrderHistoryService.deleteOrderHistory(
                      getTodayParsedID(selectedOrder!.date),
                      selectedOrder!.orderId
                    );
                  }
                }
                setLoading(false);
                setOrders(orders.filter((e) => !selectedIDs.includes(e.orderId)));
                setSelectedID([]);
              }}
            >
              <Button variant={"destructive"} size={"icon"} className="ml-3">
                <Trash className="size-5" />
              </Button>
            </ConfirmDialog>
          </motion.div>
        </div>
      </div>
      {loading && <LoadingWidget />}

      {!loading && (
        <motion.div
          className="flex flex-row flex-nowrap gap-5 mt-3 -z-50"
          initial={{
            height: 0,
            x: "100%",
            opacity: 0
          }}
          animate={{
            height: showInsight ? "auto" : 0,
            x: showInsight ? 0 : "100%",
            opacity: showInsight ? 1 : 0
          }}
          transition={{ duration: 0.8 }}
        >
          {orders.length > 0 && (
            <LineChartComponent
              title="Orders"
              description={`Total - ${isSingleDay ? groupOrdersByHour(orders).length : groupOrdersByDate(orders).length}`}
              unitName="Orders"
              dataSet={isSingleDay ? groupOrdersByHour(orders) : groupOrdersByDate(orders)}
              totalAmount={
                orders.length === 0
                  ? 0
                  : orders.map((e) => e.calculateTotal()).reduce((a, b) => a + b)
              }
              totalOrderNo={orders.length}
            ></LineChartComponent>
          )}

          {orders.length > 0 && (
            <PieChartComponent
              title="Products"
              description=""
              unitName="Item"
              dataSet={groupOrdersByCartItem(filteredOrders)}
            />
          )}

          {orders.length > 0 && (
            <PieChartComponent
              title="Cashers"
              description=""
              unitName="Sale"
              dataSet={groupOrdersByCashier(orders)}
              onSelected={(value) => {
                setCashierID(value);
              }}
            />
          )}

          {orders.length > 0 && (
            <PieChartComponent
              title="Customers"
              description=""
              unitName="Sale"
              dataSet={groupOrdersByCustomer(filteredOrders)}
            />
          )}
        </motion.div>
      )}

      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={selectedIDs.length === filteredOrders.length && selectedIDs.length > 0}
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredOrders.map((e) => e.orderId));
                      } else {
                        setSelectedID([]);
                      }
                    }}
                  />
                </TableHead>

                <TableHead className="flex flex-row items-center ">
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
                  <TableCell colSpan={4} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((order, index) => (
                  <TableRow
                    key={index}
                    onClick={() => {
                      push(`/order-history/${getTodayParsedID(order.date)}/${order.orderId}`, {
                        breadcumbRoutes: JSON.stringify([
                          { name: "Dashboard", route: "/dashboard" },
                          {
                            name: "Order List",
                            route: "/order-list",
                            query: {
                              title: searchParams.get("title") ?? "Orders",
                              data: encodeGzip(JSON.stringify(orders.map((e) => e.toJson())))
                            }
                          }
                        ])
                      });
                    }}
                  >
                    {/* <TableCell className="pl-5">{index + 1 + 10 * paginateIndex}</TableCell> */}
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
                            { name: "Dashboard", route: "/dashboard" },
                            {
                              name: "Order List",
                              route: "/order-list",
                              query: {
                                title: searchParams.get("title") ?? "Orders",
                                data: encodeGzip(JSON.stringify(orders.map((e) => e.toJson())))
                              }
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
                                await OrderHistoryService.deleteOrderHistory(
                                  getTodayParsedID(order.date),
                                  order.orderId
                                );
                                await OrderActiveService.addOrderHistory(order);
                                setOrders(orders.filter((e) => e.orderId !== order.orderId));
                                await CreditbookService.uncompleteOrderCredit(order);

                                setLoading(false);
                              }}
                              title="Uncomplete Order"
                              description={`Are you sure to uncomplete ${order.customer} ?`}
                              actionTitle="Confirm"
                            >
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                              >
                                Uncomplete
                              </DropdownMenuItem>
                            </PromptDialog>
                            <PromptDialog
                              onConfirmed={async () => {
                                setLoading(true);
                                await OrderHistoryService.deleteOrderHistory(
                                  getTodayParsedID(order.date),
                                  order.orderId
                                );
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
    </div>
  );
}
