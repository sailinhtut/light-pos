import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import {
  chunkArray,
  getTodayParsedID,
  getUnParsedDate,
  noConnection,
  paginator,
  sleep
} from "@renderer/utils/general_utils";
import { useContext, useEffect, useState } from "react";
import { OrderHistory } from "../interface/order_history";
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
  DropdownMenuRadioGroup,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  RefreshCcw,
  Rocket,
  Settings2,
  Trash
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import PromptDialog from "@renderer/app/view/components/prompt_dialog";
import OrderActiveService from "../service/order_active_service";
import { Timestamp } from "firebase/firestore";
import {
  formatOrderTime,
  groupOrdersByCartItem,
  groupOrdersByCashier,
  groupOrdersByCustomer,
  groupOrdersByDate,
  groupOrdersByHour
} from "../utility/order_utils";
import { useRouteContext } from "@renderer/router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { Calendar } from "@renderer/assets/shadcn/components/ui/calendar";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { useParams } from "react-router-dom";
import { BarChartComponent } from "@renderer/app/view/components/bar_chart";
import { PieChartComponent } from "@renderer/app/view/components/pie_chart";
import moment from "moment";
import { LineChartComponent } from "@renderer/app/view/components/line_chart";
import { Item } from "@renderer/product/interface/item";
import { CartItem } from "../interface/cart_item";
import { MotionConfig } from "framer-motion";
import { motion } from "framer-motion";
import { encodeGzip } from "@renderer/utils/encrypt_utils";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { GearIcon, RocketIcon } from "@radix-ui/react-icons";
import OrderHistoryLocalService from "../service/order_history_local_service";
import OrderHistoryService from "../service/order_history_service";
import { ShopContext } from "@renderer/product/context/shop_context";
import { requestNotificationPermission } from "@renderer/test_page";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";

