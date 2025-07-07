import { Children, useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { OrderHistory, OrderHistoryInterface } from "../interface/order_history";
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
  Plus,
  Printer,
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
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";

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
import orderHistoryLocalService from "../service/order_history_service";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import Loading from "react-loading";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@renderer/assets/shadcn/components/ui/tooltip";
import ItemService from "@renderer/product/service/item_service";
import { CartContext } from "../context/cart_context";
import { ShopContext } from "@renderer/product/context/shop_context";
import { Creditbook } from "@renderer/credit_book/interface/credit_book";
import { motion } from "framer-motion";
import CreditbookService from "@renderer/credit_book/service/credit_book_service";
import { CreditbookDialog } from "@renderer/credit_book/view/credit_book_landing_screen";
import { Item } from "@renderer/product/interface/item";
import { CartItem } from "../interface/cart_item";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { AppContext } from "@renderer/app/context/app_context";
import User from "@renderer/auth/interface/user";
import UserService from "@renderer/users/service/account_service";
import { AppRoles } from "@renderer/auth/interface/roles";
import UserContext from "@renderer/auth/context/user_context";
import OrderActiveLocalService from "../service/order_active_local_service";
import OrderHistoryLocalService from "../service/order_history_local_service";
import {
  CartDetailDialog,
  CreditBookSelectDialog,
  CustomItemDialog
} from "./order_active_detail_page";
import { MetaInputDialog } from "./order_history_detail_page";
import { PrintOrder } from "@renderer/app/view/printer_setting_page";

export function OrderActiveOfflineDetailPage() {
  const { orderId } = useParams();
  const { push } = useRouteContext();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderHistory>();
  const [scrollTop, setScrollTop] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedCreditBook, setSelectedCreditBook] = useState<Creditbook | undefined>();
  const [cashers, setCashers] = useState<User[]>([]);
  const [casherLoading, setCasherLoading] = useState(false);
  const { currentUser } = useContext(UserContext);

  const cartContext = useContext(CartContext);
  const shopContext = useContext(ShopContext);

  const { currency } = useContext(AppContext);

  const orderActiveLocalService = new OrderActiveLocalService();
  const orderHistoryLocalService = new OrderHistoryLocalService();

  useEffect(function () {
    loadData({ updateConfig: false });
    loadCashers();
  }, []);

  const loadData = async ({ updateConfig }: { updateConfig: boolean }) => {
    updateConfig ? setUpdating(true) : setLoading(true);
    if (orderId) {
      const data = await orderActiveLocalService.getOrderHistory(orderId);
      setOrder(data);
    }
    updateConfig ? setUpdating(false) : setLoading(false);
  };

  const loadCashers = async () => {
    setCasherLoading(true);
    const data = await UserService.getUsers();
    // setCashers(data.filter((e) => e.role === AppRoles.casher));
    setCashers(data);
    setCasherLoading(false);
  };

  const listenScroll = (event) => {
    if (event.target.scrollTop > 0) {
      setScrollTop(false);
    } else {
      setScrollTop(true);
    }
  };

  const processCheckOut = async () => {
    if (checkingOut) return;

    if (order!.orders.length === 0) {
      toast({ title: "No item to check out" });
      return;
    }

    const totalCost = order!.calculateTotal();
    const isCreditCustomer = order!.payAmount < totalCost;
    if (order!.payAmount > totalCost) {
      toast({ title: <p className="text-amber-500">Pay amount is greater than total cost</p> });
      return;
    }

    if (isCreditCustomer && selectedCreditBook === undefined) {
      toast({
        title: (
          <p className="text-red-500">
            Pay amount is not enough. Choose credit book or please pay completely
          </p>
        )
      });
      return;
    }

    order!.amount = order!.getAmount();
    order!.total = order!.calculateTotal();
    order!.paid = !isCreditCustomer;

    if (isCreditCustomer && selectedCreditBook !== undefined) {
      order!.creditBookId = selectedCreditBook.creditBookId;
    }

    setCheckingOut(true);
    await orderActiveLocalService.deleteOrderHistory(order!.orderId);
    await orderHistoryLocalService.addOrderHistory(getTodayParsedID(order!.date), order!);

    // add credit book record
    if (isCreditCustomer && selectedCreditBook !== undefined) {
      const creditAmount = totalCost - order!.payAmount;
      selectedCreditBook.records.unshift({
        cashRecordId: uniqueId(),
        name: order!.customer,
        note: `Credit ${creditAmount} from customer ${order!.customer}`,
        date: new Date(),
        amount: creditAmount,
        cashIn: false,
        attachedOrderId: order!.encodedOrderId
      });

      selectedCreditBook.attachedOrders = selectedCreditBook.attachedOrders.filter(
        (e) => e.orderId === order!.orderId
      );

      selectedCreditBook.attachedOrders.unshift({
        orderId: order!.orderId,
        storageRefPath: "",
        orderShortName: `${order!.customer} on ${formatOrderTime(order!.date)}`,
        orderCollectionName: getTodayParsedID(order!.date)
      });

      selectedCreditBook.creditAmount += creditAmount;
      await CreditbookService.updateCreditbook(selectedCreditBook);
    }

    setCheckingOut(false);
    push("/order-active");
  };

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Active Orders", route: "/order-active" },
          { name: order?.customer ?? orderId ?? "", route: "" }
        ]}
      />

      {loading && <LoadingWidget />}
      {!loading && order && (
        <div>
          <div className="flex flex-wrap">
            <div className="mt-3 w-1/2  ">
              <p className="text-lg">{order.customer} - Offline</p>

              <div className="mt-3 h-[70vh] border  rounded-xl overflow-hidden">
                <div
                  className={`${!scrollTop && "border-b bg-slate-50"} h-[6vh] p-3 pb-0  flex flex-row justify-between items-center`}
                >
                  <p className="font-medium mb-3">Orders</p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <CustomItemDialog
                          onCreated={async (cartItem) => {
                            if (order) {
                              setUpdating(true);
                              order.orders.push(cartItem);
                              order.amount = order.getAmount();
                              order.total = order.calculateTotal();
                              await orderActiveLocalService.updateOrderHistory(order);
                              await loadData({ updateConfig: true });
                            }
                          }}
                        >
                          <Button variant="ghost" size={"icon"}>
                            <Plus className="size-5" />
                          </Button>
                        </CustomItemDialog>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-foreground">
                        <p>Add Custom Item</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                            Price {product.price} {currency} • Quantity {product.quantity}
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
                              <ValueInputDialog
                                title={product.itemName}
                                description={`Enter quantity of ${product.itemName} to add`}
                                actionTitle="Add"
                                onSubmit={async (value) => {
                                  const quantity = parseNumber(value);
                                  if (!quantity) {
                                    toast({ title: "Qantity is not valid" });
                                    return;
                                  }
                                  if (quantity < 0) {
                                    toast({ title: "Quantity is less than 0" });
                                    return;
                                  }
                                  setUpdating(true);
                                  const result = await shopContext.removeStockByQuantity(
                                    product.itemId,
                                    value
                                  );
                                  if (result) {
                                    product.addQuantity(quantity);
                                    order.amount = order.getAmount();
                                    order.total = order.calculateTotal();
                                    await orderActiveLocalService.updateOrderHistory(order);
                                    await loadData({ updateConfig: true });

                                    await sleep(2);
                                    await shopContext.fetchData();
                                  }

                                  setUpdating(false);
                                }}
                              >
                                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                  Add Qantity
                                </DropdownMenuItem>
                              </ValueInputDialog>
                              <ValueInputDialog
                                title={product.itemName}
                                description={`Enter quantity of ${product.itemName} to remove`}
                                actionTitle="Remove"
                                onSubmit={async (value) => {
                                  const quantity = parseNumber(value);
                                  if (!quantity) {
                                    toast({ title: "Qantity is not valid" });
                                    return;
                                  }
                                  if (quantity > product.quantity) {
                                    toast({ title: "Quantity is greater than current quantity" });
                                    return;
                                  }
                                  setUpdating(true);
                                  await shopContext.addStockByQuantity(product.itemId, quantity);

                                  product.removeQuantity(quantity);

                                  if (product.quantity <= 0) {
                                    order.intelligentRemoveOrder(product.itemId);
                                  }

                                  order.amount = order.getAmount();
                                  order.total = order.calculateTotal();

                                  await orderActiveLocalService.updateOrderHistory(order);

                                  await loadData({ updateConfig: true });

                                  await sleep(2);
                                  await shopContext.fetchData();

                                  setUpdating(false);
                                }}
                              >
                                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                  Remove Qantity
                                </DropdownMenuItem>
                              </ValueInputDialog>
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
              <div className="flex justify-between items-center">
                <p className="font-medium mb-3">Order Information</p>

                <div>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <MetaInputDialog
                          onAdded={async (meta) => {
                            if (order.metaData) {
                              order.metaData[meta.metaName] = meta.metaValue;
                            } else {
                              order.metaData = {};
                              order.metaData[meta.metaName] = meta.metaValue;
                            }
                            setUpdating(true);
                            await orderActiveLocalService.updateOrderHistory(order);
                            await loadData({ updateConfig: true });
                          }}
                        >
                          <Button variant="outline" size={"icon"} className="px-0">
                            <Plus className="size-4" />
                          </Button>
                        </MetaInputDialog>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-foreground">
                        <p>Add Custom Meta</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <ConfirmDialog
                          actionVariant={"destructive"}
                          title="Delete Order"
                          description="Are you sure to delete this order ?"
                          actionTitle="Confirm"
                          onConfirm={async () => {
                            setLoading(true);
                            await shopContext.addStockByOrder(order);
                            await orderActiveLocalService.deleteOrderHistory(order.orderId);
                            setLoading(false);
                            push("/order-active");

                            await sleep(2);
                            await shopContext.fetchData();
                          }}
                        >
                          <Button variant={"outline"} size={"icon"} className="ml-2">
                            <Trash className="size-4" />
                          </Button>
                        </ConfirmDialog>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-foreground">
                        <p>Delete Order</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
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
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell className="pl-5">{order.customer}</TableCell>
                    <TableCell className="py-0.5 overflow-hidden">
                      <ValueInputDialog
                        title="Enter Customer"
                        initValue={order.customer}
                        type={"string"}
                        onSubmit={async (value) => {
                          order.customer = value;
                          setUpdating(true);
                          await orderActiveLocalService.updateOrderHistory(order);
                          await loadData({ updateConfig: true });
                        }}
                      >
                        <Button variant="ghost" size={"icon"}>
                          <Edit className="size-4" />
                        </Button>
                      </ValueInputDialog>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Casher</TableCell>
                    <TableCell className="pl-5">{order.casherName}</TableCell>
                    <TableCell className="py-0.5 overflow-clip">
                      {currentUser &&
                        (currentUser.role === AppRoles.admin ||
                          currentUser.role === AppRoles.superadmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size={"sm"}>
                                Switch
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuGroup>
                                {cashers &&
                                  cashers.length > 0 &&
                                  cashers.map((casher) => (
                                    <DropdownMenuItem
                                      defaultChecked={true}
                                      onSelect={async () => {
                                        const selectedCasher = cashers.find(
                                          (e) => e.docId === casher.docId
                                        );
                                        if (selectedCasher) {
                                          setUpdating(true);
                                          order.casherId = selectedCasher.docId;
                                          order.casherName = selectedCasher.name;
                                          await orderActiveLocalService.updateOrderHistory(order);
                                          await loadData({ updateConfig: true });
                                        }
                                      }}
                                    >
                                      {casher.name}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
                  <TableRow>
                    <TableCell>Discount</TableCell>
                    <TableCell className="pl-5">
                      {formatNumberWithCommas(order.discount)} {currency}
                    </TableCell>
                    <TableCell className="py-0.5 overflow-clip">
                      <ValueInputDialog
                        type={"number"}
                        initValue={order.discount}
                        title="Enter Discount"
                        onSubmit={async (value) => {
                          const inputDiscount = parseNumber(value);
                          if (inputDiscount) {
                            order.discount = inputDiscount;

                            setUpdating(true);
                            await orderActiveLocalService.updateOrderHistory(order);
                            await loadData({ updateConfig: true });
                          }
                        }}
                      >
                        <Button variant="ghost" size={"icon"}>
                          <Edit className="size-4" />
                        </Button>
                      </ValueInputDialog>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tax</TableCell>
                    <TableCell className="pl-5">
                      {formatNumberWithCommas(order.tag)} {currency}{" "}
                    </TableCell>
                    <TableCell className="py-0.5 overflow-clip">
                      <ValueInputDialog
                        type={"number"}
                        initValue={order.tag}
                        title="Enter Tax"
                        onSubmit={async (value) => {
                          const inputTax = parseNumber(value);
                          if (inputTax) {
                            order.tag = inputTax;

                            setUpdating(true);
                            await orderActiveLocalService.updateOrderHistory(order);
                            await loadData({ updateConfig: true });
                          }
                        }}
                      >
                        <Button variant="ghost" size={"icon"}>
                          <Edit className="size-4" />
                        </Button>
                      </ValueInputDialog>
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
                        <TableRow key={index}>
                          <TableCell>{e}</TableCell>
                          <TableCell
                            className={`${isPlainMeta ? "" : decreaseCost ? "text-green-500" : "text-red-500"} pl-5`}
                          >
                            {outputValue}
                          </TableCell>
                          <TableCell
                            className="py-0.5 overflow-clip"
                            onSelect={(event) => event.preventDefault()}
                            onClick={(event) => event.preventDefault()}
                          >
                            <ConfirmDialog
                              title={`Delete ${e}`}
                              description={`Are you sure to delete ${e} ?`}
                              actionTitle="Delete"
                              actionVariant="destructive"
                              onConfirm={async () => {
                                delete order.metaData[e];
                                setUpdating(true);
                                await orderActiveLocalService.updateOrderHistory(order);
                                await loadData({ updateConfig: true });
                              }}
                            >
                              <Button
                                variant="ghost"
                                size={"icon"}
                              >
                                <Trash className="size-4 " />
                              </Button>
                            </ConfirmDialog>
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
                  <TableRow>
                    <TableCell>Pay Amount</TableCell>
                    <TableCell className="pl-5">
                      {formatNumberWithCommas(order.payAmount)} {currency}
                    </TableCell>
                    <TableCell className="py-0.5">
                      <ValueInputDialog
                        type={"number"}
                        title="Enter Pay Amount"
                        onSubmit={async (value) => {
                          const inputNumber = parseNumber(value);
                          if (inputNumber) {
                            order.payAmount = inputNumber;
                            setUpdating(true);
                            await orderActiveLocalService.updateOrderHistory(order);
                            await loadData({ updateConfig: true });
                          }
                        }}
                      >
                        <Button variant="ghost" size={"icon"}>
                          <Edit className="size-4" />
                        </Button>
                      </ValueInputDialog>
                    </TableCell>
                  </TableRow>
                  {order.payAmount < order.calculateTotal() && (
                    <>
                      <TableRow>
                        <TableCell>Left Amount</TableCell>
                        <TableCell className="text-red-500 pl-5">
                          {formatNumberWithCommas(order.calculateTotal() - order.payAmount)}{" "}
                        </TableCell>
                        <TableCell className="py-0.5">
                          <Button
                            variant="ghost"
                            size={"icon"}
                            
                          >
                            <Edit className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Credit Book</TableCell>
                        <TableCell>{selectedCreditBook?.name ?? "No Credit Book"}</TableCell>
                        <TableCell className="py-0.5">
                          <CreditBookSelectDialog
                            onSelected={(book) => {
                              setSelectedCreditBook(book);
                            }}
                          >
                            <Button variant="ghost" size={"sm"}>
                              Choose
                            </Button>
                          </CreditBookSelectDialog>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-3">
                <Button
                  variant="outline"
                  size={"sm"}
                  onClick={async () => {
                    order.total = order.calculateTotal();
                    order.payAmount = order.total;
                    setUpdating(true);
                    await orderActiveLocalService.updateOrderHistory(order);
                    await loadData({ updateConfig: true });
                  }}
                >
                  <CircleCheck className="size-4 text-green-600 mr-2" /> Pay All Amount
                </Button>
                <p className="font-medium">{formatNumberWithCommas(order.payAmount)}</p>
              </div>
              {updating ? (
                <LoadingWidget />
              ) : (
                <div className="mt-5 flex gap-x-4 border-b pb-20">
                  <PrintOrder order={order} creditBookId={order.creditBookId ?? undefined}>
                    <Button className="w-full" variant={"outline"}>
                      <Printer className="text-black size-4 mr-5" /> Print Receipt
                    </Button>
                  </PrintOrder>

                  <Button
                    className="w-full"
                    onClick={processCheckOut}
                    variant={checkingOut ? "outline" : "default"}
                  >
                    {checkingOut ? <LoadingWidget /> : "Check Out"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
