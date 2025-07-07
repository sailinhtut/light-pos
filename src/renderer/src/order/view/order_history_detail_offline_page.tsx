import { Children, useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { OrderHistory, OrderHistoryInterface } from "../interface/order_history";
import OrderActiveService from "../service/order_active_service";
import LoadingWidget from "@renderer/app/view/components/loading";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { ScrollArea, ScrollBar } from "@renderer/assets/shadcn/components/ui/scroll-area";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
  durationGenerator,
  formatNumberWithCommas,
  getTodayParsedID,
  noConnection,
  parseNumber,
  sleep,
  uniqueId
} from "@renderer/utils/general_utils";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Check,
  CheckCheck,
  CheckCircle,
  CircleCheck,
  Edit,
  EllipsisVertical,
  LucideRocket,
  Plus,
  Printer,
  Rocket,
  RocketIcon,
  Trash
} from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@renderer/assets/shadcn/components/ui/table";
import { formatOrderTime } from "../utility/order_utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@renderer/assets/shadcn/components/ui/dialog";
import { DialogDescription, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { FieldValues, useForm } from "react-hook-form";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { useRouteContext } from "@renderer/router";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import Loading from "react-loading";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";
import PromptDialog from "@renderer/app/view/components/prompt_dialog";
import OrderHistoryLocalService from "../service/order_history_local_service";
import OrderActiveLocalService from "../service/order_active_local_service";
import { RotateCounterClockwiseIcon } from "@radix-ui/react-icons";
import OrderHistoryService from "../service/order_history_service";
import { ShopContext } from "@renderer/product/context/shop_context";
import { AppContext } from "@renderer/app/context/app_context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { CartDetailDialog } from "./order_active_detail_page";
import { PrintOrder } from "@renderer/app/view/printer_setting_page";

export function OrderHistoryDetailOfflinePage() {
  const { date, orderId } = useParams();
  const { push } = useRouteContext();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderHistory>();
  const [scrollTop, setScrollTop] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [searchParams] = useSearchParams();
  const { currency } = useContext(AppContext);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const shopContext = useContext(ShopContext);

  const orderHistoryLocalService = new OrderHistoryLocalService();

  useEffect(function () {
    loadData({ updateConfig: false });
  }, []);

  const loadData = async ({ updateConfig }: { updateConfig?: boolean }) => {
    updateConfig ? setUpdating(true) : setLoading(true);
    if (orderId && date) {
      const data = await orderHistoryLocalService.getOrderHistory(date, orderId);
      setOrder(data);
    }
    updateConfig ? setUpdating(false) : setLoading(false);
  };

  const listenScroll = (event) => {
    if (event.target.scrollTop > 0) {
      setScrollTop(false);
    } else {
      setScrollTop(true);
    }
  };

  const uploadOrder = async () => {
    if (noConnection()) return;
    if (!order) return;
    setLoading(true);
    await OrderHistoryService.addOrderHistory(getTodayParsedID(order.date), order);
    await new OrderHistoryLocalService().deleteOrderHistory(
      getTodayParsedID(order.date),
      order.orderId
    );
    shopContext.removeStockByOrder(OrderHistory.fromJson(order));
    setLoading(false);
    push("/order-history-offline");
    sleep(2);
    shopContext.fetchData();
  };

  const payCredit = async (amount: number) => {
    const leftAmount = order!.calculateTotal() - order!.payAmount;
    if (amount > leftAmount) {
      toast({ title: "Amount need to be less than credit amount" });
      return;
    }
    order!.payAmount += amount;
    order!.paid = order!.payAmount >= order!.calculateTotal();

    setUpdating(true);
    await orderHistoryLocalService.updateOrderHistory(getTodayParsedID(order!.date), order!);
    if (!order!.creditBookId) {
      setUpdating(false);
      return;
    }

    const creditBook = await CreditbookService.getCreditbook(order!.creditBookId!);

    if (creditBook) {
      creditBook.records.push({
        cashRecordId: uniqueId(10),
        date: new Date(),
        amount: amount,
        note: `Pay ${formatNumberWithCommas(amount)}`,
        name: order!.customer,
        cashIn: true,
        attachedOrderId: order!.encodedOrderId
      });
      if (order!.paid) {
        creditBook.attachedOrders = creditBook.attachedOrders.filter(
          (e) => e.orderId !== order!.orderId
        );
      }
      creditBook.creditAmount -= amount;
      await CreditbookService.updateCreditbook(creditBook);

      toast({
        title: "Updated Amount"
      });
    }
    loadData({ updateConfig: true });
  };

  const paidCredit = async () => {
    const leftAmount = order!.calculateTotal() - order!.payAmount;

    setUpdating(true);

    const creditBook = await CreditbookService.getCreditbook(order!.creditBookId!);

    if (creditBook) {
      creditBook.attachedOrders = creditBook.attachedOrders.filter(
        (e) => e.orderId !== order!.orderId
      );
      creditBook.records.push({
        cashRecordId: uniqueId(10),
        date: new Date(),
        amount: leftAmount,
        note: `Completely Pay ${formatNumberWithCommas(leftAmount)}`,
        name: order!.customer,
        cashIn: true,
        attachedOrderId: order!.encodedOrderId
      });
      creditBook.creditAmount -= leftAmount;
      creditBook.attachedOrders = creditBook.attachedOrders.filter(
        (e) => e.orderId !== order!.orderId
      );
      await CreditbookService.updateCreditbook(creditBook);

      toast({
        title: "Successfully Paid"
      });
    }

    order!.payAmount = order!.calculateTotal();
    order!.paid = true;
    order!.creditBookId = null;
    await orderHistoryLocalService.updateOrderHistory(getTodayParsedID(order!.date), order!);

    loadData({ updateConfig: true });
  };

  const breadcumRoutes = JSON.parse(searchParams.get("breadcumbRoutes") ?? "[]");

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          ...breadcumRoutes,
          { name: order?.customer ?? orderId ?? "", route: "" }
        ]}
      />

      {loading && <LoadingWidget />}
      {!loading && order && (
        <div>
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
                      {formatNumberWithCommas(order.getProfitOrLoss())} {currency}
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
              {updating && <LoadingWidget />}
              {order.isCreditOrder && !updating && (
                <div className="mt-5 flex gap-x-4 ">
                  <ValueInputDialog
                    title="Enter Credit Amount"
                    actionTitle="Pay"
                    onSubmit={(value) => {
                      const amount = parseNumber(value);
                      if (amount) {
                        payCredit(amount);
                      }
                    }}
                  >
                    <Button className="w-full" variant={"outline"} onClick={() => {}}>
                      Pay Credit
                    </Button>
                  </ValueInputDialog>

                  <ConfirmDialog
                    title="Paid Order"
                    actionVariant={"default"}
                    actionTitle="Pay"
                    description="Are you sure to pay completely ?"
                    onConfirm={() => paidCredit()}
                  >
                    <Button className="w-full bg-green-500 hover:bg-green-600">Paid</Button>
                  </ConfirmDialog>
                </div>
              )}

              {order.creditBookId && (
                <div className="mt-2 flex gap-x-4 ">
                  <Button
                    className="w-full"
                    variant={"outline"}
                    onClick={() =>
                      push(`/order-history/credit-book/${order.creditBookId}`, {
                        date: getTodayParsedID(order.date),
                        orderId: order.orderId,
                        customerName: order.customer
                      })
                    }
                  >
                    Open Credit Book
                  </Button>
                </div>
              )}
              <Button className="mt-2 w-full" onClick={uploadOrder}>
                Upload Order
              </Button>
              <PrintOrder order={order} creditBookId={order.creditBookId ?? undefined}>
                <Button className="mt-2 w-full" variant={"outline"}>
                  <Printer className="text-black size-4 mr-5" /> Print Receipt
                </Button>
              </PrintOrder>

              <PromptDialog
                onConfirmed={async () => {
                  setLoading(true);
                  await orderHistoryLocalService.deleteOrderHistory(
                    getTodayParsedID(order.date),
                    order.orderId
                  );
                  setLoading(false);
                  await new OrderActiveLocalService().addOrderHistory(order);
                  await CreditbookService.uncompleteOrderCredit(order);
                  push("/order-active");
                }}
                title="Uncomplete Order"
                description={`Are you sure to uncomplete ${order.customer} ?`}
                actionTitle="Confirm"
              >
                <Button className="w-full mt-2" variant={"outline"}>
                  Uncomplete Order
                </Button>
              </PromptDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