export default function OrderHistoryOfflinePage() {
  const { date } = useParams();

  const [orderHistories, setOrderHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(getUnParsedDate(date) ?? new Date());
  const [showInsight, setShowInsight] = useState(false);

  const { push } = useRouteContext();
  const shopContext = useContext(ShopContext);

  const [showCreditOrder, setShowCreditOrder] = useState(false);
  const [sortLastest, setSortLastest] = useState(true);
  const [cashierID, setCashierID] = useState<string | undefined>(undefined);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const orderHistoryLocalService = new OrderHistoryLocalService();
  const [prompt, setPrompt] = useState("Upload Orders");

  useEffect(function () {
    fetchOrderHistorys(selectedDate!);
  }, []);

  const fetchOrderHistorys = async (fetchDate: Date | undefined) => {
    setLoading(true);
    const data = await orderHistoryLocalService.getOrderHistories(getTodayParsedID(fetchDate));
    setOrderHistory(data);
    setLoading(false);
  };

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

  const uploadOrders = async () => {
    if (noConnection()) return;
    if (orderHistories.length === 0) {
      toast({ title: "No Order To Upload" });
      return;
    }
    setLoading(true);
    let finished = 0;
    setPrompt("Getting Latest Data...");
    await shopContext.fetchData();
    setPrompt("Uploading Started...");
    for (const order of orderHistories) {
      await OrderHistoryService.addOrderHistory(getTodayParsedID(order.date), order);
      await orderHistoryLocalService.deleteOrderHistory(
        getTodayParsedID(order.date),
        order.orderId
      );
      shopContext.removeStockByOrder(OrderHistory.fromJson(order));
      finished++;
      setPrompt(`Uploading ${Math.round((finished / orderHistories.length) * 100)} %`);
    }
    setPrompt("Uploading Completed");
    await shopContext.fetchData();
    await sleep(1);
    setPrompt("Upload Orders");
    fetchOrderHistorys(selectedDate!);
    setLoading(false);
  };

  const filteredOrders = filterOrderHistorys(orderHistories ?? []);
  const paginatedData = paginator(filteredOrders, paginateIndex, 10);

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Active Orders", route: "/order-active" },
          { name: "Order History Offline", route: "/order-history-offline" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Order History Offline</p>
        <div className="flex ">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchOrderHistorys(selectedDate);
              }
            }}
          >
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            className="ml-3"
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <Button
            className="ml-3 group"
            onClick={() => {
              uploadOrders();
            }}
          >
            <RocketIcon
              className="mr-2 group-hover:text-amber-500 duration-1000 transition-all group-hover:-translate-y-2 group-hover:translate-x-2 group-hover:opacity-0 
            scale-110 group-hover:scale-125"
            />{" "}
            {prompt}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="ml-3">
                {selectedDate?.toDateString() ?? "Choose Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date ?? new Date());
                  fetchOrderHistorys(date);
                }}
              ></Calendar>
            </PopoverContent>
          </Popover>

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
                  const selectedOrder = orderHistories.find((e) => e.orderId === orderId);
                  if (selectedOrder) {
                    await orderHistoryLocalService.deleteOrderHistory(
                      getTodayParsedID(selectedOrder!.date),
                      selectedOrder!.orderId
                    );
                  }
                }
                setLoading(false);
                await fetchOrderHistorys(selectedDate);
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
          className="flex flex-row flex-nowrap gap-5 mt-3"
          initial={{
            height: 0,
            x: 200,
            opacity: 0
          }}
          animate={{
            height: showInsight ? "auto" : 0,
            x: showInsight ? 0 : 200,
            opacity: showInsight ? 1 : 0
          }}
          transition={{ duration: 0.8 }}
        >
          {orderHistories.length > 0 && (
            <LineChartComponent
              title="Orders"
              description={moment(selectedDate).format("MMM DD y")}
              unitName="Orders"
              totalAmount={
                orderHistories.length === 0
                  ? 0
                  : orderHistories.map((e) => e.calculateTotal()).reduce((a, b) => a + b)
              }
              totalOrderNo={orderHistories.length}
              dataSet={groupOrdersByHour(orderHistories)}
            ></LineChartComponent>
          )}

          {orderHistories.length > 0 && (
            <PieChartComponent
              title="Products"
              description=""
              unitName="Item"
              dataSet={groupOrdersByCartItem(filteredOrders)}
            />
          )}

          {orderHistories.length > 0 && (
            <PieChartComponent
              title="Cashers"
              description=""
              unitName="Sale"
              dataSet={groupOrdersByCashier(orderHistories)}
              onSelected={(value) => {
                setCashierID(value);
              }}
            />
          )}

          {orderHistories.length > 0 && (
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
                  <TableCell colSpan={5} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((order, index) => (
                  <TableRow
                    key={index}
                    onClick={() => {
                      push(
                        `/order-history-offline/${getTodayParsedID(order.date)}/${order.orderId}`,
                        {
                          breadcumbRoutes: JSON.stringify([
                            { name: "Active Orders", route: "/order-active" },
                            {
                              name: "Order History Offline",
                              route: `/order-history-offline/${getTodayParsedID(order?.date ?? new Date())}`
                            }
                          ])
                        }
                      );
                    }}
                  >
                    {/* <TableCell className="pl-5">{index + 1}</TableCell> */}
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
                        push(
                          `/order-history-offline/${getTodayParsedID(order.date)}/${order.orderId}`,
                          {
                            breadcumbRoutes: JSON.stringify([
                              { name: "Active Orders", route: "/order-active" },
                              {
                                name: "Order History Offline",
                                route: `/order-history-offline/${getTodayParsedID(order?.date ?? new Date())}`
                              }
                            ])
                          }
                        );
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
                                await orderHistoryLocalService.deleteOrderHistory(
                                  getTodayParsedID(selectedDate),
                                  order.orderId
                                );
                                setLoading(false);
                                await OrderActiveService.addOrderHistory(order);
                                await CreditbookService.uncompleteOrderCredit(order);
                                fetchOrderHistorys(selectedDate);
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
                                await orderHistoryLocalService.deleteOrderHistory(
                                  getTodayParsedID(order.date),
                                  order.orderId
                                );
                                setLoading(false);
                                fetchOrderHistorys(selectedDate);
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
                  if (paginateIndex > lastIndex) {
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
